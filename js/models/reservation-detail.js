/**
 * AeroFastTrack - Modelo ReservationDetail (Detalle de Reserva / Pasajero)
 * Refleja tblDetailsReservation / Clase ReservationDetail en Java
 */

import { Validator } from '../core/validator.js';
import { Seat } from './seat.js';

export class ReservationDetail {
  /**
   * @param {number} id Identificador numérico
   * @param {string} passengerFullName Nombre completo del pasajero (máximo 50)
   * @param {string} passengerDocument Documento del pasajero (máximo 20, sin espacios)
   * @param {Seat} seat Objeto Silla
   */
  constructor(id, passengerFullName, passengerDocument, seat) {
    this._id = Validator.requirePositive(id, 'id de detalle');
    this._passengerFullName = Validator.requireText(passengerFullName, 'nombre de pasajero', 50);

    const doc = Validator.requireText(passengerDocument, 'documento de pasajero', 20);
    this._passengerDocument = doc.replace(/\s+/g, '');

    Validator.requireNonNull(seat, 'silla');
    if (!(seat instanceof Seat)) {
      throw new Error('seat debe ser una instancia de Seat');
    }
    this._seat = seat;
  }

  get id() {
    return this._id;
  }

  get passengerFullName() {
    return this._passengerFullName;
  }

  set passengerFullName(val) {
    this._passengerFullName = Validator.requireText(val, 'nombre de pasajero', 50);
  }

  get passengerDocument() {
    return this._passengerDocument;
  }

  set passengerDocument(val) {
    const doc = Validator.requireText(val, 'documento de pasajero', 20);
    this._passengerDocument = doc.replace(/\s+/g, '');
  }

  get seat() {
    return this._seat;
  }

  set seat(newSeat) {
    Validator.requireNonNull(newSeat, 'silla');
    if (!(newSeat instanceof Seat)) {
      throw new Error('seat debe ser una instancia de Seat');
    }
    this._seat = newSeat;
  }

  toString() {
    return `${this._passengerFullName} (Doc: ${this._passengerDocument}) - Silla: ${this._seat.code}`;
  }

  equals(other) {
    if (!other || !(other instanceof ReservationDetail)) return false;
    return this._id === other.id;
  }
}
