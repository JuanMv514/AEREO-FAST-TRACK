/**
 * AeroFastTrack - Contenedor del Sistema (SystemContext)
 * Equivale a la clase Main del Módulo 3 en Java:
 * - Ensambla los generadores de IDs, repositorios y servicios.
 * - Resuelve las dependencias cruzadas mediante inyección manual.
 * - Carga los datos de ejemplo iniciales o rehidrata el estado persistido mediante LocalStorageAdapter.
 */

import { IdGenerator } from './id-generator.js';
import { InMemoryRepository } from './in-memory-repo.js';
import { LocalStorageAdapter } from './storage-adapter.js';
import { Country } from '../models/country.js';
import { DocumentType } from '../models/document-type.js';
import { Customer } from '../models/customer.js';
import { City } from '../models/city.js';
import { Airport } from '../models/airport.js';
import { Airline } from '../models/airline.js';
import { Flight } from '../models/flight.js';
import { Seat } from '../models/seat.js';
import { ReservationDetail } from '../models/reservation-detail.js';
import { Reservation } from '../models/reservation.js';
import { CustomerService } from '../services/customer-service.js';
import { LocationService } from '../services/location-service.js';
import { AirlineService } from '../services/airline-service.js';
import { FlightService } from '../services/flight-service.js';
import { ReservationService } from '../services/reservation-service.js';
import { loadSeedData } from '../data/seed-data.js';

export class SystemContext {
  constructor(enablePersistence = true) {
    this._enablePersistence = enablePersistence;
    this._storageAdapter = new LocalStorageAdapter();
    this._initialized = false;
    this.corruptedDataError = null;
    this.storageUnavailable = !this._storageAdapter.isAvailable();
    this.hasPersistenceError = this.storageUnavailable;
    this.lastPersistenceError = this.storageUnavailable ? 'Almacenamiento no disponible en este navegador' : null;
    this._persistenceListeners = [];
  }

  get storageAdapter() {
    return this._storageAdapter;
  }

  /**
   * Registra un observador para cambios en el estado de persistencia
   * @param {Function} listener Callback que recibe ({ healthy: boolean, error: string|null, reason: string })
   */
  onPersistenceStatusChange(listener) {
    if (typeof listener === 'function') {
      this._persistenceListeners.push(listener);
    }
  }

  _notifyPersistenceStatusChange(status) {
    this._persistenceListeners.forEach((l) => {
      try {
        l(status);
      } catch (e) {
        console.warn('Error en listener de persistencia:', e);
      }
    });
  }

  init() {
    if (this._initialized) return this;

    // 1. Crear Generadores de IDs
    this.airlineIdGen = new IdGenerator(100, 10);
    this.cityIdGen = new IdGenerator(1, 1);
    this.flightIdGen = new IdGenerator(1, 1);
    this.resIdGen = new IdGenerator(1, 1);
    this.detailIdGen = new IdGenerator(1, 1);

    // 2. Crear Repositorios
    this.countryRepo = new InMemoryRepository('País', (item) => item.id);
    this.docTypeRepo = new InMemoryRepository('Tipo de Documento', (item) => item.id);
    this.customerRepo = new InMemoryRepository('Cliente', (item) => item.id);
    this.cityRepo = new InMemoryRepository('Ciudad', (item) => item.id);
    this.airportRepo = new InMemoryRepository('Aeropuerto', (item) => item.id);
    this.airlineRepo = new InMemoryRepository('Aerolínea', (item) => item.id);
    this.flightRepo = new InMemoryRepository('Vuelo', (item) => item.id);
    this.reservationRepo = new InMemoryRepository('Reserva', (item) => item.id);

    // 3. Crear Servicios en orden de dependencia
    this.customerService = new CustomerService(
      this.countryRepo,
      this.docTypeRepo,
      this.customerRepo
    );

    this.locationService = new LocationService(
      this.cityRepo,
      this.airportRepo,
      this.cityIdGen
    );

    this.airlineService = new AirlineService(
      this.airlineRepo,
      this.airlineIdGen
    );

    this.flightService = new FlightService(
      this.flightRepo,
      this.locationService,
      this.airlineService,
      this.flightIdGen
    );

    this.reservationService = new ReservationService(
      this.reservationRepo,
      this.customerService,
      this.flightService,
      this.resIdGen,
      this.detailIdGen
    );

    // 4. Inyectar verificadores cruzados para integridad referencial (Fase de integración)
    this.customerService.setReservationChecker({
      customerHasReservations: (custId) => this.reservationService.customerHasReservations(custId),
    });

    this.flightService.setReservationChecker({
      flightHasReservations: (flightId) => this.reservationService.flightHasReservations(flightId),
    });

    this.locationService.setFlightChecker({
      airportHasFlights: (airportId) => this.flightService.airportHasFlights(airportId),
    });

    this.airlineService.setFlightChecker({
      airlineHasFlights: (airlineId) => this.flightService.airlineHasFlights(airlineId),
    });

    // 5. Configurar listener reactivo de persistencia desacoplado
    const repos = [
      this.countryRepo,
      this.docTypeRepo,
      this.customerRepo,
      this.cityRepo,
      this.airportRepo,
      this.airlineRepo,
      this.flightRepo,
      this.reservationRepo,
    ];
    repos.forEach((repo) => {
      repo.setOnChangeListener(() => {
        if (this._initialized && this._enablePersistence && !this.corruptedDataError) {
          this.saveState();
        }
      });
    });

    // 6. Cargar datos persistidos o datos semilla iniciales
    let loadedFromStorage = false;
    if (this._enablePersistence && this._storageAdapter.isAvailable()) {
      const loadResult = this._storageAdapter.load();
      if (loadResult.status === 'OK') {
        loadedFromStorage = this._rehydrateState(loadResult.data);
      } else if (loadResult.status === 'CORRUPTED') {
        this.corruptedDataError = loadResult.error;
        console.warn('Se detectó corrupción de datos. Se carga estado en memoria sin sobrescribir el respaldo.', loadResult.error);
      } else if (loadResult.status === 'UNAVAILABLE') {
        this.storageUnavailable = true;
      }
    }

    if (!loadedFromStorage) {
      loadSeedData({
        countryRepo: this.countryRepo,
        docTypeRepo: this.docTypeRepo,
        customerService: this.customerService,
        locationService: this.locationService,
        airlineService: this.airlineService,
        flightService: this.flightService,
        reservationService: this.reservationService,
        airlineIdGen: this.airlineIdGen,
        cityIdGen: this.cityIdGen,
        flightIdGen: this.flightIdGen,
        resIdGen: this.resIdGen,
        detailIdGen: this.detailIdGen,
      });

      // Solo guarda por primera vez si no hay un error de corrupción pendiente
      if (this._enablePersistence && !this.corruptedDataError && this._storageAdapter.isAvailable()) {
        this.saveState();
      }
    }

    this._initialized = true;
    return this;
  }

