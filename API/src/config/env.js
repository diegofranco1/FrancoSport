function requiredEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta configurar la variable de entorno ${name}.`);
  }
  return value;
}

const corsOrigins = (process.env.CORS_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

export const config = Object.freeze({
  port: Number(process.env.PORT) || 3001,
  databaseUrl: requiredEnvironmentVariable('DATABASE_URL'),
  jwtSecret: requiredEnvironmentVariable('JWT_SECRET'),
  corsOrigins,
  appBaseUrl: process.env.APP_BASE_URL?.trim() || `http://localhost:${Number(process.env.PORT) || 3001}`,
  smtp: {
    host: process.env.SMTP_HOST?.trim(),
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER?.trim(),
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM?.trim(),
  },
});
