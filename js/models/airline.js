/**
 * AeroFastTrack - Modelo Airline (Aerolínea)
 * Refleja tblAirlines / Clase Airline en Java
 */

import { Validator } from '../core/validator.js';

export class Airline {
  /**
   * @param {number} id Identificador numérico (100, 110, 120...)
   * @param {string} name Nombre de la aerolínea (máximo 50 caracteres)
   */
  constructor(id, name) {
    this._id = Validator.requirePositive(id, 'id de aerolínea');
    this._name = Validator.requireText(name, 'nombre de aerolínea', 50);
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  set name(newName) {
    this._name = Validator.requireText(newName, 'nombre de aerolínea', 50);
  }

  toString() {
    return `${this._name} (Cod: ${this._id})`;
  }

  equals(other) {
    if (!other || !(other instanceof Airline)) return false;
    return this._id === other.id;
  }
}
