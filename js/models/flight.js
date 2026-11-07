/**
 * AeroFastTrack - Modelo Flight (Vuelo)
 * Refleja tblFlights / Clase Flight en Java
 */

import { Validator } from '../core/validator.js';
import { ValidationException, BusinessRuleException } from '../core/exceptions.js';
import { Airport } from './airport.js';
import { Airline } from './airline.js';

export class Flight {
  /**
   * @param {number} id Identificador numérico asignado por generador
   * @param {string} flightName Código de vuelo (máximo 8 caracteres alfanuméricos)
   * @param {Airport} departure Aeropuerto de salida
   * @param {Airport} arrival Aeropuerto de llegada
   * @param {string} departureDate Fecha de salida (YYYY-MM-DD)
   * @param {string} departureTime Hora de salida (HH:mm)
   * @param {string} arrivalDate Fecha de llegada (YYYY-MM-DD)
   * @param {string} arrivalTime Hora de llegada (HH:mm)
   * @param {Airline} airline Aerolínea que opera el vuelo
   */
  constructor(id, flightName, departure, arrival, departureDate, departureTime, arrivalDate, arrivalTime, airline) {
    this._id = Validator.requirePositive(id, 'id de vuelo');

    const cleanCode = Validator.requireText(flightName, 'código de vuelo', 8).toUpperCase();
    if (!/^[A-Z0-9]{2,8}$/.test(cleanCode)) {
      throw new ValidationException('El código del vuelo debe contener entre 2 y 8 caracteres alfanuméricos sin espacios', 'flightName');
    }
    this._flightName = cleanCode;

    Validator.requireNonNull(departure, 'aeropuerto de salida');
    Validator.requireNonNull(arrival, 'aeropuerto de llegada');
    if (!(departure instanceof Airport) || !(arrival instanceof Airport)) {
      throw new Error('departure y arrival deben ser instancias de Airport');
    }

    if (departure.id === arrival.id) {
      throw new BusinessRuleException('El aeropuerto de salida y el de llegada deben ser distintos');
    }
    this._departure = departure;
    this._arrival = arrival;

    this._departureDate = Validator.requireText(departureDate, 'fecha de salida');
    this._departureTime = Validator.requireText(departureTime, 'hora de salida');
    this._arrivalDate = Validator.requireText(arrivalDate, 'fecha de llegada');
    this._arrivalTime = Validator.requireText(arrivalTime, 'hora de llegada');

    Validator.requireNonNull(airline, 'aerolínea');
    if (!(airline instanceof Airline)) {
      throw new Error('airline debe ser una instancia de Airline');
    }
    this._airline = airline;

    // Validación temporal estricta: llegada posterior a salida
    this._validateFlightSchedule();
  }

  _validateFlightSchedule() {
    const dep = this.departureDateTime;
    const arr = this.arrivalDateTime;
    if (isNaN(dep.getTime()) || isNaN(arr.getTime())) {
      throw new ValidationException('Formato de fecha u hora inválido');
    }
    if (arr <= dep) {
      throw new BusinessRuleException('La fecha y hora de llegada debe ser posterior a la salida');
    }
  }

  get id() {
    return this._id;
  }

  get flightName() {
    return this._flightName;
  }

  set flightName(val) {
    const cleanCode = Validator.requireText(val, 'código de vuelo', 8).toUpperCase();
    if (!/^[A-Z0-9]{2,8}$/.test(cleanCode)) {
      throw new ValidationException('El código del vuelo debe contener entre 2 y 8 caracteres alfanuméricos', 'flightName');
    }
    this._flightName = cleanCode;
  }

  get departure() {
    return this._departure;
  }

  set departure(val) {
    Validator.requireNonNull(val, 'aeropuerto de salida');
    if (val.id === this._arrival.id) {
      throw new BusinessRuleException('El aeropuerto de salida y el de llegada deben ser distintos');
    }
    this._departure = val;
  }

  get arrival() {
    return this._arrival;
  }

  set arrival(val) {
    Validator.requireNonNull(val, 'aeropuerto de llegada');
    if (val.id === this._departure.id) {
      throw new BusinessRuleException('El aeropuerto de salida y el de llegada deben ser distintos');
    }
    this._arrival = val;
  }

  get departureDate() {
    return this._departureDate;
  }

  get departureTime() {
    return this._departureTime;
  }

  get arrivalDate() {
    return this._arrivalDate;
  }

  get arrivalTime() {
    return this._arrivalTime;
  }

  get airline() {
    return this._airline;
  }

  set airline(val) {
    Validator.requireNonNull(val, 'aerolínea');
    this._airline = val;
  }

  /**
   * Actualiza el itinerario y revalida la coherencia de fechas.
   */
  reschedule(departureDate, departureTime, arrivalDate, arrivalTime) {
    this._departureDate = Validator.requireText(departureDate, 'fecha de salida');
    this._departureTime = Validator.requireText(departureTime, 'hora de salida');
    this._arrivalDate = Validator.requireText(arrivalDate, 'fecha de llegada');
    this._arrivalTime = Validator.requireText(arrivalTime, 'hora de llegada');
    this._validateFlightSchedule();
  }

  get departureDateTime() {
    return new Date(`${this._departureDate}T${this._departureTime.length === 5 ? this._departureTime + ':00' : this._departureTime}`);
  }

  get arrivalDateTime() {
    return new Date(`${this._arrivalDate}T${this._arrivalTime.length === 5 ? this._arrivalTime + ':00' : this._arrivalTime}`);
  }

  /**
   * Duración total del vuelo en minutos.
   */
  get durationMinutes() {
    const diffMs = this.arrivalDateTime.getTime() - this.departureDateTime.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Duración formateada en horas y minutos según requerimiento: '1 h 40 min'.
   */
  get formattedDuration() {
    const mins = this.durationMinutes;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0 && remMins > 0) {
      return `${hours} h ${remMins} min`;
    } else if (hours > 0) {
      return `${hours} h`;
    }
    return `${remMins} min`;
  }

  /**
   * Determina si el vuelo ya despegó con relación a una fecha/hora dada.
   */
  hasDeparted(referenceDate = new Date()) {
    return this.departureDateTime <= referenceDate;
  }

  toString() {
    return `${this._flightName} (${this._airline.name}): ${this._departure.name} ➔ ${this._arrival.name} [${this._departureDate} ${this._departureTime}]`;
  }

  equals(other) {
    if (!other || !(other instanceof Flight)) return false;
    return this._id === other.id;
  }
}
