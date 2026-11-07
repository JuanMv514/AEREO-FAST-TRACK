/**
 * AeroFastTrack - Servicio ReservationService (Reservas y Pasajeros)
 * Refleja el Mapa CRUD del Módulo 5 en Java y la regla de sillas y manifiesto
 */

import { DuplicateException, NotFoundException, BusinessRuleException, ValidationException } from '../core/exceptions.js';
import { Validator } from '../core/validator.js';
import { Reservation } from '../models/reservation.js';
import { ReservationDetail } from '../models/reservation-detail.js';
import { Seat } from '../models/seat.js';

export class ReservationService {
  /**
   * @param {InMemoryRepository} reservationRepo 
   * @param {CustomerService} customerService 
   * @param {FlightService} flightService 
   * @param {IdGenerator} reservationIdGen 
   * @param {IdGenerator} detailIdGen 
   */
  constructor(reservationRepo, customerService, flightService, reservationIdGen, detailIdGen) {
    this._reservationRepo = reservationRepo;
    this._customerService = customerService;
    this._flightService = flightService;
    this._resIdGen = reservationIdGen;
    this._detailIdGen = detailIdGen;
  }

  createReservation({ customerId, flightId, passengers = [] }) {
    if (!Array.isArray(passengers) || passengers.length === 0) {
      throw new BusinessRuleException('Una reserva debe incluir al menos un pasajero');
    }

    const customer = this._customerService.getCustomer(customerId);
    const flight = this._flightService.getFlight(flightId);

    // Regla: no permitir reservas en vuelos que ya salieron
    if (flight.hasDeparted()) {
      throw new BusinessRuleException(`No se puede reservar el vuelo '${flight.flightName}' porque ya salió o ha iniciado su itinerario`);
    }

    // Regla central: ninguna silla puede asignarse a dos pasajeros en el mismo vuelo
    const occupiedSeats = this.listOccupiedSeats(flight.id);

    // Validar duplicados dentro de la lista de pasajeros a agregar
    const seenSeats = new Set();
    const seenDocs = new Set();

    const details = passengers.map((p) => {
      const seat = new Seat(p.rowNumber, p.seatNumber);

      if (occupiedSeats.includes(seat.code)) {
        throw new BusinessRuleException(`La silla ${seat.code} ya se encuentra ocupada en el vuelo ${flight.flightName}`);
      }
      if (seenSeats.has(seat.code)) {
        throw new BusinessRuleException(`La silla ${seat.code} está asignada a más de un pasajero en la solicitud`);
      }
      seenSeats.add(seat.code);

      const docClean = Validator.requireText(p.document, 'documento de pasajero', 20).replace(/\s+/g, '');
      if (seenDocs.has(docClean.toLowerCase())) {
        throw new BusinessRuleException(`El pasajero con documento ${p.document} aparece repetido en la solicitud`);
      }
      seenDocs.add(docClean.toLowerCase());

      const detailId = this._detailIdGen.nextId();
      return new ReservationDetail(detailId, p.fullName, docClean, seat);
    });

    const resId = this._resIdGen.nextId();
    const reservation = new Reservation(resId, customer, flight, details);
    return this._reservationRepo.create(reservation);
  }

  getReservation(id) {
    const res = this._reservationRepo.findById(id);
    if (!res) throw new NotFoundException(`Reserva con identificador #${id} no encontrada`, 'Reservation');
    return res;
  }

  listReservations() {
    return this._reservationRepo.findAll().sort((a, b) => b.id - a.id);
  }

  listReservationsByCustomer(customerId) {
    const cust = this._customerService.getCustomer(customerId);
    return this._reservationRepo._getAllValues()
      .filter((r) => r.customer.id === cust.id)
      .sort((a, b) => a.flight.departureDateTime - b.flight.departureDateTime);
  }

  listReservationsByFlight(flightId) {
    const fid = Number(flightId);
    return this._reservationRepo._getAllValues().filter((r) => r.flight.id === fid);
  }

  addPassenger(reservationId, { fullName, document, rowNumber, seatNumber }) {
    const res = this.getReservation(reservationId);

    // Validar si el vuelo ya salió
    if (res.flight.hasDeparted()) {
      throw new BusinessRuleException('No se pueden añadir pasajeros a un vuelo que ya salió');
    }

    const seat = new Seat(rowNumber, seatNumber);
    if (this.isSeatOccupied(res.flight.id, seat.rowNumber, seat.seatNumber)) {
      throw new BusinessRuleException(`La silla ${seat.code} ya está ocupada en el vuelo ${res.flight.flightName}`);
    }

    const detailId = this._detailIdGen.nextId();
    const detail = new ReservationDetail(detailId, fullName, document, seat);
    res.addDetail(detail);

    return this._reservationRepo.update(res);
  }

  removePassenger(reservationId, detailId) {
    const res = this.getReservation(reservationId);
    res.removeDetail(detailId);
    return this._reservationRepo.update(res);
  }

