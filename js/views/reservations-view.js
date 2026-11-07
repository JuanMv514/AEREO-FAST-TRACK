/**
 * AeroFastTrack - Vista Módulo 5: Reservas, Pasajeros y Manifiesto de Vuelo
 */

import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { SeatPicker } from '../components/seat-picker.js';

export class ReservationsView {
  static render(container, sys) {
    let activeTab = 'activeReservations'; // 'activeReservations', 'newReservation', 'manifest'

    function renderView() {
      container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Reservas, Pasajeros y Manifiesto</h1>
            <p class="page-subtitle">Emisión de boletos, asignación de sillas en cabina y despacho de vuelo</p>
          </div>
          <div class="page-actions" id="res-actions"></div>
        </div>

        <div class="tabs-header">
          <button class="tab-btn ${activeTab === 'activeReservations' ? 'active' : ''}" data-tab="activeReservations">
            🎟 Reservas Activas (${sys.reservationService.countReservations()})
          </button>
          <button class="tab-btn ${activeTab === 'newReservation' ? 'active' : ''}" data-tab="newReservation">
            ✨ Nueva Reserva Asistida
          </button>
          <button class="tab-btn ${activeTab === 'manifest' ? 'active' : ''}" data-tab="manifest">
            📋 Manifiesto de Vuelo (Despacho)
          </button>
        </div>

        <div id="res-content"></div>
      `;

      container.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab;
          renderView();
        });
      });

      if (activeTab === 'activeReservations') renderReservationsList();
      else if (activeTab === 'newReservation') renderNewReservationWizard();
      else renderFlightManifest();
    }

    // ==========================================
    // PESTAÑA 1: LISTADO DE RESERVAS ACTIVAS
    // ==========================================
    function renderReservationsList() {
      const actionsEl = container.querySelector('#res-actions');
      actionsEl.innerHTML = `
        <button class="btn btn-primary" id="btn-go-wizard">
          + Crear Nueva Reserva
        </button>
      `;
      actionsEl.querySelector('#btn-go-wizard').onclick = () => {
        activeTab = 'newReservation';
        renderView();
      };

      const contentEl = container.querySelector('#res-content');
      contentEl.innerHTML = `
        <div class="card">
          <div class="filter-bar">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" id="res-search" class="search-input" placeholder="Buscar por titular, documento o código de vuelo..." />
            </div>
            <select id="res-filter-flight" class="form-control" style="width: auto;">
              <option value="">Todos los Vuelos</option>
              ${sys.flightService.listFlights().map((f) => `<option value="${f.id}">${f.flightName} (${f.departure.city.name} ➔ ${f.arrival.city.name})</option>`).join('')}
            </select>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th># Reserva</th>
                  <th>Cliente Titular</th>
                  <th>Vuelo</th>
                  <th>Itinerario</th>
                  <th>Pasajeros y Sillas</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody id="res-table-body"></tbody>
            </table>
          </div>
        </div>
      `;

      const searchInput = contentEl.querySelector('#res-search');
      const flightFilter = contentEl.querySelector('#res-filter-flight');
      const tableBody = contentEl.querySelector('#res-table-body');

      function updateTable() {
        let list = sys.reservationService.listReservations();
        const term = searchInput.value.toLowerCase().trim();
        const flightId = flightFilter.value;

        if (term) {
          list = list.filter((r) =>
            r.customer.fullName.toLowerCase().includes(term) ||
            r.customer.id.toLowerCase().includes(term) ||
            r.flight.flightName.toLowerCase().includes(term) ||
            r.details.some((d) => d.passengerFullName.toLowerCase().includes(term) || d.passengerDocument.toLowerCase().includes(term))
          );
        }

        if (flightId) {
          list = list.filter((r) => r.flight.id === Number(flightId));
        }

        if (list.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 2rem;">No se encontraron reservas</td></tr>`;
          return;
        }

        tableBody.innerHTML = list.map((r) => `
          <tr>
            <td><strong style="color:var(--color-accent);">#${r.id}</strong></td>
            <td>
              <div><strong>${r.customer.fullName}</strong></div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${r.customer.documentType.id}: ${r.customer.id}</span>
            </td>
            <td>
              <span class="badge badge-accent">${r.flight.flightName}</span>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${r.flight.airline.name}</div>
            </td>
            <td>
              <span class="route-badge">
                ${r.flight.departure.city.name} ➔ ${r.flight.arrival.city.name}
              </span>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                ${r.flight.departureDate} ${r.flight.departureTime}
              </div>
            </td>
            <td>
              ${r.details.map((d) => `
                <div style="margin-bottom: 3px; font-size: 0.85rem;">
                  <span class="badge badge-info">${d.seat.code}</span>
                  <strong>${d.passengerFullName}</strong> (${d.passengerDocument})
                </div>
              `).join('')}
            </td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm btn-manage-res" data-id="${r.id}">Gestionar</button>
              <button class="btn btn-danger btn-sm btn-cancel-res" data-id="${r.id}" style="margin-left: 0.35rem;">Cancelar</button>
            </td>
          </tr>
        `).join('');

        tableBody.querySelectorAll('.btn-manage-res').forEach((b) => {
          b.onclick = () => openManageReservationModal(Number(b.dataset.id));
        });

        tableBody.querySelectorAll('.btn-cancel-res').forEach((b) => {
          b.onclick = () => handleCancelReservation(Number(b.dataset.id));
        });
      }

