/**
 * AeroFastTrack - Servicio CustomerService (Clientes y Catálogos)
 * Refleja el Mapa CRUD del Módulo 1 en Java
 */

import { DuplicateException, NotFoundException, BusinessRuleException, ValidationException } from '../core/exceptions.js';
import { Validator } from '../core/validator.js';
import { Country } from '../models/country.js';
import { DocumentType } from '../models/document-type.js';
import { Customer } from '../models/customer.js';

export class CustomerService {
  /**
   * @param {InMemoryRepository} countryRepo Repositorio de Países
   * @param {InMemoryRepository} docTypeRepo Repositorio de Tipos de Documento
   * @param {InMemoryRepository} customerRepo Repositorio de Clientes
   */
  constructor(countryRepo, docTypeRepo, customerRepo) {
    this._countryRepo = countryRepo;
    this._docTypeRepo = docTypeRepo;
    this._customerRepo = customerRepo;
    this._reservationChecker = null; // Se inyecta en integración para verificar dependencias
  }

  setReservationChecker(checker) {
    this._reservationChecker = checker;
  }

  // ==========================================
  // GESTIÓN DE PAÍSES
  // ==========================================

  createCountry(country) {
    Validator.requireNonNull(country, 'país');
    if (!(country instanceof Country)) {
      throw new Error('Debe ser una instancia de Country');
    }
    // Validar nombre único
    const nameNorm = Validator.normalizeText(country.name).toLowerCase();
    const exists = this._countryRepo._getAllValues().some(
      (c) => Validator.normalizeText(c.name).toLowerCase() === nameNorm
    );
    if (exists) {
      throw new DuplicateException(`Ya existe un país con el nombre '${country.name}'`, 'Country');
    }
    return this._countryRepo.create(country);
  }

  getCountry(id) {
    const c = this._countryRepo.findById(id);
    if (!c) throw new NotFoundException(`País con ID '${id}' no encontrado`, 'Country');
    return c;
  }

