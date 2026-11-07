/**
 * AeroFastTrack - Vista Dashboard Principal
 * Indicadores en tiempo real con datos de repositorios y accesos rápidos.
 */

export class DashboardView {
  static render(container, sys, navigateTo) {
    const totalCustomers = sys.customerService.countCustomers();
    const totalAirlines = sys.airlineService.countAirlines();
    const totalCities = sys.locationService.countCities();
    const totalAirports = sys.locationService.countAirports();
    const totalFlights = sys.flightService.countFlights();
    const totalReservations = sys.reservationService.countReservations();

    const upcomingFlights = sys.flightService.listFlights().slice(0, 5);
    const recentReservations = sys.reservationService.listReservations().slice(0, 5);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Panel de Control General</h1>
          <p class="page-subtitle">Monitoreo y métricas en tiempo real de operaciones aéreas</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-quick-flight">
            ✈ Programar Vuelo
          </button>
          <button class="btn btn-secondary" id="btn-quick-reservation">
            🎟 Nueva Reserva
          </button>
        </div>
      </div>

      <!-- GRID DE INDICADORES (6 KPIS CON DATOS REALES) -->
      <div class="stats-grid">
        <div class="stat-card" data-module="customers">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-value">${totalCustomers}</span>
            <span class="stat-label">Total Clientes</span>
          </div>
        </div>

        <div class="stat-card" data-module="airlines">
          <div class="stat-icon">🏢</div>
          <div class="stat-info">
            <span class="stat-value">${totalAirlines}</span>
            <span class="stat-label">Aerolíneas</span>
          </div>
        </div>

        <div class="stat-card" data-module="locations">
          <div class="stat-icon">🏙️</div>
          <div class="stat-info">
            <span class="stat-value">${totalCities}</span>
            <span class="stat-label">Ciudades</span>
          </div>
        </div>

        <div class="stat-card" data-module="locations">
          <div class="stat-icon">📍</div>
          <div class="stat-info">
            <span class="stat-value">${totalAirports}</span>
            <span class="stat-label">Aeropuertos</span>
          </div>
        </div>

        <div class="stat-card" data-module="flights">
          <div class="stat-icon">🛫</div>
          <div class="stat-info">
            <span class="stat-value">${totalFlights}</span>
            <span class="stat-label">Vuelos Programados</span>
          </div>
        </div>

        <div class="stat-card" data-module="reservations">
          <div class="stat-icon">📑</div>
          <div class="stat-info">
            <span class="stat-value">${totalReservations}</span>
            <span class="stat-label">Reservas Realizadas</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
        
        <!-- PRÓXIMOS VUELOS -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🛫 Próximos Vuelos Programados</h3>
            <button class="btn btn-secondary btn-sm" id="btn-see-all-flights">Ver todos</button>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vuelo</th>
                  <th>Aerolínea</th>
                  <th>Ruta</th>
                  <th>Salida</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                ${
                  upcomingFlights.length === 0
                    ? `<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 2rem;">No hay vuelos programados</td></tr>`
                    : upcomingFlights.map((f) => `
                        <tr>
                          <td><strong>${f.flightName}</strong></td>
                          <td>${f.airline.name}</td>
                          <td>
                            <span class="route-badge">
                              ${f.departure.city.name} ➔ ${f.arrival.city.name}
                            </span>
                          </td>
                          <td>${f.departureDate} ${f.departureTime}</td>
                          <td><span class="badge badge-info">${f.formattedDuration}</span></td>
                        </tr>
                      `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- RESERVAS RECIENTES -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🎟 Reservas Recientes</h3>
            <button class="btn btn-secondary btn-sm" id="btn-see-all-res">Ver todas</button>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th># Reserva</th>
                  <th>Cliente</th>
                  <th>Vuelo</th>
                  <th>Pasajeros</th>
                  <th>Sillas</th>
                </tr>
              </thead>
              <tbody>
                ${
                  recentReservations.length === 0
                    ? `<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 2rem;">No hay reservas registradas</td></tr>`
                    : recentReservations.map((r) => `
                        <tr>
                          <td><strong>#${r.id}</strong></td>
                          <td>${r.customer.fullName}</td>
                          <td><span class="badge badge-accent">${r.flight.flightName}</span></td>
                          <td>${r.details.length} pasajero(s)</td>
                          <td>
                            ${r.details.map((d) => `<span class="badge badge-info">${d.seat.code}</span>`).join(' ')}
                          </td>
                        </tr>
                      `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    // Interacciones y navegación
    container.querySelectorAll('.stat-card').forEach((card) => {
      card.addEventListener('click', () => {
        const mod = card.dataset.module;
        if (mod && navigateTo) navigateTo(mod);
      });
    });

    container.querySelector('#btn-quick-flight').addEventListener('click', () => navigateTo('flights'));
    container.querySelector('#btn-quick-reservation').addEventListener('click', () => navigateTo('reservations'));
    container.querySelector('#btn-see-all-flights').addEventListener('click', () => navigateTo('flights'));
    container.querySelector('#btn-see-all-res').addEventListener('click', () => navigateTo('reservations'));
  }
}
