/**
 * AeroFastTrack - Jerarquía de Excepciones del Dominio
 * Refleja exactamente la especificación del Kit Base de la guía técnica en Java.
 */

export class SystemException extends Error {
  constructor(message) {
    super(message);
    this.name = 'SystemException';
  }
}

export class ValidationException extends SystemException {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationException';
    this.field = field;
  }
}

export class DuplicateException extends SystemException {
  constructor(message, entity = null) {
    super(message);
    this.name = 'DuplicateException';
    this.entity = entity;
  }
}

export class NotFoundException extends SystemException {
  constructor(message, entity = null) {
    super(message);
    this.name = 'NotFoundException';
    this.entity = entity;
  }
}

export class BusinessRuleException extends SystemException {
  constructor(message, rule = null) {
    super(message);
    this.name = 'BusinessRuleException';
    this.rule = rule;
  }
}
