/**
 * AeroFastTrack - Componente Modal Dialog
 */

class ModalService {
  constructor() {
    this._backdrop = null;
    this._dialog = null;
    this._titleEl = null;
    this._bodyEl = null;
    this._footerEl = null;
    this._onConfirm = null;
    this._setupDOM();
  }

  _setupDOM() {
    let backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'modal-backdrop';
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Título Modal</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body" id="modal-body"></div>
          <div class="modal-footer" id="modal-footer"></div>
        </div>
      `;
      document.body.appendChild(backdrop);
    }

    this._backdrop = backdrop;
    this._titleEl = backdrop.querySelector('#modal-title');
    this._bodyEl = backdrop.querySelector('#modal-body');
    this._footerEl = backdrop.querySelector('#modal-footer');

    backdrop.querySelector('#modal-close-btn').addEventListener('click', () => this.close());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });
  }

  open({ title, bodyHtml, onConfirm = null, confirmText = 'Guardar', confirmClass = 'btn-primary', cancelText = 'Cancelar' }) {
    this._titleEl.textContent = title;
    this._bodyEl.innerHTML = bodyHtml;
    this._onConfirm = onConfirm;

    this._footerEl.innerHTML = '';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = cancelText;
    cancelBtn.addEventListener('click', () => this.close());
    this._footerEl.appendChild(cancelBtn);

    if (onConfirm) {
      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = `btn ${confirmClass}`;
      confirmBtn.textContent = confirmText;
      confirmBtn.addEventListener('click', async () => {
        try {
          const shouldClose = await this._onConfirm(this._bodyEl);
          if (shouldClose !== false) {
            this.close();
          }
        } catch (err) {
          // Si el callback lanza error, se maneja arriba
        }
      });
      this._footerEl.appendChild(confirmBtn);
    }

    this._backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (this._backdrop) {
      this._backdrop.classList.remove('open');
      document.body.style.overflow = '';
      this._onConfirm = null;
    }
  }

  confirm({ title = '¿Confirmar acción?', message = '¿Está seguro de continuar?', confirmText = 'Confirmar', isDanger = true }) {
    return new Promise((resolve) => {
      this.open({
        title,
        bodyHtml: `<p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.5;">${message}</p>`,
        confirmText,
        confirmClass: isDanger ? 'btn-danger' : 'btn-primary',
        cancelText: 'Cancelar',
        onConfirm: () => {
          resolve(true);
          return true;
        },
      });

      // Si cancela
      const cancelBtn = this._footerEl.querySelector('.btn-secondary');
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          this.close();
          resolve(false);
        };
      }
    });
  }
}

export const modal = new ModalService();
