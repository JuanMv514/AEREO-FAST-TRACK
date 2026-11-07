/**
 * AeroFastTrack - Contenedor del Sistema (SystemContext)
 * Equivale a la clase Main del Módulo 3 en Java:
 * - Ensambla los generadores de IDs, repositorios y servicios.
 * - Resuelve las dependencias cruzadas mediante inyección manual.
 * - Carga los datos de ejemplo iniciales.
 */

import { IdGenerator } from './id-generator.js';
import { InMemoryRepository } from './in-memory-repo.js';
import { CustomerService } from '../services/customer-service.js';
import { LocationService } from '../services/location-service.js';
import { AirlineService } from '../services/airline-service.js';
import { FlightService } from '../services/flight-service.js';
import { ReservationService } from '../services/reservation-service.js';
import { loadSeedData } from '../data/seed-data.js';

export class SystemContext {
  constructor() {
    this._initialized = false;
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

    // 5. Cargar datos semilla
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

    this._initialized = true;
    return this;
  }
}

// Singleton global
export const system = new SystemContext();
