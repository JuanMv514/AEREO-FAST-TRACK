/**
 * AeroFastTrack - Vista Módulo 2: Ubicaciones (Ciudades y Aeropuertos)
 */

import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';

export class LocationsView {
  static render(container, sys) {
    let activeTab = 'airports'; // 'airports', 'cities'

    function renderView() {
      container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Ubicaciones y Nodos Aéreos</h1>
            <p class="page-subtitle">Gestión de ciudades base y aeropuertos con asignación de terminales</p>
          </div>
          <div class="page-actions" id="loc-actions"></div>
        </div>

        <div class="tabs-header">
          <button class="tab-btn ${activeTab === 'airports' ? 'active' : ''}" data-tab="airports">
            📍 Aeropuertos (${sys.locationService.countAirports()})
          </button>
          <button class="tab-btn ${activeTab === 'cities' ? 'active' : ''}" data-tab="cities">
            🏙️ Ciudades (${sys.locationService.countCities()})
          </button>
        </div>

        <div id="loc-content"></div>
      `;

      container.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab;
          renderView();
        });
      });

      if (activeTab === 'airports') renderAirports();
      else renderCities();
    }

    // ==========================================
    // PESTAÑA: AEROPUERTOS
    // ==========================================
    function renderAirports() {
      const actionsEl = container.querySelector('#loc-actions');
      actionsEl.innerHTML = `
        <button class="btn btn-primary" id="btn-new-airport">
          + Registrar Aeropuerto
        </button>
      `;
      actionsEl.querySelector('#btn-new-airport').onclick = () => openAirportModal();

      const contentEl = container.querySelector('#loc-content');
      contentEl.innerHTML = `
        <div class="card">
          <div class="filter-bar">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" id="airp-search" class="search-input" placeholder="Buscar aeropuerto por nombre..." />
            </div>
            <select id="airp-filter-city" class="form-control" style="width: auto;">
              <option value="">Todas las Ciudades</option>
              ${sys.locationService.listCities().map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre del Aeropuerto</th>
                  <th>Ciudad</th>
                  <th>Identificador (UUID)</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody id="airp-table-body"></tbody>
            </table>
          </div>
        </div>
      `;

      const searchInput = contentEl.querySelector('#airp-search');
      const cityFilter = contentEl.querySelector('#airp-filter-city');
      const tableBody = contentEl.querySelector('#airp-table-body');

      function updateTable() {
        let list = sys.locationService.listAirports();
        const term = searchInput.value.toLowerCase().trim();
        const cityId = cityFilter.value;

        if (term) {
          list = list.filter((a) => a.name.toLowerCase().includes(term));
        }
        if (cityId) {
          list = list.filter((a) => a.city.id === Number(cityId));
        }

        if (list.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 2rem;">No se encontraron aeropuertos</td></tr>`;
          return;
        }

        tableBody.innerHTML = list.map((a) => `
          <tr>
            <td><strong>${a.name}</strong></td>
            <td><span class="badge badge-accent">${a.city.name}</span></td>
            <td><span style="font-family: monospace; font-size: 0.8rem; color: var(--text-dim);">${a.id}</span></td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm btn-edit-airp" data-id="${a.id}">Editar</button>
              <button class="btn btn-danger btn-sm btn-delete-airp" data-id="${a.id}" style="margin-left: 0.35rem;">Eliminar</button>
            </td>
          </tr>
        `).join('');

        tableBody.querySelectorAll('.btn-edit-airp').forEach((b) => {
          b.onclick = () => openAirportModal(b.dataset.id);
        });

        tableBody.querySelectorAll('.btn-delete-airp').forEach((b) => {
          b.onclick = () => handleDeleteAirport(b.dataset.id);
        });
      }

      searchInput.oninput = updateTable;
      cityFilter.onchange = updateTable;
      updateTable();
    }

