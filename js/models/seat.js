/**
 * AeroFastTrack - Modelo Value Object Seat (Silla)
 * Objeto inmutable según especificación POO.
 */

import { Validator } from '../core/validator.js';
import { ValidationException } from '../core/exceptions.js';

export class Seat {
  /**
   * @param {string} rowNumber Fila (máximo 2 caracteres, en mayúsculas)
   * @param {number|string} seatNumber Número o posición de la silla (1 a 99)
   */
  constructor(rowNumber, seatNumber) {
    const rawRow = Validator.requireText(rowNumber, 'fila de silla', 2);
    this._rowNumber = rawRow.toUpperCase();

    // Puede ser numérico (1-99) o letra de asiento si se ingresa en formato "12B"
    const parsedNum = Number(seatNumber);
    if (!isNaN(parsedNum)) {
      if (parsedNum < 1 || parsedNum > 99) {
        throw new ValidationException('El número de silla debe estar entre 1 y 99', 'seatNumber');
      }
      this._seatNumber = parsedNum;
    } else {
      const rawSeat = Validator.requireText(seatNumber, 'número de silla', 2);
      this._seatNumber = rawSeat.toUpperCase();
    }

    Object.freeze(this);
  }

  get rowNumber() {
    return this._rowNumber;
  }

  get seatNumber() {
    return this._seatNumber;
  }

  /**
   * Código visible unificado de la silla, por ejemplo "12B" o "14-3"
   */
  get code() {
    return `${this._rowNumber}${this._seatNumber}`;
  }

  toString() {
    return this.code;
  }

  equals(other) {
    if (!other || !(other instanceof Seat)) return false;
    return this.code === other.code;
  }
}
