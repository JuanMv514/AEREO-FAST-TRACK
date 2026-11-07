/**
 * AeroFastTrack - Repositorio Base en Memoria (InMemoryRepository)
 * Refleja el contrato Repository y la clase abstracta InMemoryRepository en Java:
 * - Colección interna privada (Map)
 * - Protección contra exposición de referencias mutables
 * - Métodos de consulta complementarios
 */

import { DuplicateException, NotFoundException } from './exceptions.js';

export class InMemoryRepository {
  /**
   * @param {string} entityName Nombre descriptivo de la entidad para mensajes de error
   * @param {Function} idExtractor Función que extrae el id de una entidad: (item) => item.id
   */
  constructor(entityName = 'Entidad', idExtractor = (item) => item.id) {
    this._entityName = entityName;
    this._idExtractor = idExtractor;
    this._storage = new Map();
  }

  /**
   * Guarda un objeto nuevo. Lanza DuplicateException si ya existe.
   * @param {Object} entity 
   * @returns {Object} La entidad guardada
   */
  create(entity) {
    const id = this._idExtractor(entity);
    const key = String(id);
    if (this._storage.has(key)) {
      throw new DuplicateException(`Ya existe un registro de ${this._entityName} con el identificador '${id}'`, this._entityName);
    }
    this._storage.set(key, entity);
    return entity;
  }

  /**
   * Busca por ID. Devuelve el objeto o null si no existe.
   * @param {any} id 
   * @returns {Object|null}
   */
  findById(id) {
    if (id === null || id === undefined) return null;
    const key = String(id);
    const entity = this._storage.get(key);
    return entity || null;
  }

  /**
   * Devuelve una copia superficial de todos los objetos en una lista.
   * No expone la colección interna para proteger la integridad.
   * @returns {Array}
   */
  findAll() {
    return Array.from(this._storage.values());
  }

  /**
   * Actualiza un objeto existente. Lanza NotFoundException si no existe.
   * @param {Object} entity 
   * @returns {Object} La entidad actualizada
   */
  update(entity) {
    const id = this._idExtractor(entity);
    const key = String(id);
    if (!this._storage.has(key)) {
      throw new NotFoundException(`No existe un registro de ${this._entityName} con el identificador '${id}' para actualizar`, this._entityName);
    }
    this._storage.set(key, entity);
    return entity;
  }

  /**
   * Elimina un registro por ID.
   * @param {any} id 
   * @returns {boolean} true si se eliminó, false si no existía
   */
  deleteById(id) {
    if (id === null || id === undefined) return false;
    const key = String(id);
    return this._storage.delete(key);
  }

  /**
   * Verifica si existe un registro con dicho ID.
   * @param {any} id 
   * @returns {boolean}
   */
  existsById(id) {
    if (id === null || id === undefined) return false;
    return this._storage.has(String(id));
  }

  /**
   * Retorna el número total de registros almacenados.
   * @returns {number}
   */
  count() {
    return this._storage.size;
  }

  /**
   * Vacía el repositorio.
   */
  clear() {
    this._storage.clear();
  }

  /**
   * Método protegido para búsquedas y filtros complementarios.
   * @protected
   * @returns {Array} Copia de todos los valores actuales
   */
  _getAllValues() {
    return Array.from(this._storage.values());
  }
}
