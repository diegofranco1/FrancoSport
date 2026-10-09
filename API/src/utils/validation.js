import { resolveMx } from 'node:dns/promises';

const fullNamePattern = /^[\p{L}][\p{L}\p{M}'’-]*(?:\s+[\p{L}][\p{L}\p{M}'’-]*)+$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export function normalizeAndValidateName(value) {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (name.length > 100 || !fullNamePattern.test(name)) {
    throw new ValidationError('Ingresa tu nombre y apellido usando letras válidas.');
  }
  return name;
}

export function normalizeAndValidateEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (email.length > 254 || !emailPattern.test(email)) {
    throw new ValidationError('Ingresa un correo electrónico válido.');
  }
  return email;
}

export async function validateEmailDomain(email) {
  const domain = email.slice(email.lastIndexOf('@') + 1);
  try {
    const records = await resolveMx(domain);
    if (records.length === 0) {
      throw new ValidationError('El dominio del correo no puede recibir mensajes.');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    if (['ENODATA', 'ENOTFOUND', 'EAI_AGAIN'].includes(error.code)) {
      throw new ValidationError('No pudimos validar el dominio del correo. Revisa la dirección e intenta nuevamente.');
    }
    throw error;
  }
}

export function validatePassword(password) {
  if (
    typeof password !== 'string'
    || password.length < 12
    || password.length > 128
    || !/[a-z]/.test(password)
    || !/[A-Z]/.test(password)
    || !/[0-9]/.test(password)
    || !/[^A-Za-z0-9\s]/.test(password)
  ) {
    throw new ValidationError('La contraseña debe tener entre 12 y 128 caracteres e incluir mayúscula, minúscula, número y símbolo.');
  }
}
