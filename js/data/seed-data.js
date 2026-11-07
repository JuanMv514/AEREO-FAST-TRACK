/**
 * AeroFastTrack - Datos Semilla Iniciales (Seed Data)
 * Carga los datos de prueba idénticos a los especificados en la guía técnica.
 */

import { Country } from '../models/country.js';
import { DocumentType } from '../models/document-type.js';
import { Customer } from '../models/customer.js';

export function loadSeedData({
  countryRepo,
  docTypeRepo,
  customerService,
  locationService,
  airlineService,
  flightService,
  reservationService,
  airlineIdGen,
  cityIdGen,
  flightIdGen,
  resIdGen,
  detailIdGen,
}) {
  // 1. Cargar 5 Países
  const col = new Country(1, 'Colombia');
  const usa = new Country(2, 'Estados Unidos');
  const esp = new Country(3, 'España');
  const mex = new Country(4, 'México');
  const pan = new Country(5, 'Panamá');
  [col, usa, esp, mex, pan].forEach((c) => countryRepo.create(c));

  // 2. Cargar 4 Tipos de Documento
  const cc = new DocumentType('CC', 'Cédula Ciudadanía');
  const ti = new DocumentType('TI', 'Tarjeta Identidad');
  const pa = new DocumentType('PA', 'Pasaporte');
  const ce = new DocumentType('CE', 'Cédula Extranjería');
  [cc, ti, pa, ce].forEach((d) => docTypeRepo.create(d));

  // 3. Cargar 3 Clientes de muestra
  const c1 = new Customer(
    '1020304050',
    'Carlos',
    'Gómez',
    cc,
    '+573001234567',
    col,
    'carlos.gomez@aero.com',
    'Carrera 7 # 45-20'
  );
  const c2 = new Customer(
    '9876543210',
    'Laura',
    'Martínez',
    cc,
    '+573109876543',
    col,
    'laura.martinez@aero.com',
    'Calle 100 # 15-30'
  );
  const c3 = new Customer(
    'P98745612',
    'John',
    'Smith',
    pa,
    '+13055550199',
    usa,
    'john.smith@skymail.com',
    '742 Evergreen Terrace'
  );
  [c1, c2, c3].forEach((cust) => customerService.createCustomer(cust));

  // 4. Cargar 5 Ciudades
  const bog = locationService.createCity('Bogotá');
  const med = locationService.createCity('Medellín');
  const cal = locationService.createCity('Cali');
  const ctg = locationService.createCity('Cartagena');
  const baq = locationService.createCity('Barranquilla');

  // 5. Cargar 6 Aeropuertos (Medellín tiene 2 aeropuertos para cumplir la regla)
  const a1 = locationService.createAirport('El Dorado', bog.id);
  const a2 = locationService.createAirport('José María Córdova', med.id);
  const a3 = locationService.createAirport('Olaya Herrera', med.id);
  const a4 = locationService.createAirport('Alfonso Bonilla Aragón', cal.id);
  const a5 = locationService.createAirport('Rafael Núñez', ctg.id);
  const a6 = locationService.createAirport('Ernesto Cortissoz', baq.id);

  // 6. Cargar 3 Aerolíneas
  const al1 = airlineService.createAirline('Avianca');
  const al2 = airlineService.createAirline('LATAM Airlines');
  const al3 = airlineService.createAirline('Wingo');

  // 7. Cargar 8 Vuelos repartidos en 2 meses (noviembre y diciembre 2026)
  const f1 = flightService.createFlight({
    flightName: 'AV8520',
    departureId: a1.id,
    arrivalId: a2.id,
    departureDate: '2026-11-15',
    departureTime: '06:30',
    arrivalDate: '2026-11-15',
    arrivalTime: '07:25',
    airlineId: al1.id,
  });

  const f2 = flightService.createFlight({
    flightName: 'AV8544',
    departureId: a2.id,
    arrivalId: a5.id,
    departureDate: '2026-11-15',
    departureTime: '10:00',
    arrivalDate: '2026-11-15',
    arrivalTime: '11:15',
    airlineId: al1.id,
  });

  const f3 = flightService.createFlight({
    flightName: 'LA4100',
    departureId: a1.id,
    arrivalId: a4.id,
    departureDate: '2026-11-20',
    departureTime: '14:00',
    arrivalDate: '2026-11-20',
    arrivalTime: '15:05',
    airlineId: al2.id,
  });

  const f4 = flightService.createFlight({
    flightName: 'WG2010',
    departureId: a3.id,
    arrivalId: a6.id,
    departureDate: '2026-11-25',
    departureTime: '23:30',
    arrivalDate: '2026-11-26', // Vuelo nocturno que cruza medianoche
    arrivalTime: '01:10',
    airlineId: al3.id,
  });

  const f5 = flightService.createFlight({
    flightName: 'AV9100',
    departureId: a1.id,
    arrivalId: a5.id,
    departureDate: '2026-12-05',
    departureTime: '08:15',
    arrivalDate: '2026-12-05',
    arrivalTime: '09:45',
    airlineId: al1.id,
  });

  const f6 = flightService.createFlight({
    flightName: 'LA4250',
    departureId: a5.id,
    arrivalId: a1.id,
    departureDate: '2026-12-10',
    departureTime: '13:00',
    arrivalDate: '2026-12-10',
    arrivalTime: '14:30',
    airlineId: al2.id,
  });

  const f7 = flightService.createFlight({
    flightName: 'WG2080',
    departureId: a4.id,
    arrivalId: a1.id,
    departureDate: '2026-12-18',
    departureTime: '17:45',
    arrivalDate: '2026-12-18',
    arrivalTime: '18:50',
    airlineId: al3.id,
  });

  const f8 = flightService.createFlight({
    flightName: 'LA4300',
    departureId: a2.id,
    arrivalId: a1.id,
    departureDate: '2026-12-22',
    departureTime: '19:30',
    arrivalDate: '2026-12-22',
    arrivalTime: '20:25',
    airlineId: al2.id,
  });

  // 8. Cargar 4 Reservas con 1 a 3 pasajeros sin sillas repetidas
  // Reserva 1: Carlos Gómez en Vuelo AV8520
  reservationService.createReservation({
    customerId: c1.id,
    flightId: f1.id,
    passengers: [
      { fullName: 'Carlos Gómez', document: '1020304050', rowNumber: '1', seatNumber: 'A' },
      { fullName: 'Mariana Gómez', document: '1030405060', rowNumber: '1', seatNumber: 'B' },
    ],
  });

  // Reserva 2: Laura Martínez en Vuelo AV8520 (mismo vuelo, sillas distintas)
  reservationService.createReservation({
    customerId: c2.id,
    flightId: f1.id,
    passengers: [
      { fullName: 'Laura Martínez', document: '9876543210', rowNumber: '2', seatNumber: 'A' },
    ],
  });

  // Reserva 3: John Smith en Vuelo LA4100
  reservationService.createReservation({
    customerId: c3.id,
    flightId: f3.id,
    passengers: [
      { fullName: 'John Smith', document: 'P98745612', rowNumber: '4', seatNumber: 'C' },
      { fullName: 'Sarah Smith', document: 'P98745613', rowNumber: '4', seatNumber: 'D' },
      { fullName: 'Leo Smith', document: 'P98745614', rowNumber: '4', seatNumber: 'E' },
    ],
  });

  // Reserva 4: Carlos Gómez en Vuelo WG2010 (vuelo nocturno)
  reservationService.createReservation({
    customerId: c1.id,
    flightId: f4.id,
    passengers: [
      { fullName: 'Carlos Gómez', document: '1020304050', rowNumber: '12', seatNumber: 'B' },
    ],
  });
}
