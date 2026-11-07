/**
 * AeroFastTrack - Modelo City (Ciudad)
 * Refleja tblCities / Clase City en Java
 */

import { Validator } from '../core/validator.js';

export class City {
  /**
   * @param {number} id Identificador numérico asignado por generador
   * @param {string} name Nombre de la ciudad (máximo 20 caracteres)
   */
  constructor(id, name) {
    this._id = Validator.requirePositive(id, 'id');
    this._name = Validator.requireText(name, 'nombre de ciudad', 20);
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  set name(newName) {
    this._name = Validator.requireText(newName, 'nombre de ciudad', 20);
  }

  toString() {
    return this._name;
  }

  equals(other) {
    if (!other || !(other instanceof City)) return false;
    return this._id === other.id;
  }
}
