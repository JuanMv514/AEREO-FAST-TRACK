/**
 * AeroFastTrack - Servicio FlightService (Vuelos)
 * Refleja el Mapa CRUD del Módulo 4 en Java y el reporte mensual uspVuelosPorAerolinea
 */

import { DuplicateException, NotFoundException, BusinessRuleException, ValidationException } from '../core/exceptions.js';
import { Validator } from '../core/validator.js';
import { Flight } from '../models/flight.js';

export class FlightService {
  /**
   * @param {InMemoryRepository} flightRepo 
   * @param {LocationService} locationService 
   * @param {AirlineService} airlineService 
   * @param {IdGenerator} flightIdGenerator 
   */
  constructor(flightRepo, locationService, airlineService, flightIdGenerator) {
    this._flightRepo = flightRepo;
    this._locationService = locationService;
    this._airlineService = airlineService;
    this._flightIdGen = flightIdGenerator;
    this._reservationChecker = null; // Para verificar reservas antes de borrar o cancelar
  }

  setReservationChecker(checker) {
    this._reservationChecker = checker;
  }

  createFlight({ flightName, departureId, arrivalId, departureDate, departureTime, arrivalDate, arrivalTime, airlineId }) {
    const cleanCode = Validator.requireText(flightName, 'código de vuelo', 8).toUpperCase();

    // Regla: código único
    if (this._flightRepo._getAllValues().some((f) => f.flightName === cleanCode)) {
      throw new DuplicateException(`Ya existe un vuelo programado con el código '${cleanCode}'`, 'Flight');
    }

    // Regla: servicios oficiales de ubicación y aerolínea
    const departure = this._locationService.getAirport(departureId);
    const arrival = this._locationService.getAirport(arrivalId);
    const airline = this._airlineService.getAirline(airlineId);

    const nextId = this._flightIdGen.nextId();
    const flight = new Flight(
      nextId,
      cleanCode,
      departure,
      arrival,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      airline
    );

    return this._flightRepo.create(flight);
  }

  getFlight(id) {
    const flight = this._flightRepo.findById(id);
    if (!flight) throw new NotFoundException(`Vuelo con ID '${id}' no encontrado`, 'Flight');
    return flight;
  }

  getFlightByName(flightName) {
    if (!flightName) throw new ValidationException('El código del vuelo es obligatorio');
    const code = flightName.toUpperCase().trim();
    const flight = this._flightRepo._getAllValues().find((f) => f.flightName === code);
    if (!flight) throw new NotFoundException(`Vuelo con código '${flightName}' no encontrado`, 'Flight');
    return flight;
  }

  listFlights() {
    // Ordenados por fecha y hora de salida
    return this._flightRepo.findAll().sort((a, b) => a.departureDateTime - b.departureDateTime);
  }

  updateFlight(id, { flightName, departureId, arrivalId, departureDate, departureTime, arrivalDate, arrivalTime, airlineId }) {
    const flight = this.getFlight(id);

    if (flightName !== undefined) {
      const cleanCode = Validator.requireText(flightName, 'código de vuelo', 8).toUpperCase();
      const codeExists = this._flightRepo._getAllValues().some(
        (f) => f.id !== flight.id && f.flightName === cleanCode
      );
      if (codeExists) {
        throw new DuplicateException(`Ya existe otro vuelo con el código '${cleanCode}'`, 'Flight');
      }
      flight.flightName = cleanCode;
    }

    if (airlineId !== undefined) {
      flight.airline = this._airlineService.getAirline(airlineId);
    }

    const newDep = departureId !== undefined ? this._locationService.getAirport(departureId) : flight.departure;
    const newArr = arrivalId !== undefined ? this._locationService.getAirport(arrivalId) : flight.arrival;

    if (newDep.id === newArr.id) {
      throw new BusinessRuleException('El aeropuerto de salida y de llegada deben ser distintos');
    }

    flight.departure = newDep;
    flight.arrival = newArr;

    const depDate = departureDate !== undefined ? departureDate : flight.departureDate;
    const depTime = departureTime !== undefined ? departureTime : flight.departureTime;
    const arrDate = arrivalDate !== undefined ? arrivalDate : flight.arrivalDate;
    const arrTime = arrivalTime !== undefined ? arrivalTime : flight.arrivalTime;

    flight.reschedule(depDate, depTime, arrDate, arrTime);
    return this._flightRepo.update(flight);
  }

  deleteFlight(id) {
    const flight = this.getFlight(id);
    // Integridad referencial: rechazo si tiene reservas
    if (this._reservationChecker && this._reservationChecker.flightHasReservations(flight.id)) {
      throw new BusinessRuleException(`No se puede cancelar o eliminar el vuelo '${flight.flightName}' porque tiene reservas asociadas`);
    }
    return this._flightRepo.deleteById(id);
  }

  listFlightsByAirline(airlineId) {
    const aid = Number(airlineId);
    return this.listFlights().filter((f) => f.airline.id === aid);
  }

  listFlightsBetween(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new ValidationException('El rango de fechas requiere fecha inicial y final');
    }
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    if (start > end) {
      throw new BusinessRuleException('La fecha inicial no puede ser posterior a la fecha final');
    }
    return this.listFlights().filter((f) => {
      const dep = f.departureDateTime;
      return dep >= start && dep <= end;
    });
  }

  listFlightsByRoute(depAirportId, arrAirportId) {
    return this.listFlights().filter(
      (f) => f.departure.id === depAirportId && f.arrival.id === arrAirportId
    );
  }

  countFlightsByAirline(airlineId) {
    const aid = Number(airlineId);
    return this._flightRepo._getAllValues().filter((f) => f.airline.id === aid).length;
  }

  airlineHasFlights(airlineId) {
    const aid = Number(airlineId);
    return this._flightRepo._getAllValues().some((f) => f.airline.id === aid);
  }

  airportHasFlights(airportId) {
    return this._flightRepo._getAllValues().some(
      (f) => f.departure.id === airportId || f.arrival.id === airportId
    );
  }

  countFlights() {
    return this._flightRepo.count();
  }

  /**
   * Reporte 'vuelos por aerolínea' (año y mes) - traducción de uspVuelosPorAerolinea
   * Salida: Mapa/Objeto con aerolíneas en orden alfabético y sus vuelos correspondientes
   * ordenados cronológicamente por salida.
   */
  listFlightsByAirlineInMonth(year, month) {
    const y = Number(year);
    const m = Number(month);

    if (isNaN(y) || y < 2000 || y > 2100) {
      throw new ValidationException('Año inválido para el reporte', 'year');
    }
    if (isNaN(m) || m < 1 || m > 12) {
      throw new ValidationException('El mes debe estar entre 1 y 12', 'month');
    }

    const monthStr = String(m).padStart(2, '0');
    const prefix = `${y}-${monthStr}`;

    const matchingFlights = this.listFlights().filter((f) => f.departureDate.startsWith(prefix));

    // Agrupar por aerolínea
    const groups = new Map();
    // Obtener todas las aerolíneas ordenadas alfabéticamente
    const airlines = this._airlineService.listAirlines();
    airlines.forEach((airline) => {
      const flightsOfAirline = matchingFlights.filter((f) => f.airline.id === airline.id);
      if (flightsOfAirline.length > 0) {
        groups.set(airline, flightsOfAirline);
      }
    });

    return groups;
  }
}
