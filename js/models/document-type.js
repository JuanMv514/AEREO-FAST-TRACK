/**
 * AeroFastTrack - Modelo DocumentType (Tipo de Documento)
 * Refleja tblDocumentsType / Clase DocumentType en Java
 */

import { Validator } from '../core/validator.js';
import { ValidationException } from '../core/exceptions.js';

export class DocumentType {
  /**
   * @param {string} id Código de 2 caracteres (ej: CC, TI, PA)
   * @param {string} description Descripción (máximo 20 caracteres)
   */
  constructor(id, description) {
    const rawId = Validator.requireText(id, 'código de tipo de documento', 2);
    const upperId = rawId.toUpperCase();
    if (upperId.length !== 2) {
      throw new ValidationException('El código del tipo de documento debe tener exactamente 2 caracteres', 'id');
    }
    this._id = upperId;
    this._description = Validator.requireText(description, 'descripción', 20);
  }

  get id() {
    return this._id;
  }

  get description() {
    return this._description;
  }

  set description(newDesc) {
    this._description = Validator.requireText(newDesc, 'descripción', 20);
  }

  toString() {
    return `${this._id} - ${this._description}`;
  }

  equals(other) {
    if (!other || !(other instanceof DocumentType)) return false;
    return this._id === other.id;
  }
}
