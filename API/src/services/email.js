import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter;

function getTransporter() {
  const { host, port, secure, user, password, from } = config.smtp;
  if (!host || !user || !password || !from) {
    const error = new Error('El correo de confirmación no está configurado en el servidor.');
    error.status = 503;
    throw error;
  }

  transporter ??= nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
  });
  return { transporter, from };
}

export async function sendVerificationEmail(email, token) {
  const { transporter: mailer, from } = getTransporter();
  const verificationUrl = new URL('/verify-email.html', config.appBaseUrl);
  verificationUrl.searchParams.set('token', token);

  try {
    await mailer.sendMail({
      from,
      to: email,
      subject: 'Confirma tu correo - Franco Sport',
      text: `Para confirmar tu correo, abre este enlace: ${verificationUrl.href}\nEl enlace vence en una hora.`,
      html: `
      <div style="font-family:Arial,sans-serif;color:#183044;max-width:560px;margin:auto;padding:32px">
        <h1 style="color:#2584b8">Franco Sport</h1>
        <h2>Confirma tu correo</h2>
        <p>Abre el enlace para confirmar tu dirección de correo y activar tu cuenta.</p>
        <p><a href="${verificationUrl.href}" style="display:inline-block;padding:14px 22px;border-radius:8px;background:#2584b8;color:#fff;text-decoration:none;font-weight:bold">Verificar correo</a></p>
        <p>El enlace vence en una hora. Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
      </div>
    `,
    });
  } catch (cause) {
    const error = new Error('No pudimos enviar el correo de confirmación. Intenta nuevamente.', { cause });
    error.status = 503;
    throw error;
  }
}
