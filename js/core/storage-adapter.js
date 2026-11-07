/**
 * AeroFastTrack - Adaptador de Almacenamiento Local (LocalStorageAdapter)
 * 
 * Responsabilidades:
 * - Comprobación activa de disponibilidad y cuota de LocalStorage.
 * - Versionado del esquema de datos (SCHEMA_VERSION = '1.0.0').
 * - Validación estructural profunda del JSON antes de inyectar datos.
 * - Manejo y cuarentena de datos corruptos sin sobrescritura silenciosa.
 * - Tolerancia a fallos para navegadores con almacenamiento restringido.
 */

export const STORAGE_KEY = 'aerofasttrack_storage_v1';
export const SCHEMA_VERSION = '1.0.0';
export const CORRUPT_BACKUP_PREFIX = 'aerofasttrack_corrupt_backup_';

export class LocalStorageAdapter {
  constructor(storageKey = STORAGE_KEY, schemaVersion = SCHEMA_VERSION) {
    this._key = storageKey;
    this._schemaVersion = schemaVersion;
    this._available = this._testStorageAvailability();
  }

  /**
   * Determina si localStorage está disponible y admite escritura sin restricciones.
   * @private
   * @returns {boolean}
   */
  _testStorageAvailability() {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return false;
    }
    try {
      const testKey = '__aerofasttrack_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('LocalStorage no disponible o cuota restringida:', e);
      return false;
    }
  }

  /**
   * Estado de disponibilidad del almacenamiento en el navegador actual.
   * @returns {boolean}
   */
  isAvailable() {
    return this._available;
  }

  /**
   * Verifica si existe un estado guardado previamente.
   * @returns {boolean}
   */
  hasSavedData() {
    if (!this._available) return false;
    try {
      const data = window.localStorage.getItem(this._key);
      return data !== null && data.trim().length > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Guarda el estado serializado con metadatos de versión y marca de tiempo.
   * @param {Object} stateData 
   * @returns {{ success: boolean, error?: string }}
   */
  save(stateData) {
    if (!this._available) {
      return { success: false, error: 'Almacenamiento no disponible en este navegador' };
    }

    try {
      const envelope = {
        schemaVersion: this._schemaVersion,
        timestamp: new Date().toISOString(),
        data: stateData,
      };

      const serialized = JSON.stringify(envelope);
      window.localStorage.setItem(this._key, serialized);
      return { success: true };
    } catch (err) {
      console.error('Error al persistir en LocalStorage:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Carga el estado serializado, validando versión y estructura.
   * En caso de corrupción, coloca los datos en cuarentena y reporta el error sin sobrescribir.
   * @returns {{ status: 'EMPTY' | 'OK' | 'CORRUPTED' | 'UNAVAILABLE', data?: Object, error?: string }}
   */
  load() {
    if (!this._available) {
      return { status: 'UNAVAILABLE', error: 'Almacenamiento local deshabilitado' };
    }

    let raw = null;
    try {
      raw = window.localStorage.getItem(this._key);
    } catch (err) {
      return { status: 'UNAVAILABLE', error: err.message };
    }

    if (!raw || raw.trim().length === 0) {
      return { status: 'EMPTY' };
    }

    try {
      const envelope = JSON.parse(raw);

      // Validación de envoltura y datos
      if (!envelope || typeof envelope !== 'object' || !envelope.data) {
        throw new Error('Estructura de sobre JSON inválida o carente del contenedor data');
      }

      // Validación de versión del esquema
      if (envelope.schemaVersion !== this._schemaVersion) {
        throw new Error(`Incompatibilidad de esquema: esperado ${this._schemaVersion}, recibido ${envelope.schemaVersion}`);
      }

      const d = envelope.data;

      // Validación de colecciones fundamentales requeridas
      const requiredCollections = ['countries', 'docTypes', 'customers', 'cities', 'airports', 'airlines', 'flights', 'reservations', 'generators'];
      for (const col of requiredCollections) {
        if (!d[col]) {
          throw new Error(`Estructura incompleta: falta la colección '${col}'`);
        }
      }

      return {
        status: 'OK',
        data: d,
        timestamp: envelope.timestamp,
      };
    } catch (parseError) {
      console.error('Corrupción detectada en LocalStorage:', parseError);

      // Aislar los datos corruptos en una clave de respaldo para auditoría
      this._quarantineCorruptData(raw, parseError.message);

      return {
        status: 'CORRUPTED',
        error: parseError.message,
        rawContent: raw,
      };
    }
  }

  /**
   * Respalda datos corruptos en una clave de cuarentena con marca temporal para evitar pérdida total.
   * @private
   */
  _quarantineCorruptData(rawContent, errorReason) {
    if (!this._available) return;
    try {
      const backupKey = `${CORRUPT_BACKUP_PREFIX}${Date.now()}`;
      const payload = {
        quarantinedAt: new Date().toISOString(),
        error: errorReason,
        content: rawContent,
      };
      window.localStorage.setItem(backupKey, JSON.stringify(payload));
      console.warn(`Datos dañados respaldados en cuarentena bajo la clave: ${backupKey}`);
    } catch (e) {
      console.error('No se pudo crear el respaldo de cuarentena:', e);
    }
  }

  /**
   * Elimina los datos de la clave principal para permitir restauración limpia de semillas.
   * @returns {boolean}
   */
  clear() {
    if (!this._available) return false;
    try {
      window.localStorage.removeItem(this._key);
      return true;
    } catch (e) {
      return false;
    }
  }
}
