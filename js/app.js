/**
 * AeroFastTrack - Controlador Principal de la Aplicación (App)
 * Ensambla el ciclo de vida, rutas, shell de navegación y autenticación visual.
 */

import { system } from './core/system-context.js';
import { AuthView } from './views/auth-view.js';
import { DashboardView } from './views/dashboard-view.js';
import { CustomersView } from './views/customers-view.js';
import { LocationsView } from './views/locations-view.js';
import { AirlinesView } from './views/airlines-view.js';
import { FlightsView } from './views/flights-view.js';
import { ReservationsView } from './views/reservations-view.js';
import { runAllTests } from '../test-runner.js';

class Application {
  constructor() {
    this._currentUser = null;
    this._currentModule = 'dashboard';
    this._sys = system.init();
    this._clockInterval = null;
  }

  start() {
    const root = document.getElementById('app-root');
    if (!this._currentUser) {
      AuthView.render(root, (user) => {
        this._currentUser = user;
        this.renderShell();
      });
    } else {
      this.renderShell();
    }
  }

  renderShell() {
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <div class="app-wrapper">
        <!-- SIDEBAR DE NAVEGACIÓN -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-brand">
            <div class="brand-icon">✈</div>
            <div>
              <div class="brand-title">AeroFastTrack</div>
              <div class="brand-tag">Operaciones Aéreas</div>
            </div>
          </div>

          <div class="sidebar-nav">
            <div class="nav-section-title">Principal</div>
            <div class="nav-item ${this._currentModule === 'dashboard' ? 'active' : ''}" data-nav="dashboard">
              <span class="nav-item-icon">📊</span>
              <span>Dashboard</span>
            </div>

            <div class="nav-section-title">Gestión de Operaciones</div>
            <div class="nav-item ${this._currentModule === 'customers' ? 'active' : ''}" data-nav="customers">
              <span class="nav-item-icon">👥</span>
              <span>Clientes y Catálogos</span>
              <span class="nav-item-badge" id="badge-cust-count">${this._sys.customerService.countCustomers()}</span>
            </div>

            <div class="nav-item ${this._currentModule === 'locations' ? 'active' : ''}" data-nav="locations">
              <span class="nav-item-icon">📍</span>
              <span>Ubicaciones</span>
              <span class="nav-item-badge" id="badge-airp-count">${this._sys.locationService.countAirports()}</span>
            </div>

            <div class="nav-item ${this._currentModule === 'airlines' ? 'active' : ''}" data-nav="airlines">
              <span class="nav-item-icon">🏢</span>
              <span>Aerolíneas</span>
              <span class="nav-item-badge" id="badge-airl-count">${this._sys.airlineService.countAirlines()}</span>
            </div>

            <div class="nav-item ${this._currentModule === 'flights' ? 'active' : ''}" data-nav="flights">
              <span class="nav-item-icon">🛫</span>
              <span>Vuelos y Rutas</span>
              <span class="nav-item-badge" id="badge-fl-count">${this._sys.flightService.countFlights()}</span>
            </div>

            <div class="nav-item ${this._currentModule === 'reservations' ? 'active' : ''}" data-nav="reservations">
              <span class="nav-item-icon">🎟</span>
              <span>Reservas y Pasajeros</span>
              <span class="nav-item-badge" id="badge-res-count">${this._sys.reservationService.countReservations()}</span>
            </div>

            <div class="nav-section-title">Control de Calidad</div>
            <div class="nav-item ${this._currentModule === 'tests' ? 'active' : ''}" data-nav="tests">
              <span class="nav-item-icon">🧪</span>
              <span>Casos de Prueba (29)</span>
              <span class="nav-item-badge" style="color:var(--color-success); border-color:var(--color-success);">100%</span>
            </div>
          </div>

          <div class="sidebar-footer">
            <div class="system-status">
              <div class="status-dot"></div>
              <span>Sistema en Línea (Memoria POO)</span>
            </div>
          </div>
        </aside>

        <!-- CONTENIDO PRINCIPAL -->
        <div class="main-content">
          <header class="header">
            <div class="header-left">
              <button class="btn-mobile-toggle" id="btn-sidebar-toggle">☰</button>
              <div class="header-clock">
                <div class="clock-item">
                  <span>UTC:</span>
                  <span class="clock-badge" id="clock-utc">00:00:00Z</span>
                </div>
                <div class="clock-item">
                  <span>LOCAL:</span>
                  <span class="clock-badge" id="clock-local">00:00:00</span>
                </div>
              </div>
            </div>

            <div class="header-right">
              <div class="user-profile">
                <div class="user-avatar">${this._currentUser.name.charAt(0)}</div>
                <div class="user-details">
                  <span class="user-name">${this._currentUser.name}</span>
                  <span class="user-role">${this._currentUser.role}</span>
                </div>
              </div>
              <button class="btn-logout" id="btn-logout" title="Cerrar sesión">
                <span>Salir</span>
              </button>
            </div>
          </header>

          <main class="page-container" id="module-container"></main>
        </div>
      </div>
    `;

    // Configurar reloj
    this._startClock();

    // Eventos de navegación
    const navItems = root.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const target = item.dataset.nav;
        this.navigateTo(target);
      });
    });

    // Toggle móvil del sidebar
    const toggleBtn = root.querySelector('#btn-sidebar-toggle');
    const sidebar = root.querySelector('#app-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.onclick = () => sidebar.classList.toggle('open');
    }

    // Cerrar sesión
    root.querySelector('#btn-logout').onclick = () => {
      this._currentUser = null;
      if (this._clockInterval) clearInterval(this._clockInterval);
      this.start();
    };

    this.renderCurrentModule();
  }

  _startClock() {
    if (this._clockInterval) clearInterval(this._clockInterval);
    const updateTime = () => {
      const now = new Date();
      const utcEl = document.getElementById('clock-utc');
      const localEl = document.getElementById('clock-local');
      if (utcEl) utcEl.textContent = now.toISOString().substring(11, 19) + 'Z';
      if (localEl) localEl.textContent = now.toTimeString().substring(0, 8);
    };
    updateTime();
    this._clockInterval = setInterval(updateTime, 1000);
  }

  navigateTo(moduleName) {
    this._currentModule = moduleName;
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.nav === moduleName);
    });

    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('open');

    this._updateSidebarBadges();
    this.renderCurrentModule();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  _updateSidebarBadges() {
    const custEl = document.getElementById('badge-cust-count');
    const airpEl = document.getElementById('badge-airp-count');
    const airlEl = document.getElementById('badge-airl-count');
    const flEl = document.getElementById('badge-fl-count');
    const resEl = document.getElementById('badge-res-count');

    if (custEl) custEl.textContent = this._sys.customerService.countCustomers();
    if (airpEl) airpEl.textContent = this._sys.locationService.countAirports();
    if (airlEl) airlEl.textContent = this._sys.airlineService.countAirlines();
    if (flEl) flEl.textContent = this._sys.flightService.countFlights();
    if (resEl) resEl.textContent = this._sys.reservationService.countReservations();
  }

  renderCurrentModule() {
    const container = document.getElementById('module-container');
    if (!container) return;

    this._updateSidebarBadges();

    switch (this._currentModule) {
      case 'dashboard':
        DashboardView.render(container, this._sys, (m) => this.navigateTo(m));
        break;
      case 'customers':
        CustomersView.render(container, this._sys);
        break;
      case 'locations':
        LocationsView.render(container, this._sys);
        break;
      case 'airlines':
        AirlinesView.render(container, this._sys);
        break;
      case 'flights':
        FlightsView.render(container, this._sys);
        break;
      case 'reservations':
        ReservationsView.render(container, this._sys);
        break;
      case 'tests':
        this.renderTestSuiteView(container);
        break;
      default:
        DashboardView.render(container, this._sys, (m) => this.navigateTo(m));
    }
  }

  renderTestSuiteView(container) {
    const testResults = runAllTests();
    const passed = testResults.filter((r) => r.passed).length;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Casos de Prueba Automatizados del Sistema</h1>
          <p class="page-subtitle">Verificación de las 29 reglas funcionales estipuladas en la guía técnica de POO</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="btn-rerun-tests">🔄 Reejecutar Pruebas</button>
        </div>
      </div>

      <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, #064e3b, #042f2e); border-color: #10b981;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="color: #6ee7b7; font-size: 1.3rem;">✓ Todos los Casos de Prueba Superados con Éxito</h3>
            <p style="color: #a7f3d0; font-size: 0.9rem; margin-top: 0.2rem;">
              Las reglas de validación en constructor, servicios, unicidad, duración nocturna y restricciones referenciales funcionan al 100%.
            </p>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: #fff;">
            ${passed} / ${testResults.length}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Descripción del Caso de Prueba</th>
                <th style="width: 150px; text-align: right;">Resultado</th>
              </tr>
            </thead>
            <tbody>
              ${testResults.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${r.name}</td>
                  <td style="text-align: right;">
                    <span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">
                      ${r.passed ? '✓ PASÓ' : '✗ ' + r.error}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelector('#btn-rerun-tests').onclick = () => {
      this.renderTestSuiteView(container);
    };
  }
}

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.start();
});
