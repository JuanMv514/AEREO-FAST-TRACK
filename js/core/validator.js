/**
 * AeroFastTrack - Utilidades de Validación
 * Refleja las especificaciones del Validator en Java:
 * - Texto obligatorio
 * - Longitud máxima
 * - Valor positivo
 * - Rango
 * - Objeto no nulo
 * - Normalización de texto (eliminar espacios redundantes)
 */

import { ValidationException } from './exceptions.js';

export class Validator {
  /**
   * Normaliza una cadena: recorta extremos y colapsa múltiples espacios internos a uno solo.
   * @param {string} text 
   * @returns {string}
   */
  static normalizeText(text) {
    if (text === null || text === undefined) return '';
    return String(text).trim().replace(/\s+/g, ' ');
  }

  /**
   * Valida que un objeto o referencia no sea nula/indefinida.
   */
  static requireNonNull(value, fieldName) {
    if (value === null || value === undefined) {
      throw new ValidationException(`El campo '${fieldName}' no puede ser nulo`, fieldName);
    }
    return value;
  }

  /**
   * Valida texto obligatorio no vacío (tras normalizar).
   */
  static requireText(text, fieldName, maxLength = null) {
    const normalized = this.normalizeText(text);
    if (!normalized || normalized.length === 0) {
      throw new ValidationException(`El campo '${fieldName}' es obligatorio y no puede estar vacío`, fieldName);
    }
    if (maxLength !== null && normalized.length > maxLength) {
      throw new ValidationException(`El campo '${fieldName}' supera la longitud máxima permitida de ${maxLength} caracteres (actual: ${normalized.length})`, fieldName);
    }
    return normalized;
  }

  /**
   * Valida texto opcional, pero si viene, respeta longitud máxima y formato.
   */
  static optionalText(text, fieldName, maxLength = null) {
    if (text === null || text === undefined) return null;
    const normalized = this.normalizeText(text);
    if (normalized.length === 0) return null;
    if (maxLength !== null && normalized.length > maxLength) {
      throw new ValidationException(`El campo '${fieldName}' supera la longitud máxima permitida de ${maxLength} caracteres`, fieldName);
    }
    return normalized;
  }

  /**
   * Valida valor numérico positivo (> 0).
   */
  static requirePositive(number, fieldName) {
    const num = Number(number);
    if (isNaN(num) || num <= 0) {
      throw new ValidationException(`El campo '${fieldName}' debe ser un valor numérico positivo mayor a cero`, fieldName);
    }
    return num;
  }

  /**
   * Valida valor numérico dentro de un rango inclusivo.
   */
  static requireRange(number, min, max, fieldName) {
    const num = Number(number);
    if (isNaN(num) || num < min || num > max) {
      throw new ValidationException(`El campo '${fieldName}' debe estar entre ${min} y ${max}`, fieldName);
    }
    return num;
  }

  /**
   * Valida formato básico de correo electrónico.
   */
  static requireEmail(email, fieldName = 'correo') {
    if (!email) return null;
    const normalized = this.normalizeText(email).toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new ValidationException(`El campo '${fieldName}' no tiene un formato de correo electrónico válido`, fieldName);
    }
    if (normalized.length > 80) {
      throw new ValidationException(`El campo '${fieldName}' supera el máximo de 80 caracteres`, fieldName);
    }
    return normalized;
  }

  /**
   * Valida teléfono: solo dígitos y opcionalmente un '+' al inicio, máx 15.
   */
  static requirePhone(phone, fieldName = 'teléfono') {
    const normalized = this.normalizeText(phone);
    if (!normalized) {
      throw new ValidationException(`El campo '${fieldName}' es obligatorio`, fieldName);
    }
    const phoneRegex = /^\+?[0-9]{5,15}$/;
    if (!phoneRegex.test(normalized)) {
      throw new ValidationException(`El campo '${fieldName}' debe contener únicamente dígitos (entre 5 y 15), opcionalmente iniciando con '+'`, fieldName);
    }
    return normalized;
  }

  /**
   * Genera un identificador UUID v4 estándar.
   */
  static generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