  listCountries() {
    return this._countryRepo.findAll().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  updateCountry(id, newName) {
    const country = this.getCountry(id);
    const norm = Validator.normalizeText(newName).toLowerCase();
    const exists = this._countryRepo._getAllValues().some(
      (c) => c.id !== country.id && Validator.normalizeText(c.name).toLowerCase() === norm
    );
    if (exists) {
      throw new DuplicateException(`Ya existe otro país registrado con el nombre '${newName}'`, 'Country');
    }
    country.name = newName;
    return this._countryRepo.update(country);
  }

  deleteCountry(id) {
    const country = this.getCountry(id);
    // Integridad referencial: rechazo si algún cliente pertenece a ese país
    const inUse = this._customerRepo._getAllValues().some((cust) => cust.country.id === country.id);
    if (inUse) {
      throw new BusinessRuleException(`No se puede eliminar el país '${country.name}' porque existen clientes registrados con él`);
    }
    return this._countryRepo.deleteById(id);
  }

  // ==========================================
  // GESTIÓN DE TIPOS DE DOCUMENTO
  // ==========================================

  createDocumentType(docType) {
    Validator.requireNonNull(docType, 'tipo de documento');
    if (!(docType instanceof DocumentType)) {
      throw new Error('Debe ser una instancia de DocumentType');
    }
    return this._docTypeRepo.create(docType);
  }

  getDocumentType(id) {
    const dt = this._docTypeRepo.findById(id ? String(id).toUpperCase() : '');
    if (!dt) throw new NotFoundException(`Tipo de documento con código '${id}' no encontrado`, 'DocumentType');
    return dt;
  }

  listDocumentTypes() {
    return this._docTypeRepo.findAll().sort((a, b) => a.id.localeCompare(b.id));
  }

  updateDocumentType(id, newDescription) {
    const dt = this.getDocumentType(id);
    dt.description = newDescription;
    return this._docTypeRepo.update(dt);
  }

  deleteDocumentType(id) {
    const dt = this.getDocumentType(id);
    // Integridad referencial: rechazo si algún cliente usa ese tipo
    const inUse = this._customerRepo._getAllValues().some((cust) => cust.documentType.id === dt.id);
    if (inUse) {
      throw new BusinessRuleException(`No se puede eliminar el tipo de documento '${dt.id}' porque está asignado a clientes existentes`);
    }
    return this._docTypeRepo.deleteById(dt.id);
  }

  // ==========================================
  // GESTIÓN DE CLIENTES
  // ==========================================

  createCustomer(customer) {
    Validator.requireNonNull(customer, 'cliente');
    if (!(customer instanceof Customer)) {
      throw new Error('Debe ser una instancia de Customer');
    }

    // Validar que país y tipo de documento existan en los repositorios
    this.getCountry(customer.country.id);
    this.getDocumentType(customer.documentType.id);

    // Validar que el id (documento) no se repita
    if (this._customerRepo.existsById(customer.id)) {
      throw new DuplicateException(`Ya existe un cliente registrado con el documento de identidad '${customer.id}'`, 'Customer');
    }

    // Validar que el correo no se repita si viene especificado
    if (customer.email) {
      const emailLower = customer.email.toLowerCase();
      const emailExists = this._customerRepo._getAllValues().some(
        (c) => c.email && c.email.toLowerCase() === emailLower
      );
      if (emailExists) {
        throw new DuplicateException(`El correo electrónico '${customer.email}' ya pertenece a otro cliente`, 'Customer');
      }
    }

    return this._customerRepo.create(customer);
  }

  getCustomer(id) {
    const c = this._customerRepo.findById(id);
    if (!c) throw new NotFoundException(`Cliente con documento '${id}' no encontrado`, 'Customer');
    return c;
  }

  listCustomers() {
    // Ordenados por apellido y luego por nombre
    return this._customerRepo.findAll().sort((a, b) => {
      const cmpLast = a.lastName.localeCompare(b.lastName, 'es');
      if (cmpLast !== 0) return cmpLast;
      return a.firstName.localeCompare(b.firstName, 'es');
    });
  }

  updateCustomer(id, data = {}) {
    const cust = this.getCustomer(id);

    if (data.firstName !== undefined) cust.firstName = data.firstName;
    if (data.lastName !== undefined) cust.lastName = data.lastName;
    if (data.telephoneNumber !== undefined) cust.telephoneNumber = data.telephoneNumber;
    if (data.address !== undefined) cust.address = data.address;

    if (data.country !== undefined) {
      this.getCountry(data.country.id);
      cust.country = data.country;
    }

    if (data.documentType !== undefined) {
      this.getDocumentType(data.documentType.id);
      cust.documentType = data.documentType;
    }

    if (data.email !== undefined) {
      if (data.email) {
        const emailLower = Validator.requireEmail(data.email).toLowerCase();
        const emailUsed = this._customerRepo._getAllValues().some(
          (c) => c.id !== cust.id && c.email && c.email.toLowerCase() === emailLower
        );
        if (emailUsed) {
          throw new DuplicateException(`El correo '${data.email}' ya está registrado con otro cliente`, 'Customer');
        }
        cust.email = emailLower;
      } else {
        cust.email = null;
      }
    }

    return this._customerRepo.update(cust);
  }

  deleteCustomer(id) {
    const cust = this.getCustomer(id);
    if (this._reservationChecker && this._reservationChecker.customerHasReservations(cust.id)) {
      throw new BusinessRuleException(`No se puede eliminar el cliente '${cust.fullName}' porque tiene reservas activas`);
    }
    return this._customerRepo.deleteById(id);
  }

  getCustomerByEmail(email) {
    if (!email) return null;
    const lower = email.toLowerCase().trim();
    return this._customerRepo._getAllValues().find((c) => c.email && c.email.toLowerCase() === lower) || null;
  }

  searchCustomersByLastName(term) {
    if (!term) return this.listCustomers();
    const cleanTerm = term.toLowerCase().trim();
    return this.listCustomers().filter((c) => c.lastName.toLowerCase().includes(cleanTerm));
  }

  listCustomersByCountry(countryId) {
    const cid = Number(countryId);
    return this.listCustomers().filter((c) => c.country.id === cid);
  }

  listCustomersByDocumentType(typeId) {
    const tid = String(typeId).toUpperCase();
    return this.listCustomers().filter((c) => c.documentType.id === tid);
  }

  countCustomers() {
    return this._customerRepo.count();
  }
}
