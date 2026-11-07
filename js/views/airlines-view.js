/**
 * AeroFastTrack - Vista Módulo 3: Aerolíneas
 */

import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class AirlinesView {
  static render(container, sys) {
    function renderView() {
      container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Flota de Aerolíneas</h1>
            <p class="page-subtitle">Registro y operación de empresas de transporte aéreo (código de 10 en 10)</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" id="btn-new-airline">
              + Registrar Aerolínea
            </button>
          </div>
        </div>

        <div class="card" style="max-width: 900px; margin: 0 auto;">
          <div class="filter-bar">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" id="airline-search" class="search-input" placeholder="Buscar aerolínea por nombre..." />
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código ID (100, 110...)</th>
                  <th>Nombre Comercial</th>
                  <th>Vuelos Asignados</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody id="airline-table-body"></tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelector('#btn-new-airline').onclick = () => openAirlineModal();

      const searchInput = container.querySelector('#airline-search');
      const tableBody = container.querySelector('#airline-table-body');

      function updateTable() {
        let list = sys.airlineService.listAirlines();
        const term = searchInput.value.toLowerCase().trim();

        if (term) {
          list = list.filter((a) => a.name.toLowerCase().includes(term));
        }

        if (list.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 2rem;">No se encontraron aerolíneas</td></tr>`;
          return;
        }

        tableBody.innerHTML = list.map((a) => {
          const flightsCount = sys.flightService.countFlightsByAirline(a.id);
          return `
            <tr>
              <td><span class="badge badge-accent">Cod: ${a.id}</span></td>
              <td><strong>${a.name}</strong></td>
              <td><span class="badge ${flightsCount > 0 ? 'badge-info' : 'badge-warning'}">${flightsCount} vuelo(s)</span></td>
              <td style="text-align: right;">
                <button class="btn btn-secondary btn-sm btn-edit-airline" data-id="${a.id}">Renombrar</button>
                <button class="btn btn-danger btn-sm btn-delete-airline" data-id="${a.id}" style="margin-left: 0.35rem;">Eliminar</button>
              </td>
            </tr>
          `;
        }).join('');

        tableBody.querySelectorAll('.btn-edit-airline').forEach((b) => {
          b.onclick = () => openAirlineModal(Number(b.dataset.id));
        });

        tableBody.querySelectorAll('.btn-delete-airline').forEach((b) => {
          b.onclick = () => handleDeleteAirline(Number(b.dataset.id));
        });
      }

      searchInput.oninput = updateTable;
      updateTable();
    }

    function openAirlineModal(airlineId = null) {
      const isEdit = airlineId !== null;
      const existing = isEdit ? sys.airlineService.getAirline(airlineId) : null;

      const bodyHtml = `
        <div class="form-group">
          <label class="form-label required">Nombre de la Aerolínea (Máximo 50 caracteres)</label>
          <input type="text" id="m-airline-name" class="form-control" maxlength="50" required value="${existing ? existing.name : ''}" placeholder="Ej. Copa Airlines" />
          <span class="form-helper">El identificador numérico se genera con paso 10 a partir de 100 automáticamente.</span>
        </div>
      `;

      modal.open({
        title: isEdit ? 'Renombrar Aerolínea' : 'Registrar Nueva Aerolínea',
        bodyHtml,
        confirmText: isEdit ? 'Actualizar' : 'Registrar',
        onConfirm: () => {
          const name = document.getElementById('m-airline-name').value;
          try {
            if (isEdit) {
              sys.airlineService.renameAirline(existing.id, name);
              toast.success('Actualizado', `Aerolínea renombrada a '${name}'.`);
            } else {
              const created = sys.airlineService.createAirline(name);
              toast.success('Registrada', `Aerolínea '${name}' registrada con ID #${created.id}.`);
            }
            renderView();
            return true;
          } catch (err) {
            toast.error('Error al guardar aerolínea', err.message);
            return false;
          }
        },
      });
    }

    async function handleDeleteAirline(id) {
      const a = sys.airlineService.getAirline(id);
      const confirmed = await modal.confirm({
        title: '¿Eliminar Aerolínea?',
        message: `¿Desea eliminar la aerolínea '${a.name}'? Solo será permitido si no tiene vuelos programados asociados.`,
        confirmText: 'Eliminar Aerolínea',
      });
      if (!confirmed) return;

      try {
        sys.airlineService.deleteAirline(id);
        toast.success('Eliminada', `Aerolínea '${a.name}' eliminada correctamente.`);
        renderView();
      } catch (err) {
        toast.error('Integridad Referencial', err.message);
      }
    }

    renderView();
  }
}