  changeSeat(reservationId, detailId, newRow, newSeatNumber) {
    const res = this.getReservation(reservationId);
    const detail = res.findDetailById(detailId);
    if (!detail) {
      throw new NotFoundException(`Detalle con ID ${detailId} no encontrado en la reserva #${reservationId}`);
    }

    const targetSeat = new Seat(newRow, newSeatNumber);

    // Si es la misma silla no hace nada
    if (detail.seat.equals(targetSeat)) {
      return res;
    }

    // Verificar si la silla está ocupada en el vuelo por otro pasajero
    const occupied = this.isSeatOccupied(res.flight.id, targetSeat.rowNumber, targetSeat.seatNumber);
    if (occupied) {
      throw new BusinessRuleException(`La silla ${targetSeat.code} ya se encuentra ocupada en el vuelo ${res.flight.flightName}`);
    }

    detail.seat = targetSeat;
    return this._reservationRepo.update(res);
  }

  updatePassenger(reservationId, detailId, { fullName, document }) {
    const res = this.getReservation(reservationId);
    const detail = res.findDetailById(detailId);
    if (!detail) {
      throw new NotFoundException(`Detalle con ID ${detailId} no encontrado en la reserva`);
    }

    if (fullName !== undefined) {
      detail.passengerFullName = fullName;
    }
    if (document !== undefined) {
      const cleanDoc = document.replace(/\s+/g, '');
      // Validar que no se repita con otro pasajero de la misma reserva
      const duplicate = res.details.some(
        (d) => d.id !== detail.id && d.passengerDocument.toLowerCase() === cleanDoc.toLowerCase()
      );
      if (duplicate) {
        throw new BusinessRuleException(`Ya existe otro pasajero con el documento ${cleanDoc} en esta misma reserva`);
      }
      detail.passengerDocument = cleanDoc;
    }

    return this._reservationRepo.update(res);
  }

  changeReservationFlight(reservationId, newFlightId) {
    const res = this.getReservation(reservationId);
    const newFlight = this._flightService.getFlight(newFlightId);

    if (newFlight.hasDeparted()) {
      throw new BusinessRuleException('No se puede cambiar a un vuelo que ya salió');
    }

    // Comprobar que todas las sillas de los pasajeros de la reserva estén libres en el nuevo vuelo
    const newFlightOccupied = this.listOccupiedSeats(newFlight.id);
    for (const detail of res.details) {
      if (newFlightOccupied.includes(detail.seat.code)) {
        throw new BusinessRuleException(`La silla ${detail.seat.code} no está disponible en el nuevo vuelo ${newFlight.flightName}`);
      }
    }

    res.flight = newFlight;
    return this._reservationRepo.update(res);
  }

  cancelReservation(reservationId) {
    const res = this.getReservation(reservationId);
    // Elimina la reserva con todos sus detalles (la silla queda liberada)
    return this._reservationRepo.deleteById(res.id);
  }

  customerHasReservations(customerId) {
    const cid = String(customerId);
    return this._reservationRepo._getAllValues().some((r) => r.customer.id === cid);
  }

  flightHasReservations(flightId) {
    const fid = Number(flightId);
    return this._reservationRepo._getAllValues().some((r) => r.flight.id === fid);
  }

  /**
   * Retorna una lista de códigos de sillas ocupadas en el vuelo especificado.
   * @param {number} flightId 
   * @returns {string[]}
   */
  listOccupiedSeats(flightId) {
    const fid = Number(flightId);
    const flightReservations = this.listReservationsByFlight(fid);
    const occupied = [];
    flightReservations.forEach((r) => {
      r.details.forEach((d) => {
        occupied.push(d.seat.code);
      });
    });
    return occupied;
  }

  isSeatOccupied(flightId, rowNumber, seatNumber) {
    const checkSeat = new Seat(rowNumber, seatNumber);
    const occupied = this.listOccupiedSeats(flightId);
    return occupied.includes(checkSeat.code);
  }

  countPassengersByFlight(flightId) {
    const fid = Number(flightId);
    const flightReservations = this.listReservationsByFlight(fid);
    return flightReservations.reduce((acc, r) => acc + r.details.length, 0);
  }

  /**
   * Manifiesto de vuelo: lista de todos los pasajeros ordenada por silla.
   * @param {number} flightId 
   * @returns {Array}
   */
  getFlightManifest(flightId) {
    const flight = this._flightService.getFlight(flightId);
    const flightReservations = this.listReservationsByFlight(flight.id);
    const manifest = [];

    flightReservations.forEach((r) => {
      r.details.forEach((d) => {
        manifest.push({
          reservationId: r.id,
          customerName: r.customer.fullName,
          passengerFullName: d.passengerFullName,
          passengerDocument: d.passengerDocument,
          seat: d.seat,
          seatCode: d.seat.code,
        });
      });
    });

    // Ordenar por fila y número de silla
    return manifest.sort((a, b) => a.seatCode.localeCompare(b.seatCode, undefined, { numeric: true }));
  }

  countReservations() {
    return this._reservationRepo.count();
  }
}
