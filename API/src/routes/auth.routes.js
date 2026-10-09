import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { sql } from '../db/database.js';
import { config } from '../config/env.js';
import { AUTH_COOKIE_NAME } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendVerificationEmail } from '../services/email.js';
import {
  normalizeAndValidateEmail,
  normalizeAndValidateName,
  validateEmailDomain,
  validatePassword,
  ValidationError,
} from '../utils/validation.js';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  const email = normalizeAndValidateEmail(req.body.email);
  const { password } = req.body;
  if (typeof password !== 'string' || password.length === 0 || password.length > 128) {
    throw new ValidationError('Ingresa una contraseña válida.');
  }
  const users = await sql('SELECT id, password FROM users WHERE email=$1', [email]);

  if (users.length === 0) {
    return res.status(401).json({ error: 'No encontramos una cuenta con ese correo.' });
  }

  const user = users[0];
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'La contraseña no es correcta.' });
  }

  const verification = await sql(
    'SELECT verified_at FROM email_verifications WHERE email=$1',
    [email],
  );
  if (!verification[0]?.verified_at) {
    return res.status(403).json({
      code: 'EMAIL_NOT_VERIFIED',
      error: 'Confirma tu correo con el enlace que te enviamos antes de iniciar sesión.',
    });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60;
  const token = jwt.sign({ id: user.id, exp: expiresAt }, config.jwtSecret);
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });
  res.status(200).json({ message: 'Iniciaste sesión correctamente.' });
}));

router.post('/signup', asyncHandler(async (req, res) => {
  const name = normalizeAndValidateName(req.body.name);
  const email = normalizeAndValidateEmail(req.body.email);
  const { password } = req.body;
  validatePassword(password);
  await validateEmailDomain(email);

  const existingUsers = await sql('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUsers.length > 0) {
    return res.status(400).json({ error: 'Ya existe una cuenta asociada a ese correo electrónico.' });
  }

  const hash = await bcrypt.hash(password, 12);
  await sql(
    'INSERT INTO users(name, email, password) VALUES ($1, $2, $3)',
    [name, email, hash],
  );
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await sql(
    `INSERT INTO email_verifications (email, token_hash, expires_at, verified_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour', NULL)`,
    [email, tokenHash],
  );
  await sendVerificationEmail(email, token);
  res.status(201).json({
    message: 'Te enviamos un enlace de confirmación. Revisa tu correo para activar tu cuenta.',
  });
}));

router.post('/verify-email', asyncHandler(async (req, res) => {
  const token = typeof req.body.token === 'string' ? req.body.token : '';
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ error: 'El enlace de confirmación no es válido o ya venció.' });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const verified = await sql(
    `UPDATE email_verifications
     SET verified_at = NOW(), token_hash = NULL
     WHERE token_hash = $1 AND expires_at > NOW() AND verified_at IS NULL
     RETURNING email`,
    [tokenHash],
  );
  if (verified.length === 0) {
    return res.status(400).json({ error: 'El enlace de confirmación no es válido o ya venció.' });
  }

  res.json({ message: 'Correo confirmado. Ya puedes iniciar sesión.' });
}));

router.post('/resend-verification', asyncHandler(async (req, res) => {
  const email = normalizeAndValidateEmail(req.body.email);
  const users = await sql('SELECT id FROM users WHERE email = $1', [email]);
  const responseMessage = 'Si hay una cuenta pendiente con ese correo, te enviaremos un nuevo enlace.';
  if (users.length === 0) {
    return res.json({ message: responseMessage });
  }

  const records = await sql(
    'SELECT verified_at FROM email_verifications WHERE email = $1',
    [email],
  );
  if (records[0]?.verified_at) {
    return res.json({ message: responseMessage });
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const updated = await sql(
    `INSERT INTO email_verifications (email, token_hash, expires_at, verified_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour', NULL)
     ON CONFLICT (email) DO UPDATE
     SET token_hash = EXCLUDED.token_hash,
         expires_at = EXCLUDED.expires_at,
         verified_at = NULL,
         sent_at = NOW()
     WHERE email_verifications.sent_at < NOW() - INTERVAL '1 minute'
     RETURNING email`,
    [email, tokenHash],
  );
  if (updated.length === 0) {
    return res.status(429).json({ error: 'Espera un minuto antes de solicitar otro enlace.' });
  }
  await sendVerificationEmail(email, token);
  res.json({ message: responseMessage });
}));

export default router;
