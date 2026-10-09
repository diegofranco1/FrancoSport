import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { sql } from '../db/database.js';
import { asyncHandler } from '../utils/async-handler.js';

export const AUTH_COOKIE_NAME = 'segurida';

export function authenticateUser(req, res, next) {
  const token = req.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Tu sesión venció. Inicia sesión nuevamente.' });
  }
}

export const requireAdmin = asyncHandler(async (req, res, next) => {
  const users = await sql('SELECT isAdmin FROM users WHERE id=$1', [req.user.id]);

  if (users.length === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }
  if (!users[0].isAdmin) {
    return res.status(403).json({ message: 'Tu cuenta no tiene permisos de administración.' });
  }

  next();
});
