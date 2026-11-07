/**
 * AeroFastTrack - Generador de Identificadores (IdGenerator)
 * Refleja el IdGenerator en Java:
 * - Inicio configurable
 * - Paso configurable (mayor que 0)
 * - Sincronización con IDs ya cargados
 */

import { ValidationException } from './exceptions.js';

export class IdGenerator {
  /**
   * @param {number} start Valor de arranque
   * @param {number} step Paso de incremento (debe ser > 0)
   */
  constructor(start = 1, step = 1) {
    if (step <= 0) {
      throw new ValidationException('El paso del generador debe ser mayor a 0', 'step');
    }
    this._start = start;
    this._step = step;
    this._current = start;
  }

  /**
   * Obtiene el siguiente ID disponible y avanza el contador.
   * @returns {number}
   */
  nextId() {
    const id = this._current;
    this._current += this._step;
    return id;
  }

  /**
   * Inspecciona el valor actual sin avanzar.
   * @returns {number}
   */
  peek() {
    return this._current;
  }

  /**
   * Sincroniza el generador con un ID ya existente para asegurar
   * que el próximo ID generado sea superior y respete el paso.
   * @param {number} existingId 
   */
  sync(existingId) {
    const idNum = Number(existingId);
    if (!isNaN(idNum) && idNum >= this._current) {
      this._current = idNum + this._step;
    }
  }

  /**
   * Reinicia el generador a su valor de arranque.
   */
  reset() {
    this._current = this._start;
  }
}
