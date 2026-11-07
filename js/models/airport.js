/**
 * AeroFastTrack - Modelo Airport (Aeropuerto)
 * Refleja tblAirports / Clase Airport en Java
 */

import { Validator } from '../core/validator.js';
import { City } from './city.js';

export class Airport {
  /**
   * @param {string|null} id UUID del aeropuerto (si es null se genera uno nuevo)
   * @param {string} name Nombre del aeropuerto (máximo 50 caracteres)
   * @param {City} city Ciudad donde está ubicado
   */
  constructor(id, name, city) {
    this._id = id ? Validator.requireText(id, 'id de aeropuerto') : Validator.generateUUID();
    this._name = Validator.requireText(name, 'nombre de aeropuerto', 50);

    Validator.requireNonNull(city, 'ciudad');
    if (!(city instanceof City)) {
      throw new Error('city debe ser una instancia de City');
    }
    this._city = city;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  set name(newName) {
    this._name = Validator.requireText(newName, 'nombre de aeropuerto', 50);
  }

  get city() {
    return this._city;
  }

  set city(newCity) {
    Validator.requireNonNull(newCity, 'ciudad');
    if (!(newCity instanceof City)) {
      throw new Error('city debe ser una instancia de City');
    }
    this._city = newCity;
  }

  toString() {
    return `${this._name} (${this._city.name})`;
  }

  equals(other) {
    if (!other || !(other instanceof Airport)) return false;
    return this._id === other.id;
  }
}
