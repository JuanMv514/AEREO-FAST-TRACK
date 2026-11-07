/**
 * AeroFastTrack - Modelo Country (País)
 * Refleja tblCountries / Clase Country en Java
 */

import { Validator } from '../core/validator.js';

export class Country {
  /**
   * @param {number} id Identificador numérico positivo
   * @param {string} name Nombre del país (máximo 20 caracteres)
   */
  constructor(id, name) {
    this._id = Validator.requirePositive(id, 'id');
    this._name = Validator.requireText(name, 'nombre de país', 20);
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  set name(newName) {
    this._name = Validator.requireText(newName, 'nombre de país', 20);
  }

  toString() {
    return `[${this._id}] ${this._name}`;
  }

  equals(other) {
    if (!other || !(other instanceof Country)) return false;
    return this._id === other.id;
  }
}
