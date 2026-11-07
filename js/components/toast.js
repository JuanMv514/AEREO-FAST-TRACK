/**
 * AeroFastTrack - Componente Toast Notification
 */

class ToastService {
  constructor() {
    this._container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    if (!this._container) {
      let el = document.getElementById('toast-container');
      if (!el) {
        el = document.createElement('div');
        el.id = 'toast-container';
        el.className = 'toast-container';
        document.body.appendChild(el);
      }
      this._container = el;
    }
  }

  show({ type = 'info', title = '', message = '', duration = 4000 }) {
    this._ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
    `;

    this._container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 300ms, transform 300ms';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  success(title, message) {
    this.show({ type: 'success', title, message });
  }

  error(title, message) {
    this.show({ type: 'error', title, message, duration: 6000 });
  }

  warning(title, message) {
    this.show({ type: 'warning', title, message });
  }
}

export const toast = new ToastService();
