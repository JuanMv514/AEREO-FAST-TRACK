/**
 * AeroFastTrack - Vista Módulo 1: Clientes y Catálogos de Identificación
 */

import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { Customer } from '../models/customer.js';
import { Country } from '../models/country.js';
import { DocumentType } from '../models/document-type.js';

export class CustomersView {
  static render(container, sys) {
    let activeTab = 'customers'; // 'customers', 'docTypes', 'countries'

    function renderView() {
      container.innerHTML = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Clientes y Catálogos de Identificación</h1>
            <p class="page-subtitle">Administración de usuarios viajeros, documentos de identidad y países</p>
          </div>
          <div class="page-actions" id="tab-actions"></div>
        </div>

        <div class="tabs-header">
          <button class="tab-btn ${activeTab === 'customers' ? 'active' : ''}" data-tab="customers">
            👥 Clientes (${sys.customerService.countCustomers()})
          </button>
          <button class="tab-btn ${activeTab === 'docTypes' ? 'active' : ''}" data-tab="docTypes">
            🪪 Tipos de Documento (${sys.docTypeRepo.count()})
          </button>
          <button class="tab-btn ${activeTab === 'countries' ? 'active' : ''}" data-tab="countries">
            🌎 Países (${sys.countryRepo.count()})
          </button>
        </div>

        <div id="tab-content"></div>
      `;

      // Eventos de pestañas
      container.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab;
          renderView();
        });
      });

      if (activeTab === 'customers') renderCustomersTab();
      else if (activeTab === 'docTypes') renderDocTypesTab();
      else if (activeTab === 'countries') renderCountriesTab();
    }

    // ==========================================
    // PESTAÑA: CLIENTES
    // ==========================================
    function renderCustomersTab() {
      const actionsEl = container.querySelector('#tab-actions');
      actionsEl.innerHTML = `
        <button class="btn btn-primary" id="btn-new-customer">
          + Registrar Cliente
        </button>
      `;
      actionsEl.querySelector('#btn-new-customer').onclick = () => openCustomerModal();

      const contentEl = container.querySelector('#tab-content');
      contentEl.innerHTML = `
        <div class="card">
          <div class="filter-bar">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" id="cust-search" class="search-input" placeholder="Buscar por apellido, nombre o documento..." />
            </div>
            <select id="cust-filter-country" class="form-control" style="width: auto;">
              <option value="">Todos los Países</option>
              ${sys.customerService.listCountries().map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
            <select id="cust-filter-doctype" class="form-control" style="width: auto;">
              <option value="">Todos los Tipos Doc</option>
              ${sys.customerService.listDocumentTypes().map((d) => `<option value="${d.id}">${d.id} - ${d.description}</option>`).join('')}
            </select>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Tipo</th>
                  <th>Nombre Completo</th>
                  <th>Teléfono</th>
                  <th>Correo Electrónico</th>
                  <th>País</th>
                  <th>Dirección</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody id="cust-table-body"></tbody>
            </table>
          </div>
        </div>
      `;

      const searchInput = contentEl.querySelector('#cust-search');
      const countryFilter = contentEl.querySelector('#cust-filter-country');
      const docTypeFilter = contentEl.querySelector('#cust-filter-doctype');
      const tableBody = contentEl.querySelector('#cust-table-body');

      function updateTable() {
        let list = sys.customerService.listCustomers();
        const term = searchInput.value.toLowerCase().trim();
        const countryId = countryFilter.value;
        const docType = docTypeFilter.value;

        if (term) {
          list = list.filter((c) =>
            c.lastName.toLowerCase().includes(term) ||
            c.firstName.toLowerCase().includes(term) ||
            c.id.toLowerCase().includes(term)
          );
        }

        if (countryId) {
          list = list.filter((c) => c.country.id === Number(countryId));
        }

        if (docType) {
          list = list.filter((c) => c.documentType.id === docType);
        }

        if (list.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 2rem;">No se encontraron clientes</td></tr>`;
          return;
        }

        tableBody.innerHTML = list.map((c) => `
          <tr>
            <td><strong>${c.id}</strong></td>
            <td><span class="badge badge-accent">${c.documentType.id}</span></td>
            <td>${c.fullName}</td>
            <td>${c.telephoneNumber}</td>
            <td>${c.email || '<span style="color:var(--text-dim);">No registrado</span>'}</td>
            <td>${c.country.name}</td>
            <td>${c.address || '<span style="color:var(--text-dim);">-</span>'}</td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm btn-edit-cust" data-id="${c.id}">Editar</button>
              <button class="btn btn-danger btn-sm btn-delete-cust" data-id="${c.id}" style="margin-left: 0.35rem;">Eliminar</button>
            </td>
          </tr>
        `).join('');

        tableBody.querySelectorAll('.btn-edit-cust').forEach((b) => {
          b.onclick = () => openCustomerModal(b.dataset.id);
        });

        tableBody.querySelectorAll('.btn-delete-cust').forEach((b) => {
          b.onclick = () => handleDeleteCustomer(b.dataset.id);
        });
      }

      searchInput.oninput = updateTable;
      countryFilter.onchange = updateTable;
      docTypeFilter.onchange = updateTable;
      updateTable();
    }

