/**
 * AeroFastTrack - Servicio LocationService (Ciudades y Aeropuertos)
 * Refleja el Mapa CRUD del Módulo 2 en Java
 */

import { DuplicateException, NotFoundException, BusinessRuleException, ValidationException } from '../core/exceptions.js';
import { Validator } from '../core/validator.js';
import { City } from '../models/city.js';
import { Airport } from '../models/airport.js';

export class LocationService {
  /**
   * @param {InMemoryRepository} cityRepo 
   * @param {InMemoryRepository} airportRepo 
   * @param {IdGenerator} cityIdGenerator 
   */
  constructor(cityRepo, airportRepo, cityIdGenerator) {
    this._cityRepo = cityRepo;
    this._airportRepo = airportRepo;
    this._cityIdGen = cityIdGenerator;
    this._flightChecker = null; // Para validar si un aeropuerto tiene vuelos antes de eliminar
  }

  setFlightChecker(checker) {
    this._flightChecker = checker;
  }

  // ==========================================
  // GESTIÓN DE CIUDADES
  // ==========================================

  createCity(name) {
    const cleanName = Validator.requireText(name, 'nombre de ciudad', 20);
    const norm = cleanName.toLowerCase();

    const exists = this._cityRepo._getAllValues().some(
      (c) => c.name.toLowerCase() === norm
    );
    if (exists) {
      throw new DuplicateException(`Ya existe una ciudad registrada con el nombre '${cleanName}'`, 'City');
    }

    const nextId = this._cityIdGen.nextId();
    const city = new City(nextId, cleanName);
    return this._cityRepo.create(city);
  }

  getCity(id) {
    const c = this._cityRepo.findById(id);
    if (!c) throw new NotFoundException(`Ciudad con ID '${id}' no encontrada`, 'City');
    return c;
  }

  listCities() {
    return this._cityRepo.findAll().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  updateCity(id, newName) {
    const city = this.getCity(id);
    const cleanName = Validator.requireText(newName, 'nombre de ciudad', 20);
    const norm = cleanName.toLowerCase();

    const exists = this._cityRepo._getAllValues().some(
      (c) => c.id !== city.id && c.name.toLowerCase() === norm
    );
    if (exists) {
      throw new DuplicateException(`Ya existe otra ciudad con el nombre '${cleanName}'`, 'City');
    }

    city.name = cleanName;
    return this._cityRepo.update(city);
  }

  deleteCity(id) {
    const city = this.getCity(id);
    // Integridad referencial: regla "eliminar ciudad solo si no tiene aeropuertos"
    const hasAirports = this._airportRepo._getAllValues().some((a) => a.city.id === city.id);
    if (hasAirports) {
      throw new BusinessRuleException(`No se puede eliminar la ciudad '${city.name}' porque tiene aeropuertos asociados`);
    }
    return this._cityRepo.deleteById(id);
  }

  searchCitiesByName(term) {
    if (!term) return this.listCities();
    const cleanTerm = term.toLowerCase().trim();
    return this.listCities().filter((c) => c.name.toLowerCase().includes(cleanTerm));
  }

  countCities() {
    return this._cityRepo.count();
  }

  // ==========================================
  // GESTIÓN DE AEROPUERTOS
  // ==========================================

  createAirport(name, cityId, customId = null) {
    const city = this.getCity(cityId);
    const cleanName = Validator.requireText(name, 'nombre de aeropuerto', 50);
    const norm = cleanName.toLowerCase();

    // Regla: no puede haber dos aeropuertos con el mismo nombre en la misma ciudad
    const existsInCity = this._airportRepo._getAllValues().some(
      (a) => a.city.id === city.id && a.name.toLowerCase() === norm
    );
    if (existsInCity) {
      throw new DuplicateException(`Ya existe un aeropuerto llamado '${cleanName}' en la ciudad de ${city.name}`, 'Airport');
    }

    const airport = new Airport(customId, cleanName, city);
    return this._airportRepo.create(airport);
  }

  getAirport(id) {
    const a = this._airportRepo.findById(id);
    if (!a) throw new NotFoundException(`Aeropuerto con identificador '${id}' no encontrado`, 'Airport');
    return a;
  }

  listAirports() {
    return this._airportRepo.findAll().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  updateAirport(id, { name, cityId }) {
    const airport = this.getAirport(id);

    let targetCity = airport.city;
    if (cityId !== undefined && cityId !== airport.city.id) {
      targetCity = this.getCity(cityId);
    }

    const targetName = name !== undefined ? Validator.requireText(name, 'nombre de aeropuerto', 50) : airport.name;
    const norm = targetName.toLowerCase();

    const duplicate = this._airportRepo._getAllValues().some(
      (a) => a.id !== airport.id && a.city.id === targetCity.id && a.name.toLowerCase() === norm
    );
    if (duplicate) {
      throw new DuplicateException(`Ya existe otro aeropuerto llamado '${targetName}' en ${targetCity.name}`, 'Airport');
    }

    airport.name = targetName;
    airport.city = targetCity;
    return this._airportRepo.update(airport);
  }

  deleteAirport(id) {
    const airport = this.getAirport(id);
    // Integridad referencial: rechazo si tiene vuelos asociados
    if (this._flightChecker && this._flightChecker.airportHasFlights(airport.id)) {
      throw new BusinessRuleException(`No se puede eliminar el aeropuerto '${airport.name}' porque tiene vuelos programados`);
    }
    return this._airportRepo.deleteById(id);
  }

  listAirportsByCity(cityId) {
    const city = this.getCity(cityId);
    return this._airportRepo._getAllValues()
      .filter((a) => a.city.id === city.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  searchAirportsByName(term) {
    if (!term) return this.listAirports();
    const cleanTerm = term.toLowerCase().trim();
    return this.listAirports().filter((a) => a.name.toLowerCase().includes(cleanTerm));
  }

  countAirportsByCity(cityId) {
    const cid = Number(cityId);
    return this._airportRepo._getAllValues().filter((a) => a.city.id === cid).length;
  }

  countAirports() {
    return this._airportRepo.count();
  }
}
