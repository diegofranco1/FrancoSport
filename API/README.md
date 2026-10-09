# Franco Sport API

## Ejecutar con Docker

1. Desde `API/`, copia `.env.example` a `.env`.
2. En `.env`, configura `DATABASE_URL` con la URL de conexión de Neon y cambia `JWT_SECRET` por una clave larga y aleatoria. Configura también `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM` con los datos de un proveedor SMTP; sin esa configuración no se podrán completar registros ni reenviar confirmaciones. No compartas ni subas este archivo al repositorio.
3. Antes de iniciar la API, ejecuta una vez el SQL de `db/migrations/001_email_verifications.sql` en la consola SQL de Neon. La migración conserva las cuentas existentes como verificadas; las cuentas nuevas deberán confirmar su dirección de correo.
4. Desde `API/`, inicia la aplicación:

   ```sh
   docker compose up --build
   ```

5. Abre `http://localhost:3001`. La API responde en `http://localhost:3001/api`; su ruta de salud es `/api/health`.

Para ejecutar en segundo plano usa `docker compose up --build -d`; para detenerlo, `docker compose down`, siempre desde `API/`.

La aplicación usa la base Neon configurada externamente; Docker no crea ni migra tablas. Asegúrate de que el esquema de la base esté preparado antes de usar las rutas que consultan datos.

## Ejecutar sin Docker

Con Node.js 20 o superior y las dependencias instaladas, ejecuta `npm start` desde `API/`. La configuración de `.env` es la misma.