    function openCustomerModal(customerId = null) {
      const isEdit = Boolean(customerId);
      const existing = isEdit ? sys.customerService.getCustomer(customerId) : null;
      const countries = sys.customerService.listCountries();
      const docTypes = sys.customerService.listDocumentTypes();

      if (countries.length === 0 || docTypes.length === 0) {
        toast.warning('Requisito', 'Debe existir al menos un país y un tipo de documento registrado antes de crear clientes.');
        return;
      }

      const bodyHtml = `
        <form id="form-cust" class="form-grid">
          <div class="form-group">
            <label class="form-label required">Tipo de Documento</label>
            <select id="m-cust-doctype" class="form-control" required>
              ${docTypes.map((dt) => `<option value="${dt.id}" ${existing && existing.documentType.id === dt.id ? 'selected' : ''}>${dt.id} - ${dt.description}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Documento de Identidad</label>
            <input type="text" id="m-cust-id" class="form-control" maxlength="20" ${isEdit ? 'disabled' : 'required'} value="${existing ? existing.id : ''}" placeholder="Ej. 1020304050" />
            ${isEdit ? '<span class="form-helper">El identificador de identidad no puede modificarse</span>' : ''}
          </div>

          <div class="form-group">
            <label class="form-label required">Nombre(s)</label>
            <input type="text" id="m-cust-firstname" class="form-control" maxlength="30" required value="${existing ? existing.firstName : ''}" placeholder="Ej. Carlos" />
          </div>

          <div class="form-group">
            <label class="form-label required">Apellido(s)</label>
            <input type="text" id="m-cust-lastname" class="form-control" maxlength="30" required value="${existing ? existing.lastName : ''}" placeholder="Ej. Gómez" />
          </div>

          <div class="form-group">
            <label class="form-label required">Teléfono de Contacto</label>
            <input type="tel" id="m-cust-phone" class="form-control" maxlength="15" required value="${existing ? existing.telephoneNumber : ''}" placeholder="Ej. +573001234567" />
          </div>

          <div class="form-group">
            <label class="form-label required">País</label>
            <select id="m-cust-country" class="form-control" required>
              ${countries.map((c) => `<option value="${c.id}" ${existing && existing.country.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Correo Electrónico (Opcional)</label>
            <input type="email" id="m-cust-email" class="form-control" maxlength="80" value="${existing && existing.email ? existing.email : ''}" placeholder="usuario@correo.com" />
          </div>

          <div class="form-group full-width">
            <label class="form-label">Dirección (Opcional)</label>
            <input type="text" id="m-cust-address" class="form-control" maxlength="40" value="${existing && existing.address ? existing.address : ''}" placeholder="Carrera 7 # 45-20" />
          </div>
        </form>
      `;

      modal.open({
        title: isEdit ? 'Editar Información de Cliente' : 'Registrar Nuevo Cliente',
        bodyHtml,
        confirmText: isEdit ? 'Actualizar Cliente' : 'Registrar Cliente',
        onConfirm: () => {
          const dtId = document.getElementById('m-cust-doctype').value;
          const firstName = document.getElementById('m-cust-firstname').value;
          const lastName = document.getElementById('m-cust-lastname').value;
          const phone = document.getElementById('m-cust-phone').value;
          const countryId = Number(document.getElementById('m-cust-country').value);
          const email = document.getElementById('m-cust-email').value || null;
          const address = document.getElementById('m-cust-address').value || null;

          const docType = sys.customerService.getDocumentType(dtId);
          const country = sys.customerService.getCountry(countryId);

          try {
            if (isEdit) {
              sys.customerService.updateCustomer(existing.id, {
                firstName,
                lastName,
                documentType: docType,
                telephoneNumber: phone,
                country,
                email,
                address,
              });
              toast.success('Cliente Actualizado', `Se guardaron los cambios para ${firstName} ${lastName}`);
            } else {
              const docId = document.getElementById('m-cust-id').value;
              const newCustomer = new Customer(docId, firstName, lastName, docType, phone, country, email, address);
              sys.customerService.createCustomer(newCustomer);
              toast.success('Cliente Registrado', `${firstName} ${lastName} fue ingresado exitosamente.`);
            }
            renderView();
            return true;
          } catch (err) {
            toast.error('Error al guardar cliente', err.message);
            return false;
          }
        },
      });
    }

    async function handleDeleteCustomer(id) {
      const cust = sys.customerService.getCustomer(id);
      const confirmed = await modal.confirm({
        title: '¿Eliminar Cliente?',
        message: `¿Está seguro de eliminar al cliente ${cust.fullName} (${cust.id})? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar Cliente',
      });

      if (!confirmed) return;

      try {
        sys.customerService.deleteCustomer(id);
        toast.success('Cliente Eliminado', `El cliente ${cust.fullName} ha sido removido.`);
        renderView();
      } catch (err) {
        toast.error('Restricción de Negocio', err.message);
      }
    }

    // ==========================================
    // PESTAÑA: TIPOS DE DOCUMENTO
    // ==========================================
    function renderDocTypesTab() {
      const actionsEl = container.querySelector('#tab-actions');
      actionsEl.innerHTML = `
        <button class="btn btn-primary" id="btn-new-doctype">
          + Nuevo Tipo de Documento
        </button>
      `;
      actionsEl.querySelector('#btn-new-doctype').onclick = () => openDocTypeModal();

      const contentEl = container.querySelector('#tab-content');
      contentEl.innerHTML = `
        <div class="card" style="max-width: 800px; margin: 0 auto;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código (2 Caracteres)</th>
                  <th>Descripción</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody id="doctype-table-body">
                ${sys.customerService.listDocumentTypes().map((dt) => `
                  <tr>
                    <td><span class="badge badge-accent">${dt.id}</span></td>
                    <td>${dt.description}</td>
                    <td style="text-align: right;">
                      <button class="btn btn-secondary btn-sm btn-edit-dt" data-id="${dt.id}">Editar</button>
                      <button class="btn btn-danger btn-sm btn-delete-dt" data-id="${dt.id}" style="margin-left: 0.35rem;">Eliminar</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      contentEl.querySelectorAll('.btn-edit-dt').forEach((b) => {
        b.onclick = () => openDocTypeModal(b.dataset.id);
      });
      contentEl.querySelectorAll('.btn-delete-dt').forEach((b) => {
        b.onclick = () => handleDeleteDocType(b.dataset.id);
      });
    }

    function openDocTypeModal(dtId = null) {
      const isEdit = Boolean(dtId);
      const existing = isEdit ? sys.customerService.getDocumentType(dtId) : null;

      const bodyHtml = `
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">Código Identificador (Exactamente 2 caracteres)</label>
          <input type="text" id="m-dt-id" class="form-control" maxlength="2" ${isEdit ? 'disabled' : 'required'} value="${existing ? existing.id : ''}" placeholder="Ej. CC, TI, PA" style="text-transform: uppercase;" />
        </div>
        <div class="form-group">
          <label class="form-label required">Descripción</label>
          <input type="text" id="m-dt-desc" class="form-control" maxlength="20" required value="${existing ? existing.description : ''}" placeholder="Ej. Cédula Ciudadanía" />
        </div>
      `;

      modal.open({
        title: isEdit ? 'Editar Tipo de Documento' : 'Crear Tipo de Documento',
        bodyHtml,
        confirmText: isEdit ? 'Actualizar' : 'Guardar',
        onConfirm: () => {
          const desc = document.getElementById('m-dt-desc').value;
          try {
            if (isEdit) {
              sys.customerService.updateDocumentType(existing.id, desc);
              toast.success('Actualizado', `Tipo de documento ${existing.id} modificado.`);
            } else {
              const code = document.getElementById('m-dt-id').value;
              const dt = new DocumentType(code, desc);
              sys.customerService.createDocumentType(dt);
              toast.success('Creado', `Tipo de documento ${dt.id} registrado.`);
            }
            renderView();
            return true;
          } catch (err) {
            toast.error('Error', err.message);
            return false;
          }
        },
      });
    }

    async function handleDeleteDocType(id) {
      const confirmed = await modal.confirm({
        title: '¿Eliminar Tipo de Documento?',
        message: `¿Desea eliminar el tipo de documento '${id}'? Solo se permitirá si no hay clientes registrados con este tipo.`,
      });
      if (!confirmed) return;
      try {
        sys.customerService.deleteDocumentType(id);
        toast.success('Eliminado', `Tipo de documento ${id} eliminado.`);
        renderView();
      } catch (err) {
        toast.error('Restricción', err.message);
      }
    }

    // ==========================================
    // PESTAÑA: PAÍSES
    // ==========================================
    function renderCountriesTab() {
      const actionsEl = container.querySelector('#tab-actions');
      actionsEl.innerHTML = `
        <button class="btn btn-primary" id="btn-new-country">
          + Registrar País
        </button>
      `;
      actionsEl.querySelector('#btn-new-country').onclick = () => openCountryModal();

      const contentEl = container.querySelector('#tab-content');
      contentEl.innerHTML = `
        <div class="card" style="max-width: 800px; margin: 0 auto;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del País</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody id="country-table-body">
                ${sys.customerService.listCountries().map((c) => `
                  <tr>
                    <td><strong>#${c.id}</strong></td>
                    <td>${c.name}</td>
                    <td style="text-align: right;">
                      <button class="btn btn-secondary btn-sm btn-edit-country" data-id="${c.id}">Editar</button>
                      <button class="btn btn-danger btn-sm btn-delete-country" data-id="${c.id}" style="margin-left: 0.35rem;">Eliminar</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      contentEl.querySelectorAll('.btn-edit-country').forEach((b) => {
        b.onclick = () => openCountryModal(Number(b.dataset.id));
      });
      contentEl.querySelectorAll('.btn-delete-country').forEach((b) => {
        b.onclick = () => handleDeleteCountry(Number(b.dataset.id));
      });
    }

    function openCountryModal(countryId = null) {
      const isEdit = countryId !== null;
      const existing = isEdit ? sys.customerService.getCountry(countryId) : null;

      const bodyHtml = `
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label required">ID Numérico de País</label>
          <input type="number" id="m-country-id" class="form-control" min="1" ${isEdit ? 'disabled' : 'required'} value="${existing ? existing.id : ''}" placeholder="Ej. 6" />
        </div>
        <div class="form-group">
          <label class="form-label required">Nombre del País (Máximo 20 caracteres)</label>
          <input type="text" id="m-country-name" class="form-control" maxlength="20" required value="${existing ? existing.name : ''}" placeholder="Ej. Argentina" />
        </div>
      `;

      modal.open({
        title: isEdit ? 'Editar País' : 'Registrar País',
        bodyHtml,
        confirmText: isEdit ? 'Actualizar' : 'Guardar',
        onConfirm: () => {
          const name = document.getElementById('m-country-name').value;
          try {
            if (isEdit) {
              sys.customerService.updateCountry(existing.id, name);
              toast.success('Actualizado', `País ${name} actualizado.`);
            } else {
              const id = Number(document.getElementById('m-country-id').value);
              const c = new Country(id, name);
              sys.customerService.createCountry(c);
              toast.success('Registrado', `País ${name} creado con ID #${id}.`);
            }
            renderView();
            return true;
          } catch (err) {
            toast.error('Error', err.message);
            return false;
          }
        },
      });
    }

    async function handleDeleteCountry(id) {
      const c = sys.customerService.getCountry(id);
      const confirmed = await modal.confirm({
        title: '¿Eliminar País?',
        message: `¿Desea eliminar el país '${c.name}'? Solo se permitirá si no hay clientes registrados asociados a este país.`,
      });
      if (!confirmed) return;
      try {
        sys.customerService.deleteCountry(id);
        toast.success('Eliminado', `País ${c.name} eliminado.`);
        renderView();
      } catch (err) {
        toast.error('Restricción', err.message);
      }
    }

    renderView();
  }
}
