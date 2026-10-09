import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/env.js';
import { authenticateUser, requireAdmin } from './middleware/auth.js';
import apiRoutes from './routes/index.js';

const app = express();
const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../frontend-project');

app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/api', apiRoutes);
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada.' });
});
app.get('/administracion.html', authenticateUser, requireAdmin);
app.use(express.static(frontendDirectory));
app.use((error, req, res, next) => {
  console.error('Error al procesar la solicitud:', error);
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.status || 500).json({
    error: error.status ? error.message : 'Error interno del servidor.',
  });
});

export default app;
