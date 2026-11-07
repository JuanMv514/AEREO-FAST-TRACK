/**
 * AeroFastTrack - Servicio AirlineService (Aerolíneas)
 * Refleja el Mapa CRUD del Módulo 3 en Java
 */

import { DuplicateException, NotFoundException, BusinessRuleException, ValidationException } from '../core/exceptions.js';
import { Validator } from '../core/validator.js';
import { Airline } from '../models/airline.js';

export class AirlineService {
  /**
   * @param {InMemoryRepository} airlineRepo Repositorio de aerolíneas
   * @param {IdGenerator} idGenerator Generador de IDs (inicio 100, paso 10)
   */
  constructor(airlineRepo, idGenerator) {
    this._airlineRepo = airlineRepo;
    this._idGen = idGenerator;
    this._flightChecker = null; // Para verificar si la aerolínea tiene vuelos antes de borrar
  }

  setFlightChecker(checker) {
    this._flightChecker = checker;
  }

  createAirline(name) {
    const cleanName = Validator.requireText(name, 'nombre de aerolínea', 50);
    const norm = cleanName.toLowerCase();

    // Regla: unicidad de nombre sin distinguir mayúsculas
    if (this.existsByName(cleanName)) {
      throw new DuplicateException(`Ya existe una aerolínea con el nombre '${cleanName}'`, 'Airline');
    }

    const nextId = this._idGen.nextId();
    const airline = new Airline(nextId, cleanName);
    return this._airlineRepo.create(airline);
  }

  getAirline(id) {
    const airline = this._airlineRepo.findById(id);
    if (!airline) throw new NotFoundException(`Aerolínea con ID '${id}' no encontrada`, 'Airline');
    return airline;
  }

  listAirlines() {
    return this._airlineRepo.findAll().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  renameAirline(id, newName) {
    const airline = this.getAirline(id);
    const cleanName = Validator.requireText(newName, 'nombre de aerolínea', 50);
    const norm = cleanName.toLowerCase();

    // Regla: no chocar consigo misma ni con otra existente
    const duplicate = this._airlineRepo._getAllValues().some(
      (a) => a.id !== airline.id && a.name.toLowerCase() === norm
    );
    if (duplicate) {
      throw new DuplicateException(`Ya existe otra aerolínea con el nombre '${cleanName}'`, 'Airline');
    }

    airline.name = cleanName;
    return this._airlineRepo.update(airline);
  }

  deleteAirline(id) {
    const airline = this.getAirline(id);
    // Integridad referencial: rechazo si tiene vuelos asociados
    if (this._flightChecker && this._flightChecker.airlineHasFlights(airline.id)) {
      throw new BusinessRuleException(`No se puede eliminar la aerolínea '${airline.name}' porque tiene vuelos programados`);
    }
    return this._airlineRepo.deleteById(id);
  }

  searchAirlinesByName(term) {
    if (!term) return this.listAirlines();
    const cleanTerm = term.toLowerCase().trim();
    return this.listAirlines().filter((a) => a.name.toLowerCase().includes(cleanTerm));
  }

  existsByName(name) {
    if (!name) return false;
    const norm = name.toLowerCase().trim();
    return this._airlineRepo._getAllValues().some((a) => a.name.toLowerCase() === norm);
  }

  countAirlines() {
    return this._airlineRepo.count();
  }
}
