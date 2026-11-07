/**
 * AeroFastTrack - Vista Módulo 4: Vuelos y Reporte Mensual
 */

import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class FlightsView {
  static render(container, sys) {
    let activeTab = 'flights'; // 'flights', 'monthlyReport'

    function renderView() {
      container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Gestión de Vuelos y Rutas</h1>
            <p class="page-subtitle">Programación de itinerarios, cálculo de tiempos y reportes mensuales</p>
          </div>
          <div class="page-actions" id="flight-actions"></div>
        </div>

        <div class="tabs-header">
          <button class="tab-btn ${activeTab === 'flights' ? 'active' : ''}" data-tab="flights">
            🛫 Vuelos Programados (${sys.flightService.countFlights()})
          </button>
          <button class="tab-btn ${activeTab === 'monthlyReport' ? 'active' : ''}" data-tab="monthlyReport">
            📊 Reporte Mensual por Aerolínea
          </button>
        </div>

        <div id="flight-content"></div>
      `;

      container.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab;
          renderView();
        });
      });

      if (activeTab === 'flights') renderFlightList();
      else renderMonthlyReport();
    }

    // ==========================================
    // PESTAÑA: LISTADO DE VUELOS
    // ==========================================
    function renderFlightList() {
      const actionsEl = container.querySelector('#flight-actions');
      actionsEl.innerHTML = `
        <button class="btn btn-primary" id="btn-new-flight">
          + Programar Vuelo
        </button>
      `;
      actionsEl.querySelector('#btn-new-flight').onclick = () => openFlightModal();

      const contentEl = container.querySelector('#flight-content');
      contentEl.innerHTML = `
        <div class="card">
          <div class="filter-bar">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" id="flight-search" class="search-input" placeholder="Buscar por código de vuelo o ciudad..." />
            </div>
            <select id="flight-filter-airline" class="form-control" style="width: auto;">
              <option value="">Todas las Aerolíneas</option>
              ${sys.airlineService.listAirlines().map((a) => `<option value="${a.id}">${a.name}</option>`).join('')}
            </select>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Aerolínea</th>
                  <th>Ruta</th>
                  <th>Salida</th>
                  <th>Llegada</th>
                  <th>Duración</th>
                  <th>Pasajeros</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody id="flight-table-body"></tbody>
            </table>
          </div>
        </div>
      `;

      const searchInput = contentEl.querySelector('#flight-search');
      const airlineFilter = contentEl.querySelector('#flight-filter-airline');
      const tableBody = contentEl.querySelector('#flight-table-body');

      function updateTable() {
        let list = sys.flightService.listFlights();
        const term = searchInput.value.toLowerCase().trim();
        const airlineId = airlineFilter.value;

        if (term) {
          list = list.filter((f) =>
            f.flightName.toLowerCase().includes(term) ||
            f.departure.city.name.toLowerCase().includes(term) ||
            f.arrival.city.name.toLowerCase().includes(term) ||
            f.departure.name.toLowerCase().includes(term) ||
            f.arrival.name.toLowerCase().includes(term)
          );
        }

        if (airlineId) {
          list = list.filter((f) => f.airline.id === Number(airlineId));
        }

        if (list.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 2rem;">No se encontraron vuelos</td></tr>`;
          return;
        }

        tableBody.innerHTML = list.map((f) => {
          const passCount = sys.reservationService.countPassengersByFlight(f.id);
          return `
            <tr>
              <td><strong>${f.flightName}</strong></td>
              <td>${f.airline.name}</td>
              <td>
                <span class="route-badge">
                  ${f.departure.city.name} (${f.departure.name}) ➔ ${f.arrival.city.name} (${f.arrival.name})
                </span>
              </td>
              <td>${f.departureDate} <span style="color:var(--color-accent); font-weight:600;">${f.departureTime}</span></td>
              <td>${f.arrivalDate} <span style="color:var(--color-accent); font-weight:600;">${f.arrivalTime}</span></td>
              <td><span class="badge badge-info">${f.formattedDuration}</span></td>
              <td><span class="badge ${passCount > 0 ? 'badge-success' : 'badge-warning'}">${passCount}</span></td>
              <td style="text-align: right;">
                <button class="btn btn-secondary btn-sm btn-edit-flight" data-id="${f.id}">Reprogramar</button>
                <button class="btn btn-danger btn-sm btn-delete-flight" data-id="${f.id}" style="margin-left: 0.35rem;">Cancelar</button>
              </td>
            </tr>
          `;
        }).join('');

        tableBody.querySelectorAll('.btn-edit-flight').forEach((b) => {
          b.onclick = () => openFlightModal(Number(b.dataset.id));
        });

        tableBody.querySelectorAll('.btn-delete-flight').forEach((b) => {
          b.onclick = () => handleDeleteFlight(Number(b.dataset.id));
        });
      }

      searchInput.oninput = updateTable;
      airlineFilter.onchange = updateTable;
      updateTable();
    }

    function openFlightModal(flightId = null) {
      const isEdit = flightId !== null;
      const existing = isEdit ? sys.flightService.getFlight(flightId) : null;
      const airlines = sys.airlineService.listAirlines();
      const airports = sys.locationService.listAirports();

      if (airlines.length === 0 || airports.length < 2) {
        toast.warning('Requisitos insuficientes', 'Se requieren al menos una aerolínea y dos aeropuertos para programar un vuelo.');
        return;
      }

      const bodyHtml = `
        <form id="form-flight" class="form-grid">
          <div class="form-group">
            <label class="form-label required">Código de Vuelo (Máx. 8 alfanumérico)</label>
            <input type="text" id="m-fl-name" class="form-control" maxlength="8" required value="${existing ? existing.flightName : ''}" placeholder="Ej. AV8520" style="text-transform: uppercase;" />
          </div>

          <div class="form-group">
            <label class="form-label required">Aerolínea Operadora</label>
            <select id="m-fl-airline" class="form-control" required>
              ${airlines.map((a) => `<option value="${a.id}" ${existing && existing.airline.id === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Aeropuerto de Salida (Origen)</label>
            <select id="m-fl-dep" class="form-control" required>
              ${airports.map((a) => `<option value="${a.id}" ${existing && existing.departure.id === a.id ? 'selected' : ''}>${a.city.name} - ${a.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Aeropuerto de Llegada (Destino)</label>
            <select id="m-fl-arr" class="form-control" required>
              ${airports.map((a) => `<option value="${a.id}" ${existing && existing.arrival.id === a.id ? 'selected' : ''}>${a.city.name} - ${a.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Fecha de Salida</label>
            <input type="date" id="m-fl-dep-date" class="form-control" required value="${existing ? existing.departureDate : '2026-11-20'}" />
          </div>

          <div class="form-group">
            <label class="form-label required">Hora de Salida</label>
            <input type="time" id="m-fl-dep-time" class="form-control" required value="${existing ? existing.departureTime : '08:00'}" />
          </div>

          <div class="form-group">
            <label class="form-label required">Fecha de Llegada</label>
            <input type="date" id="m-fl-arr-date" class="form-control" required value="${existing ? existing.arrivalDate : '2026-11-20'}" />
          </div>

          <div class="form-group">
            <label class="form-label required">Hora de Llegada</label>
            <input type="time" id="m-fl-arr-time" class="form-control" required value="${existing ? existing.arrivalTime : '09:30'}" />
          </div>

          <div class="form-group full-width" style="margin-top: 0.5rem; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; justify-content: space-between;">
              <span>Estimación de Duración:</span>
              <strong id="m-fl-duration-preview" style="color: var(--color-accent);">-</strong>
            </div>
          </div>
        </form>
      `;

      modal.open({
        title: isEdit ? 'Reprogramar Vuelo' : 'Programar Nuevo Vuelo',
        bodyHtml,
        confirmText: isEdit ? 'Actualizar Itinerario' : 'Programar Vuelo',
        onConfirm: () => {
          const flightName = document.getElementById('m-fl-name').value;
          const airlineId = Number(document.getElementById('m-fl-airline').value);
          const departureId = document.getElementById('m-fl-dep').value;
          const arrivalId = document.getElementById('m-fl-arr').value;
          const departureDate = document.getElementById('m-fl-dep-date').value;
          const departureTime = document.getElementById('m-fl-dep-time').value;
          const arrivalDate = document.getElementById('m-fl-arr-date').value;
          const arrivalTime = document.getElementById('m-fl-arr-time').value;

          try {
            if (isEdit) {
              sys.flightService.updateFlight(existing.id, {
                flightName,
                airlineId,
                departureId,
                arrivalId,
                departureDate,
                departureTime,
                arrivalDate,
                arrivalTime,
              });
              toast.success('Itinerario Actualizado', `Vuelo ${flightName} reprogramado exitosamente.`);
            } else {
              sys.flightService.createFlight({
                flightName,
                airlineId,
                departureId,
                arrivalId,
                departureDate,
                departureTime,
                arrivalDate,
                arrivalTime,
              });
              toast.success('Vuelo Programado', `Vuelo ${flightName} registrado en el sistema.`);
            }
            renderView();
            return true;
          } catch (err) {
            toast.error('Validación de Vuelo', err.message);
            return false;
          }
        },
      });

      // Cálculo de vista previa de duración en vivo
      function updateDurationPreview() {
        const depD = document.getElementById('m-fl-dep-date')?.value;
        const depT = document.getElementById('m-fl-dep-time')?.value;
        const arrD = document.getElementById('m-fl-arr-date')?.value;
        const arrT = document.getElementById('m-fl-arr-time')?.value;
        const previewEl = document.getElementById('m-fl-duration-preview');

        if (depD && depT && arrD && arrT && previewEl) {
          const start = new Date(`${depD}T${depT}:00`);
          const end = new Date(`${arrD}T${arrT}:00`);
          const diffMs = end - start;
          if (diffMs > 0) {
            const mins = Math.floor(diffMs / (1000 * 60));
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            previewEl.textContent = `${h > 0 ? h + ' h ' : ''}${m} min`;
            previewEl.style.color = 'var(--color-accent)';
          } else {
            previewEl.textContent = 'Llegada debe ser posterior a salida';
            previewEl.style.color = 'var(--color-danger)';
          }
        }
      }

      ['m-fl-dep-date', 'm-fl-dep-time', 'm-fl-arr-date', 'm-fl-arr-time'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateDurationPreview);
      });
      updateDurationPreview();
    }

    async function handleDeleteFlight(id) {
      const f = sys.flightService.getFlight(id);
      const confirmed = await modal.confirm({
        title: '¿Cancelar Vuelo?',
        message: `¿Está seguro de cancelar el vuelo ${f.flightName} (${f.departure.city.name} ➔ ${f.arrival.city.name})? Solo se permitirá si no tiene reservas de pasajeros activas.`,
        confirmText: 'Cancelar Vuelo',
      });
      if (!confirmed) return;

      try {
        sys.flightService.deleteFlight(id);
        toast.success('Vuelo Cancelado', `El vuelo ${f.flightName} fue cancelado.`);
        renderView();
      } catch (err) {
        toast.error('Restricción de Integridad', err.message);
      }
    }

    // ==========================================
    // PESTAÑA: REPORTE MENSUAL (uspVuelosPorAerolinea)
    // ==========================================
    function renderMonthlyReport() {
      const actionsEl = container.querySelector('#flight-actions');
      actionsEl.innerHTML = '';

      const contentEl = container.querySelector('#flight-content');
      contentEl.innerHTML = `
        <div class="report-header-card">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff;">Reporte Oficial de Vuelos por Aerolínea</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
              Equivalente al procedimiento almacenado <code>uspVuelosPorAerolinea(año, mes)</code>
            </p>
          </div>

          <div class="report-controls">
            <div class="form-group">
              <label class="form-label">Año</label>
              <select id="rep-year" class="form-control" style="width: 100px;">
                <option value="2026" selected>2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Mes</label>
              <select id="rep-month" class="form-control" style="width: 160px;">
                <option value="1">01 - Enero</option>
                <option value="2">02 - Febrero</option>
                <option value="3">03 - Marzo</option>
                <option value="4">04 - Abril</option>
                <option value="5">05 - Mayo</option>
                <option value="6">06 - Junio</option>
                <option value="7">07 - Julio</option>
                <option value="8">08 - Agosto</option>
                <option value="9">09 - Septiembre</option>
                <option value="10">10 - Octubre</option>
                <option value="11" selected>11 - Noviembre</option>
                <option value="12">12 - Diciembre</option>
              </select>
            </div>
            <button class="btn btn-primary" id="btn-generate-report" style="margin-top: 1.25rem;">
              Consultar Reporte
            </button>
          </div>
        </div>

        <div id="report-results"></div>
      `;

      const yearSelect = contentEl.querySelector('#rep-year');
      const monthSelect = contentEl.querySelector('#rep-month');
      const resultsContainer = contentEl.querySelector('#report-results');

      function executeReport() {
        const year = yearSelect.value;
        const month = monthSelect.value;
        try {
          const reportMap = sys.flightService.listFlightsByAirlineInMonth(year, month);
          if (reportMap.size === 0) {
            resultsContainer.innerHTML = `
              <div class="card" style="text-align: center; padding: 3rem;">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✈️</div>
                <h3 style="color: var(--text-main);">Sin vuelos en ese periodo</h3>
                <p style="color: var(--text-dim); font-size: 0.9rem;">No se registraron vuelos programados para ${monthSelect.options[monthSelect.selectedIndex].text} de ${year}.</p>
              </div>
            `;
            return;
          }

          let html = '';
          reportMap.forEach((flights, airline) => {
            html += `
              <div class="airline-group-card">
                <div class="airline-group-header">
                  <span class="airline-group-name">
                    🏢 ${airline.name} (Código ${airline.id})
                  </span>
                  <span class="badge badge-accent">${flights.length} vuelo(s)</span>
                </div>
                <div class="table-responsive">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Código Vuelo</th>
                        <th>Ciudad Salida</th>
                        <th>Aeropuerto Salida</th>
                        <th>Fecha y Hora Salida</th>
                        <th>Ciudad Llegada</th>
                        <th>Aeropuerto Llegada</th>
                        <th>Fecha y Hora Llegada</th>
                        <th>Duración</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${flights.map((f) => `
                        <tr>
                          <td><strong>${f.flightName}</strong></td>
                          <td>${f.departure.city.name}</td>
                          <td>${f.departure.name}</td>
                          <td>${f.departureDate} ${f.departureTime}</td>
                          <td>${f.arrival.city.name}</td>
                          <td>${f.arrival.name}</td>
                          <td>${f.arrivalDate} ${f.arrivalTime}</td>
                          <td><span class="badge badge-info">${f.formattedDuration}</span></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            `;
          });

          resultsContainer.innerHTML = html;
        } catch (err) {
          toast.error('Error en Reporte', err.message);
        }
      }

      contentEl.querySelector('#btn-generate-report').onclick = executeReport;
      executeReport();
    }

    renderView();
  }
}
