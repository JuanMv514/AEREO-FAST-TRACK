import { SystemContext } from './js/core/system-context.js';
import { Customer } from './js/models/customer.js';
import { STORAGE_KEY } from './js/core/storage-adapter.js';
import { runAllTests } from './test-runner.js';

export function runPersistenceScenarios() {
  const results = [];
  const log = (name, passed, details = '') => results.push({ name, passed, details });

  try {
    // Limpieza preliminar para pruebas
    localStorage.clear();

    // -------------------------------------------------------------------------
    // Escenario 1: Crear un cliente y recargar el contexto (simula reload)
    // -------------------------------------------------------------------------
    {
      const ctx1 = new SystemContext(true);
      ctx1.init();
      const docTypeCC = ctx1.customerService.getDocumentType('CC');
      const pais = ctx1.customerService.getCountry(1); // Colombia
      
      const newCust = new Customer(
        '99887766',
        'Persistencia',
        'Tester',
        docTypeCC,
        '+573009998888',
        pais,
        'tester1@aero.com',
        'Calle 100 # 20-30'
      );
      ctx1.customerService.createCustomer(newCust);

      // Simular recarga de página: nuevo SystemContext leyendo de localStorage
      const ctxReload = new SystemContext(true);
      ctxReload.init();
      const reloadedCust = ctxReload.customerService.getCustomer('99887766');
      const ok = reloadedCust && reloadedCust.fullName === 'Persistencia Tester';
      log('Escenario 1: Crear cliente y simular recarga de página', ok, ok ? 'Cliente recuperado con éxito de localStorage' : 'Cliente no persistió');
    }

    // -------------------------------------------------------------------------
    // Escenario 2: Editar un cliente y volver a abrir sesión
    // -------------------------------------------------------------------------
    {
      const ctx2 = new SystemContext(true);
      ctx2.init();
      ctx2.customerService.updateCustomer('99887766', {
        firstName: 'Persistencia Modificado',
        email: 'modificado@aero.com',
        telephoneNumber: '+573110001111',
      });

      // Nueva sesión
      const ctxReopen = new SystemContext(true);
      ctxReopen.init();
      const custEdited = ctxReopen.customerService.getCustomer('99887766');
      const ok = custEdited && custEdited.firstName === 'Persistencia Modificado' && custEdited.email === 'modificado@aero.com';
      log('Escenario 2: Editar cliente y simular reapertura del navegador', ok, ok ? 'Cambios del cliente persistidos tras reapertura' : 'Edición no persistió');
    }

    // -------------------------------------------------------------------------
    // Escenario 3: Crear una ciudad y un aeropuerto asociado
    // -------------------------------------------------------------------------
    let createdCityId = null;
    let createdAirportId = null;
    {
      const ctx3 = new SystemContext(true);
      ctx3.init();
      const newCity = ctx3.locationService.createCity('Pereira');
      createdCityId = newCity.id;
      const newAirport = ctx3.locationService.createAirport('Aeropuerto Matecaña', newCity.id);
      createdAirportId = newAirport.id;

      // Simular recarga
      const ctxReload = new SystemContext(true);
      ctxReload.init();
      const cityPersisted = ctxReload.locationService.getCity(createdCityId);
      const airportPersisted = ctxReload.locationService.getAirport(createdAirportId);
      const ok = cityPersisted && airportPersisted && airportPersisted.city.id === cityPersisted.id;
      log('Escenario 3: Crear ciudad y aeropuerto asociado, verificar relación', ok, ok ? `Ciudad ${cityPersisted.name} y Aeropuerto ${airportPersisted.name} vinculados fielmente` : 'Falla en relación');
    }

    // -------------------------------------------------------------------------
    // Escenario 4: Crear una aerolínea y un vuelo asociado
    // -------------------------------------------------------------------------
    let createdFlightId = null;
    {
      const ctx4 = new SystemContext(true);
      ctx4.init();
      const newAirline = ctx4.airlineService.createAirline('Ultra Air Regional');
      const airports = ctx4.locationService.listAirports();
      const depAirport = airports[0];
      const arrAirport = airports[1];

      const newFlight = ctx4.flightService.createFlight({
        flightName: 'UR101',
        departureId: depAirport.id,
        arrivalId: arrAirport.id,
        departureDate: '2026-11-20',
        departureTime: '10:00',
        arrivalDate: '2026-11-20',
        arrivalTime: '11:00',
        airlineId: newAirline.id,
      });
      createdFlightId = newFlight.id;

      // Simular recarga
      const ctxReload = new SystemContext(true);
      ctxReload.init();
      const flightPersisted = ctxReload.flightService.getFlight(createdFlightId);
      const ok = flightPersisted && flightPersisted.airline.name === 'Ultra Air Regional' && flightPersisted.durationMinutes === 60;
      log('Escenario 4: Crear aerolínea y vuelo asociado, verificar métodos y duración', ok, ok ? `Vuelo ${flightPersisted.flightName} persistido con duración de ${flightPersisted.durationMinutes} min` : 'Falla en vuelo');
    }

    // -------------------------------------------------------------------------
    // Escenario 5: Crear una reserva con varios pasajeros
    // -------------------------------------------------------------------------
    let createdReservationId = null;
    {
      const ctx5 = new SystemContext(true);
      ctx5.init();

      const res = ctx5.reservationService.createReservation({
        customerId: '99887766',
        flightId: createdFlightId,
        passengers: [
          { fullName: 'Pasajero Uno', documentType: 'CC', document: '101', passengerType: 'Adulto', rowNumber: 1, seatNumber: 'A' },
          { fullName: 'Pasajero Dos', documentType: 'CC', document: '102', passengerType: 'Adulto', rowNumber: 1, seatNumber: 'B' },
          { fullName: 'Pasajero Tres', documentType: 'CC', document: '103', passengerType: 'Niño', rowNumber: 1, seatNumber: 'C' },
        ],
      });
      createdReservationId = res.id;

      // Simular recarga
      const ctxReload = new SystemContext(true);
      ctxReload.init();
      const resPersisted = ctxReload.reservationService.getReservation(createdReservationId);
      const ok = resPersisted && resPersisted.details.length === 3;
      log('Escenario 5: Crear reserva con varios pasajeros y verificar persistencia', ok, ok ? `Reserva #${resPersisted.id} con 3 pasajeros persistida íntegramente` : 'Falla en reserva');
    }

    // -------------------------------------------------------------------------
    // Escenario 6: Comprobar que las sillas se conservan correctamente
    // -------------------------------------------------------------------------
    {
      const ctx6 = new SystemContext(true);
      ctx6.init();
      const occupied = ctx6.reservationService.listOccupiedSeats(createdFlightId);
      const seat1A_taken = occupied.includes('1A');
      const seat1B_taken = occupied.includes('1B');
      const seat1C_taken = occupied.includes('1C');
      const seat1D_taken = occupied.includes('1D');

      const ok = seat1A_taken && seat1B_taken && seat1C_taken && !seat1D_taken;
      log('Escenario 6: Comprobar que las sillas ocupadas se conservan correctamente', ok, ok ? 'Sillas 1A, 1B, 1C ocupadas y 1D libre confirmadas tras recarga' : 'Error en estado de sillas');
    }

    // -------------------------------------------------------------------------
    // Escenario 7: Cancelar una reserva y comprobar que las sillas quedan disponibles
    // -------------------------------------------------------------------------
    {
      const ctx7 = new SystemContext(true);
      ctx7.init();
      ctx7.reservationService.cancelReservation(createdReservationId);

      // Simular recarga posterior a la cancelación
      const ctxReload = new SystemContext(true);
      ctxReload.init();
      const resDeleted = ctxReload.reservationRepo.findById(createdReservationId) === null;
      const occupiedAfter = ctxReload.reservationService.listOccupiedSeats(createdFlightId);
      const seat1A_free = !occupiedAfter.includes('1A');
      const seat1B_free = !occupiedAfter.includes('1B');

      const ok = resDeleted && seat1A_free && seat1B_free;
      log('Escenario 7: Cancelar reserva y comprobar que las sillas quedan disponibles', ok, ok ? 'Reserva eliminada y sillas 1A y 1B liberadas tras recarga' : 'Sillas no se liberaron');
    }

    // -------------------------------------------------------------------------
    // Escenario 8: Reiniciar los datos y verificar que regresen las semillas originales
    // -------------------------------------------------------------------------
    {
      const ctx8 = new SystemContext(true);
      ctx8.init();
      ctx8.resetToSeedData();

      // Verificar que los datos creados ya no existan y las semillas estén intactas
      const testCust = ctx8.customerRepo.findById('99887766');
      const allFlights = ctx8.flightRepo.findAll();
      const flightNames = allFlights.map(f => f.flightName);
      const hasUR101 = flightNames.includes('UR101');
      const hasAV8520 = flightNames.includes('AV8520');
      const seedCust = ctx8.customerRepo.findById('1020304050');

      const ok = (!testCust) && (!hasUR101) && hasAV8520 && (seedCust !== null) && (ctx8.flightRepo.count() === 8);
      log('Escenario 8: Reiniciar los datos y verificar que regresen las semillas originales', ok, ok ? 'Semillas restauradas a 8 vuelos y descartados datos temporales' : `testCust=${!!testCust}, hasUR101=${hasUR101}, hasAV8520=${hasAV8520}, count=${ctx8.flightRepo.count()}`);
    }

    // -------------------------------------------------------------------------
    // Escenario 9: Ejecutar nuevamente los 29 casos de prueba
    // -------------------------------------------------------------------------
    {
      const unitResults = runAllTests();
      const allPassed = unitResults.every(r => r.passed);
      log('Escenario 9: Ejecutar nuevamente los 29 casos de prueba', allPassed && unitResults.length === 29, `${unitResults.filter(r => r.passed).length}/29 superados con éxito`);
    }

    // -------------------------------------------------------------------------
    // Escenario 10: Comprobar que las pruebas automatizadas no alteren los datos persistentes de trabajo
    // -------------------------------------------------------------------------
    {
      // Marcamos un dato persistente antes de correr pruebas
      const ctx10 = new SystemContext(true);
      ctx10.init();
      const docTypeCC = ctx10.customerService.getDocumentType('CC');
      const pais = ctx10.customerService.getCountry(1);
      ctx10.customerService.createCustomer(new Customer(
        '88887777',
        'Usuario',
        'Intacto',
        docTypeCC,
        '+573001112222',
        pais,
        'intacto@aero.com',
        'Avenida Siempre Viva'
      ));

      // Corremos las pruebas unitarias que internamente usan SystemContext(false)
      runAllTests();

      // Verificamos que el usuario persistente no haya sido modificado ni borrado
      const ctxAfterTests = new SystemContext(true);
      ctxAfterTests.init();
      const custStillThere = ctxAfterTests.customerRepo.findById('88887777');
      const ok = custStillThere && custStillThere.firstName === 'Usuario';
      log('Escenario 10: Comprobar que las pruebas automatizadas no alteren los datos persistentes', ok, ok ? 'Almacenamiento persistente intacto tras ejecutar pruebas aisladas' : 'Las pruebas alteraron el almacenamiento de trabajo');
    }

    // -------------------------------------------------------------------------
    // Escenario 11: Probar el comportamiento cuando los datos almacenados están dañados
    // -------------------------------------------------------------------------
    {
      // Inyectamos JSON corrupto en localStorage usando la clave oficial STORAGE_KEY
      localStorage.setItem(STORAGE_KEY, '{ "schemaVersion": "1.0.0", invalid_json::: syntax error');

      const ctxCorrupted = new SystemContext(true);
      ctxCorrupted.init();

      // Debe haber activado bandera de corrupción y respaldado en cuarentena sin sobrescribirlo
      const hasCorruptFlag = !!ctxCorrupted.corruptedDataError;
      const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('aerofasttrack_corrupt_backup_'));
      const hasQuarantine = backupKeys.length > 0;
      const loadedSeedsInMemory = ctxCorrupted.flightRepo.count() === 8;

      const ok = hasCorruptFlag && hasQuarantine && loadedSeedsInMemory;
      log('Escenario 11: Probar el comportamiento cuando los datos almacenados están dañados', ok, ok ? `Corrupción detectada, ${backupKeys.length} respaldo(s) en cuarentena preservados` : `flag=${hasCorruptFlag}, quarantine=${hasQuarantine}, seeds=${loadedSeedsInMemory}`);
    }

    // -------------------------------------------------------------------------
    // Escenario 12: Verificar que no se dupliquen registros después de varias recargas
    // -------------------------------------------------------------------------
    {
      // Limpiamos y dejamos que inicialice limpiamente con semillas
      localStorage.clear();
      const ctxInitial = new SystemContext(true);
      ctxInitial.init();
      const count1 = ctxInitial.flightRepo.count();
      const custCount1 = ctxInitial.customerRepo.count();

      // Recarga 1
      const ctxR1 = new SystemContext(true);
      ctxR1.init();
      // Recarga 2
      const ctxR2 = new SystemContext(true);
      ctxR2.init();
      // Recarga 3
      const ctxR3 = new SystemContext(true);
      ctxR3.init();

      const countFinal = ctxR3.flightRepo.count();
      const custCountFinal = ctxR3.customerRepo.count();

      const ok = (countFinal === count1) && (custCountFinal === custCount1);
      log('Escenario 12: Verificar que no se dupliquen registros después de varias recargas', ok, ok ? `Cuentas idénticas tras 3 recargas (Vuelos: ${countFinal}, Clientes: ${custCountFinal})` : 'Se detectaron duplicados tras recargas');
    }

  } catch (err) {
    log('Excepción global en escenarios de persistencia', false, err.message);
  }

  return results;
}
