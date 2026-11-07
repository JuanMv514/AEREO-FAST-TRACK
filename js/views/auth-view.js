/**
 * AeroFastTrack - Vista de Inicio de Sesión (Propuesta Visual de Interfaz)
 */

export class AuthView {
  static render(container, onLoginSuccess) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">✈</div>
            <h1 class="auth-title">AeroFastTrack</h1>
            <p class="auth-subtitle">Sistema Integral de Gestión de Operaciones Aéreas</p>
          </div>

          <form id="auth-form">
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label">Perfil de Acceso</label>
              <div class="role-selector">
                <button type="button" class="role-btn active" data-role="Agente de Operaciones">Agente</button>
                <button type="button" class="role-btn" data-role="Administrador del Sistema">Administrador</button>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label required">Correo Institucional</label>
              <input type="email" id="auth-email" class="form-control" value="operaciones@aerofasttrack.com" required placeholder="nombre@aerofasttrack.com" />
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label class="form-label required">Contraseña</label>
              <input type="password" id="auth-password" class="form-control" value="••••••••••••" required placeholder="Ingrese contraseña" />
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.85rem;">
              Acceder al Panel de Control
            </button>
          </form>

          <div class="auth-notice">
            <strong>Modo de demostración:</strong> Pantalla de acceso propuesta como especificación de interfaz hasta que se defina la autenticación en el backend.
          </div>
        </div>
      </div>
    `;

    let selectedRole = 'Agente de Operaciones';
    const roleBtns = container.querySelectorAll('.role-btn');
    roleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        roleBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRole = btn.dataset.role;
      });
    });

    const form = container.querySelector('#auth-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = container.querySelector('#auth-email').value;
      const userName = email.split('@')[0].toUpperCase();
      onLoginSuccess({
        name: userName.replace('.', ' '),
        email: email,
        role: selectedRole,
      });
    });
  }
}
