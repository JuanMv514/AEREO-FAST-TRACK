/**
 * AeroFastTrack - Modelo Customer (Cliente)
 * Refleja tblCustomers / Clase Customer en Java
 */

import { Validator } from '../core/validator.js';
import { DocumentType } from './document-type.js';
import { Country } from './country.js';

export class Customer {
  /**
   * @param {string} id Documento de identidad (máximo 20 caracteres)
   * @param {string} firstName Nombre (máximo 30 caracteres)
   * @param {string} lastName Apellido (máximo 30 caracteres)
   * @param {DocumentType} documentType Tipo de documento asociado
   * @param {string} telephoneNumber Teléfono (máximo 15 dígitos con '+' opcional)
   * @param {Country} country País asociado
   * @param {string|null} email Correo electrónico opcional (máx 80)
   * @param {string|null} address Dirección opcional (máx 40)
   */
  constructor(id, firstName, lastName, documentType, telephoneNumber, country, email = null, address = null) {
    this._id = Validator.requireText(id, 'documento de cliente', 20);
    this._firstName = Validator.requireText(firstName, 'nombre', 30);
    this._lastName = Validator.requireText(lastName, 'apellido', 30);

    Validator.requireNonNull(documentType, 'tipo de documento');
    if (!(documentType instanceof DocumentType)) {
      throw new Error('documentType debe ser una instancia de DocumentType');
    }
    this._documentType = documentType;

    this._telephoneNumber = Validator.requirePhone(telephoneNumber, 'teléfono');

    Validator.requireNonNull(country, 'país');
    if (!(country instanceof Country)) {
      throw new Error('country debe ser una instancia de Country');
    }
    this._country = country;

    this._email = email ? Validator.requireEmail(email, 'correo electrónico') : null;
    this._address = address ? Validator.optionalText(address, 'dirección', 40) : null;
  }

  get id() {
    return this._id;
  }

  get firstName() {
    return this._firstName;
  }

  set firstName(val) {
    this._firstName = Validator.requireText(val, 'nombre', 30);
  }

  get lastName() {
    return this._lastName;
  }

  set lastName(val) {
    this._lastName = Validator.requireText(val, 'apellido', 30);
  }

  get fullName() {
    return `${this._firstName} ${this._lastName}`;
  }

  get documentType() {
    return this._documentType;
  }

  set documentType(val) {
    Validator.requireNonNull(val, 'tipo de documento');
    if (!(val instanceof DocumentType)) {
      throw new Error('documentType debe ser una instancia de DocumentType');
    }
    this._documentType = val;
  }

  get telephoneNumber() {
    return this._telephoneNumber;
  }

  set telephoneNumber(val) {
    this._telephoneNumber = Validator.requirePhone(val, 'teléfono');
  }

  get email() {
    return this._email;
  }

  set email(val) {
    this._email = val ? Validator.requireEmail(val, 'correo electrónico') : null;
  }

  get country() {
    return this._country;
  }

  set country(val) {
    Validator.requireNonNull(val, 'país');
    if (!(val instanceof Country)) {
      throw new Error('country debe ser una instancia de Country');
    }
    this._country = val;
  }

  get address() {
    return this._address;
  }

  set address(val) {
    this._address = val ? Validator.optionalText(val, 'dirección', 40) : null;
  }

  toString() {
    return `${this.fullName} (${this._documentType.id}: ${this._id})`;
  }

  equals(other) {
    if (!other || !(other instanceof Customer)) return false;
    return this._id === other.id;
  }
}
