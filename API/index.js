import app from './src/app.js';
import { config } from './src/config/env.js';

const server = app.listen(config.port, () => {
  console.log(`Servidor iniciado en http://localhost:${config.port}`);
});

export default server;
