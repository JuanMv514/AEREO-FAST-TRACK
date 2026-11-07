/**
 * AeroFastTrack - Modelo Reservation (Reserva)
 * Refleja tblReservations / Clase Reservation en Java (Composición de detalles)
 */

import { Validator } from '../core/validator.js';
import { BusinessRuleException, ValidationException } from '../core/exceptions.js';
import { Customer } from './customer.js';
import { Flight } from './flight.js';
import { ReservationDetail } from './reservation-detail.js';

export class Reservation {
  /**
   * @param {number} id Identificador numérico de la reserva
   * @param {Customer} customer Cliente que realiza la reserva
   * @param {Flight} flight Vuelo reservado
   * @param {ReservationDetail[]} initialDetails Lista inicial de pasajeros (mínimo 1)
   * @param {number} maxPassengers Límite máximo de pasajeros por reserva (default: 9)
   */
  constructor(id, customer, flight, initialDetails = [], maxPassengers = 9) {
    this._id = Validator.requirePositive(id, 'id de reserva');

    Validator.requireNonNull(customer, 'cliente');
    if (!(customer instanceof Customer)) {
      throw new Error('customer debe ser una instancia de Customer');
    }
    this._customer = customer;

    Validator.requireNonNull(flight, 'vuelo');
    if (!(flight instanceof Flight)) {
      throw new Error('flight debe ser una instancia de Flight');
    }
    this._flight = flight;

    this._maxPassengers = maxPassengers;
    this._details = [];

    if (!Array.isArray(initialDetails) || initialDetails.length === 0) {
      throw new BusinessRuleException('Una reserva debe incluir al menos un pasajero');
    }

    initialDetails.forEach((d) => this.addDetail(d));
  }

  get id() {
    return this._id;
  }

  get customer() {
    return this._customer;
  }

  get flight() {
    return this._flight;
  }

  set flight(newFlight) {
    Validator.requireNonNull(newFlight, 'vuelo');
    if (!(newFlight instanceof Flight)) {
      throw new Error('flight debe ser una instancia de Flight');
    }
    this._flight = newFlight;
  }

  get maxPassengers() {
    return this._maxPassengers;
  }

  /**
   * Devuelve una copia superficial de la lista interna para proteger el encapsulamiento.
   * @returns {ReservationDetail[]}
   */
  get details() {
    return [...this._details];
  }

  /**
   * Agrega un pasajero a la reserva validando las reglas internas:
   * - No superar el máximo permitido.
   * - No repetir el mismo documento en la misma reserva.
   * - No repetir la misma silla dentro de la misma reserva.
   * @param {ReservationDetail} detail 
   */
  addDetail(detail) {
    Validator.requireNonNull(detail, 'detalle de reserva');
    if (!(detail instanceof ReservationDetail)) {
      throw new Error('detail debe ser una instancia de ReservationDetail');
    }

    if (this._details.length >= this._maxPassengers) {
      throw new BusinessRuleException(`No se pueden registrar más de ${this._maxPassengers} pasajeros por reserva`);
    }

    // Regla: no repetir documento en la misma reserva
    const docExists = this._details.some(
      (d) => d.passengerDocument.toLowerCase() === detail.passengerDocument.toLowerCase()
    );
    if (docExists) {
      throw new BusinessRuleException(`El pasajero con documento ${detail.passengerDocument} ya se encuentra registrado en esta reserva`);
    }

    // Regla: no repetir silla en la misma reserva
    const seatExists = this._details.some(
      (d) => d.seat.equals(detail.seat)
    );
    if (seatExists) {
      throw new BusinessRuleException(`La silla ${detail.seat.code} ya está asignada a otro pasajero en esta misma reserva`);
    }

    this._details.push(detail);
  }

  /**
   * Quita un pasajero de la reserva por su ID de detalle.
   * Regla: No puede dejar la reserva sin pasajeros.
   * @param {number} detailId 
   */
  removeDetail(detailId) {
    if (this._details.length <= 1) {
      throw new BusinessRuleException('Una reserva no puede quedar sin pasajeros. Si desea cancelarla por completo, cancele la reserva');
    }
    const idx = this._details.findIndex((d) => d.id === Number(detailId));
    if (idx === -1) {
      throw new ValidationException(`No se encontró el pasajero con ID de detalle ${detailId}`);
    }
    this._details.splice(idx, 1);
  }

  findDetailById(detailId) {
    return this._details.find((d) => d.id === Number(detailId)) || null;
  }

  toString() {
    return `Reserva #${this._id} - Cliente: ${this._customer.fullName} - Vuelo: ${this._flight.flightName} (${this._details.length} pasajeros)`;
  }

  equals(other) {
    if (!other || !(other instanceof Reservation)) return false;
    return this._id === other.id;
  }
}