    function openAirportModal(airportId = null) {
      const isEdit = Boolean(airportId);
      const existing = isEdit ? sys.locationService.getAirport(airportId) : null;
      const cities = sys.locationService.listCities();

      if (cities.length === 0) {
        toast.warning('Requisito', 'Debe existir al menos una ciudad registrada para asociar el aeropuerto.');
        return;
      }

      const bodyHtml = `
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label required">Ciudad Base</label>
          <select id="m-airp-city" class="form-control" required>
            ${cities.map((c) => `<option value="${c.id}" ${existing && existing.city.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Nombre del Aeropuerto (Máximo 50 caracteres)</label>
          <input type="text" id="m-airp-name" class="form-control" maxlength="50" required value="${existing ? existing.name : ''}" placeholder="Ej. El Dorado" />
        </div>

        ${
          existing
            ? `<div class="form-group" style="margin-top: 1rem;">
                <label class="form-label">Identificador UUID</label>
                <input type="text" class="form-control" disabled value="${existing.id}" style="font-family: monospace; font-size: 0.8rem;" />
              </div>`
            : ''
        }
      `;

      modal.open({
        title: isEdit ? 'Editar Aeropuerto' : 'Registrar Nuevo Aeropuerto',
        bodyHtml,
        confirmText: isEdit ? 'Actualizar' : 'Registrar',
        onConfirm: () => {
          const cityId = Number(document.getElementById('m-airp-city').value);
          const name = document.getElementById('m-airp-name').value;

          try {
            if (isEdit) {
              sys.locationService.updateAirport(existing.id, { name, cityId });
              toast.success('Actualizado', `Aeropuerto '${name}' actualizado.`);
            } else {
              sys.locationService.createAirport(name, cityId);
              toast.success('Registrado', `Aeropuerto '${name}' registrado con éxito.`);
            }
            renderView();
            return true;
          } catch (err) {
            toast.error('Error al guardar aeropuerto', err.message);
            return false;
          }
        },
      });
    }

    async function handleDeleteAirport(id) {
      const a = sys.locationService.getAirport(id);
      const confirmed = await modal.confirm({
        title: '¿Eliminar Aeropuerto?',
        message: `¿Está seguro de eliminar el aeropuerto '${a.name}'? Solo será posible si no tiene vuelos de salida o llegada asignados.`,
        confirmText: 'Eliminar Aeropuerto',
      });
      if (!confirmed) return;

      try {
        sys.locationService.deleteAirport(id);
        toast.success('Eliminado', `Aeropuerto '${a.name}' eliminado con éxito.`);
        renderView();
      } catch (err) {
        toast.error('Restricción de Negocio', err.message);
      }
    }

    // ==========================================
    // PESTAÑA: CIUDADES
    // ==========================================
    function renderCities() {
      const actionsEl = container.querySelector('#loc-actions');
      actionsEl.innerHTML = `
        <button class="btn btn-primary" id="btn-new-city">
          + Registrar Ciudad
        </button>
      `;
      actionsEl.querySelector('#btn-new-city').onclick = () => openCityModal();

      const contentEl = container.querySelector('#loc-content');
      contentEl.innerHTML = `
        <div class="card" style="max-width: 850px; margin: 0 auto;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID (Autoincremental)</th>
                  <th>Nombre de Ciudad</th>
                  <th>Total Aeropuertos</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody id="city-table-body">
                ${sys.locationService.listCities().map((c) => {
                  const airpCount = sys.locationService.countAirportsByCity(c.id);
                  return `
                    <tr>
                      <td><strong>#${c.id}</strong></td>
                      <td>${c.name}</td>
                      <td><span class="badge ${airpCount > 0 ? 'badge-info' : 'badge-warning'}">${airpCount} aeropuerto(s)</span></td>
                      <td style="text-align: right;">
                        <button class="btn btn-secondary btn-sm btn-edit-city" data-id="${c.id}">Renombrar</button>
                        <button class="btn btn-danger btn-sm btn-delete-city" data-id="${c.id}" style="margin-left: 0.35rem;">Eliminar</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      contentEl.querySelectorAll('.btn-edit-city').forEach((b) => {
        b.onclick = () => openCityModal(Number(b.dataset.id));
      });
      contentEl.querySelectorAll('.btn-delete-city').forEach((b) => {
        b.onclick = () => handleDeleteCity(Number(b.dataset.id));
      });
    }

    function openCityModal(cityId = null) {
      const isEdit = cityId !== null;
      const existing = isEdit ? sys.locationService.getCity(cityId) : null;

      const bodyHtml = `
        <div class="form-group">
          <label class="form-label required">Nombre de la Ciudad (Máximo 20 caracteres)</label>
          <input type="text" id="m-city-name" class="form-control" maxlength="20" required value="${existing ? existing.name : ''}" placeholder="Ej. Bucaramanga" />
          <span class="form-helper">El sistema valida unicidad normalizada y genera el ID automáticamente (1 en 1).</span>
        </div>
      `;

      modal.open({
        title: isEdit ? 'Renombrar Ciudad' : 'Registrar Nueva Ciudad',
        bodyHtml,
        confirmText: isEdit ? 'Actualizar' : 'Guardar',
        onConfirm: () => {
          const name = document.getElementById('m-city-name').value;
          try {
            if (isEdit) {
              sys.locationService.updateCity(existing.id, name);
              toast.success('Actualizada', `Ciudad '${name}' renombrada.`);
            } else {
              const created = sys.locationService.createCity(name);
              toast.success('Registrada', `Ciudad '${name}' registrada con ID #${created.id}.`);
            }
            renderView();
            return true;
          } catch (err) {
            toast.error('Error al guardar ciudad', err.message);
            return false;
          }
        },
      });
    }

    async function handleDeleteCity(id) {
      const c = sys.locationService.getCity(id);
      const confirmed = await modal.confirm({
        title: '¿Eliminar Ciudad?',
        message: `¿Desea eliminar la ciudad '${c.name}'? Solo será permitido si no cuenta con ningún aeropuerto asignado.`,
        confirmText: 'Eliminar Ciudad',
      });
      if (!confirmed) return;

      try {
        sys.locationService.deleteCity(id);
        toast.success('Eliminada', `Ciudad '${c.name}' eliminada correctamente.`);
        renderView();
      } catch (err) {
        toast.error('Integridad Referencial', err.message);
      }
    }

    renderView();
  }
}