      searchInput.oninput = updateTable;
      flightFilter.onchange = updateTable;
      updateTable();
    }

    // Modal de gestión de reserva (cambio de silla, adición/remoción de pasajero)
    function openManageReservationModal(resId) {
      const res = sys.reservationService.getReservation(resId);

      const bodyHtml = `
        <div style="margin-bottom: 1.25rem; padding: 1rem; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span><strong>Titular:</strong> ${res.customer.fullName} (${res.customer.id})</span>
            <span class="badge badge-accent">Vuelo: ${res.flight.flightName}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            Ruta: ${res.flight.departure.city.name} ➔ ${res.flight.arrival.city.name} | Salida: ${res.flight.departureDate} ${res.flight.departureTime}
          </div>
        </div>

        <h4 style="margin-bottom: 0.75rem;">Pasajeros Registrados (${res.details.length}):</h4>
        <div class="table-responsive" style="margin-bottom: 1.5rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Pasajero</th>
                <th>Documento</th>
                <th>Silla</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${res.details.map((d) => `
                <tr>
                  <td><strong>${d.passengerFullName}</strong></td>
                  <td>${d.passengerDocument}</td>
                  <td><span class="badge badge-accent">${d.seat.code}</span></td>
                  <td style="text-align: right;">
                    <button class="btn btn-secondary btn-sm btn-change-seat" data-detail-id="${d.id}">Cambiar Silla</button>
                    <button class="btn btn-danger btn-sm btn-remove-passenger" data-detail-id="${d.id}" style="margin-left: 0.25rem;">Quitar</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="text-align: right;">
          <button class="btn btn-secondary btn-sm" id="btn-add-passenger-modal">+ Añadir Pasajero a Reserva</button>
        </div>
      `;

      modal.open({
        title: `Gestión de Reserva #${res.id}`,
        bodyHtml,
        confirmText: 'Cerrar',
        confirmClass: 'btn-secondary',
        onConfirm: () => true,
      });

      const bodyEl = document.getElementById('modal-body');

      // Botón Cambiar Silla
      bodyEl.querySelectorAll('.btn-change-seat').forEach((btn) => {
        btn.onclick = () => {
          const detailId = Number(btn.dataset.detailId);
          openChangeSeatModal(res.id, detailId);
        };
      });

      // Botón Quitar Pasajero
      bodyEl.querySelectorAll('.btn-remove-passenger').forEach((btn) => {
        btn.onclick = async () => {
          const detailId = Number(btn.dataset.detailId);
          try {
            sys.reservationService.removePassenger(res.id, detailId);
            toast.success('Pasajero Removido', 'Se liberó la silla y se actualizó la reserva.');
            modal.close();
            openManageReservationModal(res.id);
            renderView();
          } catch (err) {
            toast.error('Restricción', err.message);
          }
        };
      });

      // Botón Añadir Pasajero
      const addBtn = bodyEl.querySelector('#btn-add-passenger-modal');
      if (addBtn) {
        addBtn.onclick = () => {
          openAddPassengerModal(res.id);
        };
      }
    }

    function openChangeSeatModal(resId, detailId) {
      const res = sys.reservationService.getReservation(resId);
      const detail = res.findDetailById(detailId);

      let chosenRow = detail.seat.rowNumber;
      let chosenSeat = detail.seat.seatNumber;

      const bodyHtml = `
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
          Seleccione una nueva silla disponible para el pasajero <strong>${detail.passengerFullName}</strong> (Actual: ${detail.seat.code}):
        </p>
        <div id="modal-seat-picker-container"></div>
        <div style="margin-top: 1rem; text-align: center; font-weight: 600;">
          Nueva silla seleccionada: <span id="modal-chosen-seat" style="color: var(--color-accent); font-size: 1.1rem;">${detail.seat.code}</span>
        </div>
      `;

      modal.open({
        title: 'Reasignar Silla de Vuelo',
        bodyHtml,
        confirmText: 'Confirmar Asignación',
        onConfirm: () => {
          try {
            sys.reservationService.changeSeat(res.id, detail.id, chosenRow, chosenSeat);
            toast.success('Silla Asignada', `Pasajero reasignado a la silla ${chosenRow}${chosenSeat}`);
            openManageReservationModal(res.id);
            renderView();
            return true;
          } catch (err) {
            toast.error('Error de Asignación', err.message);
            return false;
          }
        },
      });

      const pickerContainer = document.getElementById('modal-seat-picker-container');
      const chosenLabel = document.getElementById('modal-chosen-seat');
      SeatPicker.render({
        containerEl: pickerContainer,
        flightId: res.flight.id,
        reservationService: sys.reservationService,
        selectedSeatCode: detail.seat.code,
        onSeatSelect: (row, seat, code) => {
          chosenRow = row;
          chosenSeat = seat;
          chosenLabel.textContent = code;
        },
      });
    }

    function openAddPassengerModal(resId) {
      const res = sys.reservationService.getReservation(resId);

      let chosenRow = '1';
      let chosenSeat = 'A';

      const bodyHtml = `
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Nombre Completo del Pasajero</label>
          <input type="text" id="m-add-pass-name" class="form-control" maxlength="50" required placeholder="Ej. Roberto Morales" />
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Documento de Identidad</label>
          <input type="text" id="m-add-pass-doc" class="form-control" maxlength="20" required placeholder="Ej. 1098765432" />
        </div>
        <label class="form-label required">Seleccione Silla:</label>
        <div id="m-add-seat-container"></div>
        <div style="margin-top: 0.75rem; text-align: center; font-weight: 600;">
          Silla seleccionada: <span id="m-add-seat-label" style="color: var(--color-accent); font-size: 1.1rem;">Ninguna</span>
        </div>
      `;

      modal.open({
        title: 'Añadir Pasajero a la Reserva',
        bodyHtml,
        confirmText: 'Agregar Pasajero',
        onConfirm: () => {
          const name = document.getElementById('m-add-pass-name').value;
          const doc = document.getElementById('m-add-pass-doc').value;
          try {
            sys.reservationService.addPassenger(res.id, {
              fullName: name,
              document: doc,
              rowNumber: chosenRow,
              seatNumber: chosenSeat,
            });
            toast.success('Pasajero Agregado', `${name} asignado a la silla ${chosenRow}${chosenSeat}`);
            openManageReservationModal(res.id);
            renderView();
            return true;
          } catch (err) {
            toast.error('Error al agregar pasajero', err.message);
            return false;
          }
        },
      });

      const pickerContainer = document.getElementById('m-add-seat-container');
      const seatLabel = document.getElementById('m-add-seat-label');
      SeatPicker.render({
        containerEl: pickerContainer,
        flightId: res.flight.id,
        reservationService: sys.reservationService,
        onSeatSelect: (row, seat, code) => {
          chosenRow = row;
          chosenSeat = seat;
          seatLabel.textContent = code;
        },
      });
    }

    async function handleCancelReservation(id) {
      const res = sys.reservationService.getReservation(id);
      const confirmed = await modal.confirm({
        title: '¿Cancelar Reserva Completa?',
        message: `¿Está seguro de cancelar la reserva #${res.id} de ${res.customer.fullName} en el vuelo ${res.flight.flightName}? Se liberarán todas las sillas asignadas inmediatamente.`,
        confirmText: 'Cancelar Reserva',
      });
      if (!confirmed) return;

      try {
        sys.reservationService.cancelReservation(id);
        toast.success('Reserva Cancelada', `La reserva #${id} ha sido cancelada y sus sillas quedaron liberadas.`);
        renderView();
      } catch (err) {
        toast.error('Error', err.message);
      }
    }

    // ==========================================
    // PESTAÑA 2: ASISTENTE DE NUEVA RESERVA (WIZARD)
    // ==========================================
    function renderNewReservationWizard() {
      const actionsEl = container.querySelector('#res-actions');
      actionsEl.innerHTML = `
        <button class="btn btn-secondary" id="btn-back-to-list">
          ← Volver a Reservas
        </button>
      `;
      actionsEl.querySelector('#btn-back-to-list').onclick = () => {
        activeTab = 'activeReservations';
        renderView();
      };

      const customers = sys.customerService.listCustomers();
      const flights = sys.flightService.listFlights().filter((f) => !f.hasDeparted());

      if (customers.length === 0 || flights.length === 0) {
        container.querySelector('#res-content').innerHTML = `
          <div class="card" style="text-align: center; padding: 3rem;">
            <h3>No es posible crear reservas en este momento</h3>
            <p style="color: var(--text-dim); margin-top: 0.5rem;">Debe existir al menos un cliente y un vuelo vigente no despegado.</p>
          </div>
        `;
        return;
      }

      let selectedFlightId = flights[0].id;
      let passengers = [{ fullName: '', document: '', rowNumber: '1', seatNumber: 'A', seatCode: '1A' }];

      const contentEl = container.querySelector('#res-content');
      contentEl.innerHTML = `
        <div class="card" style="max-width: 950px; margin: 0 auto;">
          <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 1.5rem; color: #fff;">
            Asistente de Emisión de Reserva Aérea
          </h2>

          <div class="form-grid" style="margin-bottom: 2rem;">
            <div class="form-group">
              <label class="form-label required">1. Cliente Titular</label>
              <select id="wiz-customer" class="form-control" required>
                ${customers.map((c) => `<option value="${c.id}">${c.fullName} (${c.documentType.id}: ${c.id})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">2. Seleccione Vuelo</label>
              <select id="wiz-flight" class="form-control" required>
                ${flights.map((f) => `
                  <option value="${f.id}" ${f.id === selectedFlightId ? 'selected' : ''}>
                    ${f.flightName} (${f.airline.name}): ${f.departure.city.name} ➔ ${f.arrival.city.name} [${f.departureDate} ${f.departureTime}]
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h3 style="font-size: 1.15rem; font-weight: 600;">3. Pasajeros y Asignación de Sillas</h3>
            <button class="btn btn-secondary btn-sm" id="btn-wiz-add-row">+ Añadir Pasajero</button>
          </div>

          <div id="wiz-passengers-container" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;"></div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
            <button class="btn btn-secondary" id="btn-wiz-cancel">Cancelar</button>
            <button class="btn btn-primary" id="btn-wiz-submit">🎟 Confirmar y Emitir Reserva</button>
          </div>
        </div>
      `;

      const customerSelect = contentEl.querySelector('#wiz-customer');
      const flightSelect = contentEl.querySelector('#wiz-flight');
      const passContainer = contentEl.querySelector('#wiz-passengers-container');

      flightSelect.onchange = () => {
        selectedFlightId = Number(flightSelect.value);
        renderPassengerRows();
      };

      function renderPassengerRows() {
        passContainer.innerHTML = '';
        passengers.forEach((p, index) => {
          const rowDiv = document.createElement('div');
          rowDiv.className = 'card';
          rowDiv.style.background = 'var(--bg-input)';
          rowDiv.style.padding = '1rem';

          rowDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <strong style="color: var(--color-accent);">Pasajero #${index + 1}</strong>
              ${passengers.length > 1 ? `<button class="btn btn-danger btn-sm btn-wiz-del" data-index="${index}">Quitar</button>` : ''}
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label required">Nombre Completo</label>
                <input type="text" class="form-control p-name" maxlength="50" required value="${p.fullName}" placeholder="Ej. Roberto Morales" />
              </div>
              <div class="form-group">
                <label class="form-label required">Documento</label>
                <input type="text" class="form-control p-doc" maxlength="20" required value="${p.document}" placeholder="Ej. 1098765432" />
              </div>
              <div class="form-group">
                <label class="form-label required">Silla Asignada</label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span class="badge badge-accent p-seat-badge" style="font-size: 0.95rem; padding: 0.4rem 0.8rem;">${p.seatCode || 'Sin Silla'}</span>
                  <button type="button" class="btn btn-secondary btn-sm btn-pick-seat" data-index="${index}">Elegir en Cabina ✈</button>
                </div>
              </div>
            </div>
          `;

          rowDiv.querySelector('.p-name').oninput = (e) => { passengers[index].fullName = e.target.value; };
          rowDiv.querySelector('.p-doc').oninput = (e) => { passengers[index].document = e.target.value; };

          if (rowDiv.querySelector('.btn-wiz-del')) {
            rowDiv.querySelector('.btn-wiz-del').onclick = () => {
              passengers.splice(index, 1);
              renderPassengerRows();
            };
          }

          rowDiv.querySelector('.btn-pick-seat').onclick = () => {
            openSeatModalForPassenger(index);
          };

          passContainer.appendChild(rowDiv);
        });
      }

      function openSeatModalForPassenger(passengerIndex) {
        let chosenRow = passengers[passengerIndex].rowNumber || '1';
        let chosenSeat = passengers[passengerIndex].seatNumber || 'A';
        let chosenCode = passengers[passengerIndex].seatCode || '1A';

        const bodyHtml = `
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
            Seleccione una silla libre en el mapa de cabina:
          </p>
          <div id="wizard-cabin-container"></div>
          <div style="margin-top: 1rem; text-align: center; font-weight: 700;">
            Silla seleccionada: <span id="wiz-picked-code" style="color: var(--color-accent); font-size: 1.25rem;">${chosenCode}</span>
          </div>
        `;

        modal.open({
          title: `Selección de Asiento - Pasajero #${passengerIndex + 1}`,
          bodyHtml,
          confirmText: 'Confirmar Asiento',
          onConfirm: () => {
            passengers[passengerIndex].rowNumber = chosenRow;
            passengers[passengerIndex].seatNumber = chosenSeat;
            passengers[passengerIndex].seatCode = chosenCode;
            renderPassengerRows();
            return true;
          },
        });

        const cabinContainer = document.getElementById('wizard-cabin-container');
        const codeLabel = document.getElementById('wiz-picked-code');
        SeatPicker.render({
          containerEl: cabinContainer,
          flightId: selectedFlightId,
          reservationService: sys.reservationService,
          selectedSeatCode: chosenCode,
          onSeatSelect: (r, s, c) => {
            chosenRow = r;
            chosenSeat = s;
            chosenCode = c;
            codeLabel.textContent = c;
          },
        });
      }

      contentEl.querySelector('#btn-wiz-add-row').onclick = () => {
        if (passengers.length >= 9) {
          toast.warning('Límite alcanzado', 'El límite máximo por reserva es de 9 pasajeros.');
          return;
        }
        passengers.push({ fullName: '', document: '', rowNumber: '1', seatNumber: 'A', seatCode: '1A' });
        renderPassengerRows();
      };

      contentEl.querySelector('#btn-wiz-cancel').onclick = () => {
        activeTab = 'activeReservations';
        renderView();
      };

      contentEl.querySelector('#btn-wiz-submit').onclick = () => {
        const customerId = customerSelect.value;
        const flightId = Number(flightSelect.value);

        try {
          sys.reservationService.createReservation({
            customerId,
            flightId,
            passengers,
          });
          toast.success('Reserva Emitida', `Reserva registrada con éxito para ${passengers.length} pasajero(s).`);
          activeTab = 'activeReservations';
          renderView();
        } catch (err) {
          toast.error('Error al emitir reserva', err.message);
        }
      };

      renderPassengerRows();
    }

    // ==========================================
    // PESTAÑA 3: MANIFIESTO DE VUELO (DESPACHO)
    // ==========================================
    function renderFlightManifest() {
      const actionsEl = container.querySelector('#res-actions');
      actionsEl.innerHTML = '';

      const flights = sys.flightService.listFlights();

      const contentEl = container.querySelector('#res-content');
      contentEl.innerHTML = `
        <div class="card manifest-card" style="margin-bottom: 2rem;">
          <div class="manifest-banner">
            <div>
              <span style="text-transform: uppercase; letter-spacing: 1.5px; font-size: 0.75rem; opacity: 0.9;">Control Operacional de Tráfico Aéreo</span>
              <h2 class="manifest-flight-code" id="manifest-banner-title">Manifiesto Oficial de Pasajeros</h2>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <label style="font-size: 0.85rem; font-weight: 600;">Seleccionar Vuelo:</label>
              <select id="manifest-flight-select" class="form-control" style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.4); color: #fff; width: auto;">
                ${flights.map((f) => `<option value="${f.id}">${f.flightName} - ${f.departure.city.name} ➔ ${f.arrival.city.name} (${f.departureDate})</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="padding: 1.5rem;" id="manifest-table-wrapper"></div>
        </div>
      `;

      const flightSelect = contentEl.querySelector('#manifest-flight-select');
      const tableWrapper = contentEl.querySelector('#manifest-table-wrapper');
      const bannerTitle = contentEl.querySelector('#manifest-banner-title');

      function updateManifest() {
        const flightId = Number(flightSelect.value);
        const flight = sys.flightService.getFlight(flightId);
        bannerTitle.textContent = `Manifiesto de Vuelo ${flight.flightName} (${flight.airline.name})`;

        const passengers = sys.reservationService.getFlightManifest(flightId);

        if (passengers.length === 0) {
          tableWrapper.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-dim);">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎟</div>
              <h3>Este vuelo no cuenta con pasajeros registrados</h3>
              <p style="font-size: 0.85rem;">Todas las sillas se encuentran actualmente disponibles.</p>
            </div>
          `;
          return;
        }

        tableWrapper.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-muted);">
            <span><strong>Ruta:</strong> ${flight.departure.name} ➔ ${flight.arrival.name}</span>
            <span><strong>Salida:</strong> ${flight.departureDate} ${flight.departureTime}</span>
            <span><strong>Ocupación:</strong> ${passengers.length} pasajero(s) a bordo</span>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 120px;">Silla Asignada</th>
                  <th>Nombre Completo del Pasajero</th>
                  <th>Documento Pasajero</th>
                  <th>Cliente Titular</th>
                  <th># Reserva</th>
                </tr>
              </thead>
              <tbody>
                ${passengers.map((p) => `
                  <tr>
                    <td><span class="badge badge-accent" style="font-size: 0.95rem; font-weight: 800;">${p.seatCode}</span></td>
                    <td><strong>${p.passengerFullName}</strong></td>
                    <td>${p.passengerDocument}</td>
                    <td>${p.customerName}</td>
                    <td><span class="badge badge-info">#${p.reservationId}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      flightSelect.onchange = updateManifest;
      updateManifest();
    }

    renderView();
  }
}