  /**
   * Guarda el estado serializado a través del adaptador
   */
  saveState() {
    if (!this._enablePersistence) {
      return { success: false, reason: 'Persistencia desactivada' };
    }
    if (this.corruptedDataError) {
      return { success: false, reason: 'Persistencia bloqueada por corrupción en cuarentena' };
    }
    if (!this._storageAdapter.isAvailable()) {
      this.storageUnavailable = true;
      this.hasPersistenceError = true;
      this.lastPersistenceError = 'Almacenamiento no disponible en este navegador';
      this._notifyPersistenceStatusChange({
        healthy: false,
        error: this.lastPersistenceError,
        reason: 'UNAVAILABLE',
      });
      return { success: false, error: this.lastPersistenceError };
    }

    try {
      const state = {
        generators: {
          airline: this.airlineIdGen.peek(),
          city: this.cityIdGen.peek(),
          flight: this.flightIdGen.peek(),
          reservation: this.resIdGen.peek(),
          detail: this.detailIdGen.peek(),
        },
        countries: this.countryRepo.findAll().map((c) => ({ id: c.id, name: c.name })),
        docTypes: this.docTypeRepo.findAll().map((d) => ({ id: d.id, description: d.description })),
        customers: this.customerRepo.findAll().map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          docTypeId: c.documentType.id,
          phone: c.telephoneNumber,
          countryId: c.country.id,
          email: c.email,
          address: c.address,
        })),
        cities: this.cityRepo.findAll().map((c) => ({ id: c.id, name: c.name })),
        airports: this.airportRepo.findAll().map((a) => ({ id: a.id, name: a.name, cityId: a.city.id })),
        airlines: this.airlineRepo.findAll().map((a) => ({ id: a.id, name: a.name })),
        flights: this.flightRepo.findAll().map((f) => ({
          id: f.id,
          flightName: f.flightName,
          departureId: f.departure.id,
          arrivalId: f.arrival.id,
          departureDate: f.departureDate,
          departureTime: f.departureTime,
          arrivalDate: f.arrivalDate,
          arrivalTime: f.arrivalTime,
          airlineId: f.airline.id,
        })),
        reservations: this.reservationRepo.findAll().map((r) => ({
          id: r.id,
          customerId: r.customer.id,
          flightId: r.flight.id,
          details: r.details.map((d) => ({
            id: d.id,
            passengerFullName: d.passengerFullName,
            passengerDocument: d.passengerDocument,
            rowNumber: d.seat.rowNumber,
            seatNumber: d.seat.seatNumber,
          })),
        })),
      };

      const result = this._storageAdapter.save(state);
      if (!result.success) {
        this.hasPersistenceError = true;
        this.lastPersistenceError = result.error || 'Error al guardar en almacenamiento local';
        this._notifyPersistenceStatusChange({
          healthy: false,
          error: this.lastPersistenceError,
          reason: 'WRITE_ERROR',
        });
      } else {
        const wasInError = this.hasPersistenceError;
        this.hasPersistenceError = false;
        this.lastPersistenceError = null;
        this.storageUnavailable = false;
        if (wasInError) {
          this._notifyPersistenceStatusChange({
            healthy: true,
            error: null,
            reason: 'RECOVERED',
          });
        }
      }
      return result;
    } catch (err) {
      console.error('Error al empaquetar estado para persistencia:', err);
      this.hasPersistenceError = true;
      this.lastPersistenceError = err.message;
      this._notifyPersistenceStatusChange({
        healthy: false,
        error: err.message,
        reason: 'SERIALIZATION_ERROR',
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Rehidrata los datos deserializados reconstruyendo las instancias de objetos y relaciones
   * @private
   */
  _rehydrateState(state) {
    try {
      // 1. Limpiar repositorios
      this.countryRepo.clear();
      this.docTypeRepo.clear();
      this.customerRepo.clear();
      this.cityRepo.clear();
      this.airportRepo.clear();
      this.airlineRepo.clear();
      this.flightRepo.clear();
      this.reservationRepo.clear();

      // 2. Rehidratar Países y Tipos de Documento
      state.countries.forEach((c) => this.countryRepo.create(new Country(c.id, c.name)));
      state.docTypes.forEach((d) => this.docTypeRepo.create(new DocumentType(d.id, d.description)));

      // 3. Rehidratar Clientes
      state.customers.forEach((c) => {
        const country = this.customerService.getCountry(c.countryId);
        const docType = this.customerService.getDocumentType(c.docTypeId);
        this.customerRepo.create(
          new Customer(c.id, c.firstName, c.lastName, docType, c.phone, country, c.email, c.address)
        );
      });

      // 4. Rehidratar Ciudades y Aeropuertos
      state.cities.forEach((c) => this.cityRepo.create(new City(c.id, c.name)));
      state.airports.forEach((a) => {
        const city = this.locationService.getCity(a.cityId);
        this.airportRepo.create(new Airport(a.id, a.name, city));
      });

      // 5. Rehidratar Aerolíneas
      state.airlines.forEach((a) => this.airlineRepo.create(new Airline(a.id, a.name)));

      // 6. Rehidratar Vuelos
      state.flights.forEach((f) => {
        const dep = this.locationService.getAirport(f.departureId);
        const arr = this.locationService.getAirport(f.arrivalId);
        const airline = this.airlineService.getAirline(f.airlineId);
        this.flightRepo.create(
          new Flight(f.id, f.flightName, dep, arr, f.departureDate, f.departureTime, f.arrivalDate, f.arrivalTime, airline)
        );
      });

      // 7. Rehidratar Reservas
      state.reservations.forEach((r) => {
        const customer = this.customerService.getCustomer(r.customerId);
        const flight = this.flightService.getFlight(r.flightId);
        const details = r.details.map(
          (d) => new ReservationDetail(d.id, d.passengerFullName, d.passengerDocument, new Seat(d.rowNumber, d.seatNumber))
        );
        this.reservationRepo.create(new Reservation(r.id, customer, flight, details));
      });

      // 8. Sincronizar Generadores de IDs
      if (state.generators) {
        if (state.generators.airline) this.airlineIdGen.sync(state.generators.airline - 10);
        if (state.generators.city) this.cityIdGen.sync(state.generators.city - 1);
        if (state.generators.flight) this.flightIdGen.sync(state.generators.flight - 1);
        if (state.generators.reservation) this.resIdGen.sync(state.generators.reservation - 1);
        if (state.generators.detail) this.detailIdGen.sync(state.generators.detail - 1);
      }

      return true;
    } catch (err) {
      console.error('Error rehidratando instancias de dominio:', err);
      return false;
    }
  }

  /**
   * Restablece el sistema a los datos iniciales de la guía y limpia el almacenamiento
   */
  resetToSeedData() {
    this.corruptedDataError = null;
    this.hasPersistenceError = false;
    this.lastPersistenceError = null;
    this._storageAdapter.clear();

    // Reiniciar generadores
    this.airlineIdGen = new IdGenerator(100, 10);
    this.cityIdGen = new IdGenerator(1, 1);
    this.flightIdGen = new IdGenerator(1, 1);
    this.resIdGen = new IdGenerator(1, 1);
    this.detailIdGen = new IdGenerator(1, 1);

    // Limpiar repositorios
    this.countryRepo.clear();
    this.docTypeRepo.clear();
    this.customerRepo.clear();
    this.cityRepo.clear();
    this.airportRepo.clear();
    this.airlineRepo.clear();
    this.flightRepo.clear();
    this.reservationRepo.clear();

    // Recargar semillas puras
    loadSeedData({
      countryRepo: this.countryRepo,
      docTypeRepo: this.docTypeRepo,
      customerService: this.customerService,
      locationService: this.locationService,
      airlineService: this.airlineService,
      flightService: this.flightService,
      reservationService: this.reservationService,
      airlineIdGen: this.airlineIdGen,
      cityIdGen: this.cityIdGen,
      flightIdGen: this.flightIdGen,
      resIdGen: this.resIdGen,
      detailIdGen: this.detailIdGen,
    });

    if (this._enablePersistence && this._storageAdapter.isAvailable()) {
      this.saveState();
    }
  }
}

// Singleton global para la aplicación
export const system = new SystemContext(true);
