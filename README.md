# Franco Sport

Franco Sport es un e-commerce sencillo de artículos deportivos, creado como proyecto para el ramo de Desarrollo Web que cursé en 2024. La idea inicial fue desarrollar una tienda en línea como parte del curso; desde entonces sigo trabajando en ella para mejorar su diseño, organización y funcionamiento.

## Estado del proyecto

El proyecto sigue activo y está en desarrollo. No está finalizado: lo voy puliendo de manera gradual y algunas funciones pueden requerir configuración adicional para usarse.

## Funcionalidades

- Catálogo de productos deportivos.
- Carrito de compras.
- Registro e inicio de sesión de usuarios.
- Confirmación de correo electrónico y perfil de usuario.
- Sección de administración protegida.
- Interfaz adaptable a celulares y computadores.

## Tecnologías

- **Frontend:** HTML, CSS y JavaScript.
- **Backend:** Node.js y Express.
- **Base de datos:** PostgreSQL en Neon.
- **Contenedores:** Docker Compose.

## Estructura

```text
.
├── API/                 # API, configuración y archivos para ejecutar con Docker
└── frontend-project/    # Vistas, estilos y scripts del sitio
```

## Ejecutar localmente

La guía completa para configurar las variables de entorno, preparar la base de datos y ejecutar la aplicación con Docker está en [`API/README.md`](API/README.md).

En resumen, después de completar la configuración indicada allí, inicia los servicios desde la carpeta `API`:

```sh
docker compose up --build
```

Luego abre [http://localhost:3001](http://localhost:3001).

También se puede ejecutar sin Docker con Node.js 20 o superior; los pasos están en la guía de la API.

## Nota

No subas archivos `.env` ni credenciales al repositorio. Usa [`API/.env.example`](API/.env.example) como referencia para preparar tu configuración local.
