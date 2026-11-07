/**
 * AeroFastTrack - Componente SeatPicker (Mapa Interactivo de Sillas)
 */

export class SeatPicker {
  /**
   * Renderiza el mapa interactivo de asientos para una aeronave estándar (filas 1 a 12, asientos A-F).
   * @param {Object} options 
   */
  static render({
    containerEl,
    flightId,
    reservationService,
    onSeatSelect,
    selectedSeatCode = null,
    totalRows = 12,
  }) {
    const occupiedSeats = reservationService.listOccupiedSeats(flightId);
    let currentSelected = selectedSeatCode;

    const html = `
      <div class="cabin-container">
        <div class="cabin-legend">
          <div class="legend-item">
            <div class="seat-box available"></div>
            <span>Disponible</span>
          </div>
          <div class="legend-item">
            <div class="seat-box selected"></div>
            <span>Seleccionada</span>
          </div>
          <div class="legend-item">
            <div class="seat-box occupied">✕</div>
            <span>Ocupada</span>
          </div>
        </div>

        <div class="cabin-grid" id="cabin-grid">
          <!-- Filas generadas dinámicamente -->
        </div>
      </div>
    `;

    containerEl.innerHTML = html;
    const gridEl = containerEl.querySelector('#cabin-grid');

    const columnsLeft = ['A', 'B', 'C'];
    const columnsRight = ['D', 'E', 'F'];

    for (let r = 1; r <= totalRows; r++) {
      const rowStr = String(r);
      const rowDiv = document.createElement('div');
      rowDiv.className = 'cabin-row';

      // Etiqueta número de fila
      const labelLeft = document.createElement('div');
      labelLeft.className = 'row-label';
      labelLeft.textContent = rowStr;
      rowDiv.appendChild(labelLeft);

      // Asientos lado izquierdo A, B, C
      columnsLeft.forEach((col) => {
        const seatCode = `${rowStr}${col}`;
        const isOccupied = occupiedSeats.includes(seatCode);
        const isSelected = currentSelected === seatCode;

        const box = document.createElement('div');
        box.className = `seat-box ${isOccupied ? 'occupied' : isSelected ? 'selected' : 'available'}`;
        box.textContent = isOccupied ? '✕' : seatCode;
        box.dataset.row = rowStr;
        box.dataset.seat = col;
        box.dataset.code = seatCode;

        if (!isOccupied) {
          box.addEventListener('click', () => {
            gridEl.querySelectorAll('.seat-box.selected').forEach((s) => {
              s.classList.remove('selected');
              s.classList.add('available');
            });
            box.classList.remove('available');
            box.classList.add('selected');
            currentSelected = seatCode;
            if (onSeatSelect) onSeatSelect(rowStr, col, seatCode);
          });
        }
        rowDiv.appendChild(box);
      });

      // Pasillo central
      const aisle = document.createElement('div');
      aisle.className = 'cabin-aisle';
      rowDiv.appendChild(aisle);

      // Asientos lado derecho D, E, F
      columnsRight.forEach((col) => {
        const seatCode = `${rowStr}${col}`;
        const isOccupied = occupiedSeats.includes(seatCode);
        const isSelected = currentSelected === seatCode;

        const box = document.createElement('div');
        box.className = `seat-box ${isOccupied ? 'occupied' : isSelected ? 'selected' : 'available'}`;
        box.textContent = isOccupied ? '✕' : seatCode;
        box.dataset.row = rowStr;
        box.dataset.seat = col;
        box.dataset.code = seatCode;

        if (!isOccupied) {
          box.addEventListener('click', () => {
            gridEl.querySelectorAll('.seat-box.selected').forEach((s) => {
              s.classList.remove('selected');
              s.classList.add('available');
            });
            box.classList.remove('available');
            box.classList.add('selected');
            currentSelected = seatCode;
            if (onSeatSelect) onSeatSelect(rowStr, col, seatCode);
          });
        }
        rowDiv.appendChild(box);
      });

      gridEl.appendChild(rowDiv);
    }
  }
}
