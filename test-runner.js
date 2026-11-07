/**
 * AeroFastTrack - Suite de Verificación de Casos de Prueba (Etapa 1)
 * Ejecuta y valida automáticamente todos los casos de prueba de la guía técnica.
 */

import { SystemContext } from './js/core/system-context.js';
import { Country } from './js/models/country.js';
import { DocumentType } from './js/models/document-type.js';
import { Customer } from './js/models/customer.js';
import { Seat } from './js/models/seat.js';
import { ValidationException, DuplicateException, NotFoundException, BusinessRuleException } from './js/core/exceptions.js';

export function runAllTests() {
  const results = [];

  function assert(testName, fn) {
    try {
      fn();
      results.push({ name: testName, passed: true });
    } catch (err) {
      results.push({ name: testName, passed: false, error: err.message });
    }
  }

  function assertThrows(testName, fn, expectedErrorType = null) {
    try {
      fn();
      results.push({ name: testName, passed: false, error: 'Se esperaba una excepción y no ocurrió' });
    } catch (err) {
      if (expectedErrorType && !(err instanceof expectedErrorType)) {
        results.push({ name: testName, passed: false, error: `Tipo de error inesperado: ${err.name} - ${err.message}` });
      } else {
        results.push({ name: testName, passed: true, message: err.message });
      }
    }
  }

  const sys = new SystemContext(false).init();

  // MÓDULO 1: CLIENTES Y CATÁLOGOS
  assertThrows('1. Crear país con nombre de 21 caracteres -> Rechazo', () => {
    new Country(99, '123456789012345678901');
  }, ValidationException);

  assertThrows('2. Crear tipo de documento con id "C" -> Rechazo', () => {
    new DocumentType('C', 'Cédula');
  }, ValidationException);

  assert('3. Crear tipo de documento con id "cc" -> Se guarda como "CC"', () => {
    const dt = new DocumentType('cc', 'Cédula Test');
    if (dt.id !== 'CC') throw new Error(`Esperado CC, obtenido ${dt.id}`);
  });

  assertThrows('4. Registrar cliente con nombre vacío -> Rechazo', () => {
    const col = sys.customerService.getCountry(1);
    const cc = sys.customerService.getDocumentType('CC');
    new Customer('9999', '   ', 'Pérez', cc, '3001234567', col);
  }, ValidationException);

  assertThrows('5. Registrar cliente con teléfono "abc123" -> Rechazo', () => {
    const col = sys.customerService.getCountry(1);
    const cc = sys.customerService.getDocumentType('CC');
    new Customer('9999', 'Juan', 'Pérez', cc, 'abc123', col);
  }, ValidationException);

  assertThrows('6. Registrar dos clientes con el mismo documento -> Rechazo', () => {
    const col = sys.customerService.getCountry(1);
    const cc = sys.customerService.getDocumentType('CC');
    const cust = new Customer('1020304050', 'Carlos', 'Repetido', cc, '3009998877', col);
    sys.customerService.createCustomer(cust);
  }, DuplicateException);

  assertThrows('7. Registrar dos clientes con el mismo correo -> Rechazo', () => {
    const col = sys.customerService.getCountry(1);
    const cc = sys.customerService.getDocumentType('CC');
    const cust = new Customer('555666777', 'Ana', 'Ríos', cc, '3009998877', col, 'carlos.gomez@aero.com');
    sys.customerService.createCustomer(cust);
  }, DuplicateException);

  assertThrows('8. Registrar cliente con país inexistente -> Rechazo', () => {
    const fakeCountry = new Country(999, 'Ficticio');
    const cc = sys.customerService.getDocumentType('CC');
    const cust = new Customer('777888', 'Pedro', 'Díaz', cc, '3001112233', fakeCountry);
    sys.customerService.createCustomer(cust);
  }, NotFoundException);

  assertThrows('9. Consultar un documento que no existe -> Mensaje no encontrado', () => {
    sys.customerService.getCustomer('DOC_INEXISTENTE');
  }, NotFoundException);

  assert('10. Listar con 3 clientes -> Salen ordenados por apellido', () => {
    const list = sys.customerService.listCustomers();
    if (list.length < 3) throw new Error('Menos de 3 clientes');
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].lastName.localeCompare(list[i + 1].lastName, 'es') > 0) {
        throw new Error('Lista no está ordenada por apellido');
      }
    }
  });

  assertThrows('11. Actualizar correo a uno ya usado por otro -> Rechazo', () => {
    sys.customerService.updateCustomer('1020304050', { email: 'laura.martinez@aero.com' });
  }, DuplicateException);

  assert('12. Actualizar correo al mismo que ya tenía -> Se acepta', () => {
    sys.customerService.updateCustomer('1020304050', { email: 'carlos.gomez@aero.com' });
  });

  // MÓDULO 2: UBICACIONES
  assertThrows('13. Crear ciudad con nombre de 21 caracteres -> Rechazo', () => {
    sys.locationService.createCity('123456789012345678901');
  }, ValidationException);

  assertThrows('14. Crear ciudad "Cali" y luego "cali " -> Rechazo por duplicado', () => {
    sys.locationService.createCity('cali ');
  }, DuplicateException);

  assert('15. Crear dos ciudades seguidas -> Ids consecutivos', () => {
    const cA = sys.locationService.createCity('Bucaramanga');
    const cB = sys.locationService.createCity('Pereira');
    if (cB.id !== cA.id + 1) throw new Error(`IDs no consecutivos: ${cA.id}, ${cB.id}`);
  });

  assertThrows('16. Crear aeropuerto con ciudad inexistente -> Rechazo', () => {
    sys.locationService.createAirport('Aeropuerto X', 9999);
  }, NotFoundException);

  assertThrows('17. Crear dos aeropuertos con mismo nombre en misma ciudad -> Rechazo', () => {
    const bog = sys.locationService.searchCitiesByName('Bogotá')[0];
    sys.locationService.createAirport('El Dorado', bog.id);
  }, DuplicateException);

  assertThrows('18. Eliminar ciudad con aeropuertos -> Rechazo con mensaje claro', () => {
    const bog = sys.locationService.searchCitiesByName('Bogotá')[0];
    sys.locationService.deleteCity(bog.id);
  }, BusinessRuleException);

  // MÓDULO 3: AEROLÍNEAS
  assert('19. Numeración de aerolíneas va de 10 en 10 iniciando en 100', () => {
    const airlines = sys.airlineService.listAirlines();
    if (airlines[0].id !== 100 || airlines[1].id !== 110 || airlines[2].id !== 120) {
      throw new Error(`IDs incorrectos: ${airlines.map(a => a.id).join(', ')}`);
    }
  });

  assertThrows('20. Registrar aerolínea con nombre repetido -> Rechazo', () => {
    sys.airlineService.createAirline('avianca');
  }, DuplicateException);

  // MÓDULO 4: VUELOS
  assertThrows('21. Programar vuelo con código de 9 caracteres -> Rechazo', () => {
    const bog = sys.locationService.searchAirportsByName('El Dorado')[0];
    const mde = sys.locationService.searchAirportsByName('José María')[0];
    const av = sys.airlineService.listAirlines()[0];
    sys.flightService.createFlight({
      flightName: 'AV1234567', // 9 caracteres
      departureId: bog.id,
      arrivalId: mde.id,
      departureDate: '2026-11-20',
      departureTime: '10:00',
      arrivalDate: '2026-11-20',
      arrivalTime: '11:00',
      airlineId: av.id,
    });
  }, ValidationException);

  assertThrows('22. Programar vuelo con salida y llegada en mismo aeropuerto -> Rechazo', () => {
    const bog = sys.locationService.searchAirportsByName('El Dorado')[0];
    const av = sys.airlineService.listAirlines()[0];
    sys.flightService.createFlight({
      flightName: 'AV9999',
      departureId: bog.id,
      arrivalId: bog.id,
      departureDate: '2026-11-20',
      departureTime: '10:00',
      arrivalDate: '2026-11-20',
      arrivalTime: '11:00',
      airlineId: av.id,
    });
  }, BusinessRuleException);

  assertThrows('23. Programar vuelo que llega antes de salir -> Rechazo', () => {
    const bog = sys.locationService.searchAirportsByName('El Dorado')[0];
    const mde = sys.locationService.searchAirportsByName('José María')[0];
    const av = sys.airlineService.listAirlines()[0];
    sys.flightService.createFlight({
      flightName: 'AV9998',
      departureId: bog.id,
      arrivalId: mde.id,
      departureDate: '2026-11-20',
      departureTime: '15:00',
      arrivalDate: '2026-11-20',
      arrivalTime: '14:00',
      airlineId: av.id,
    });
  }, BusinessRuleException);

  assert('24. Vuelo nocturno (23:30 a 01:10 día siguiente) calcula 1 h 40 min', () => {
    const nightFlight = sys.flightService.getFlightByName('WG2010');
    if (nightFlight.formattedDuration !== '1 h 40 min') {
      throw new Error(`Duración esperada: 1 h 40 min, obtenida: ${nightFlight.formattedDuration}`);
    }
  });

  // MÓDULO 5: RESERVAS
  assertThrows('25. Crear reserva sin pasajeros -> Rechazo', () => {
    const cust = sys.customerService.listCustomers()[0];
    const flight = sys.flightService.listFlights()[0];
    sys.reservationService.createReservation({
      customerId: cust.id,
      flightId: flight.id,
      passengers: [],
    });
  }, BusinessRuleException);

  assertThrows('26. Asignar misma silla (1A) a dos pasajeros en mismo vuelo -> Rechazo', () => {
    const cust = sys.customerService.listCustomers()[0];
    const flight = sys.flightService.getFlightByName('AV8520'); // ya tiene ocupadas 1A, 1B, 2A
    sys.reservationService.createReservation({
      customerId: cust.id,
      flightId: flight.id,
      passengers: [
        { fullName: 'Pasajero X', document: '88877711', rowNumber: '1', seatNumber: 'A' },
      ],
    });
  }, BusinessRuleException);

  assert('27. Manifiesto de vuelo AV8520 retorna pasajeros ordenados por silla', () => {
    const flight = sys.flightService.getFlightByName('AV8520');
    const manifest = sys.reservationService.getFlightManifest(flight.id);
    if (manifest.length !== 3) throw new Error(`Esperados 3 pasajeros, obtenidos: ${manifest.length}`);
    if (manifest[0].seatCode !== '1A' || manifest[1].seatCode !== '1B' || manifest[2].seatCode !== '2A') {
      throw new Error(`Orden inesperado en manifiesto: ${manifest.map(m => m.seatCode).join(', ')}`);
    }
  });

  assertThrows('28. Eliminar aerolínea con vuelos programados -> Rechazo referencial', () => {
    const av = sys.airlineService.searchAirlinesByName('Avianca')[0];
    sys.airlineService.deleteAirline(av.id);
  }, BusinessRuleException);

  assertThrows('29. Eliminar cliente con reservas activas -> Rechazo referencial', () => {
    sys.customerService.deleteCustomer('1020304050');
  }, BusinessRuleException);

  return results;
}
