# Gestión de productos (Node.js + Express + MongoDB + JWT)

## Ejecución local
```bash
docker compose up -d        # MongoDB en localhost:27017
cp .env.example .env        # ajusta JWT_SECRET
npm install
npm start                   # http://localhost:3000  (redirige a /login.html)
npm test                    # Jest + Supertest, con cobertura
```

## API
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | /api/auth/register | no | Registro (name, email, password) |
| POST | /api/auth/login | no | Devuelve `token` JWT y cookie httpOnly |
| POST | /api/auth/logout | no | Borra la cookie |
| GET/POST | /api/products | JWT | Listar / crear |
| GET/PUT/DELETE | /api/products/:id | JWT | Ver / modificar / eliminar |

Enviar `Authorization: Bearer <token>`. Cada usuario sólo ve y modifica sus propios productos.

## Vistas
`/login.html` (login y registro) y `/products.html` (CRUD, requiere sesión).

## Despliegue (GitHub Actions + EasyPanel)
1. En EasyPanel crea un proyecto con dos servicios:
   - **Mongo** (servicio de base de datos). Anota su host interno, p. ej. `mongodb://usuario:clave@proyecto_mongo:27017`.
   - **App**: origen GitHub (repo + rama `main`), build con el `Dockerfile` del repo, puerto 3000.
2. Variables de entorno de la App: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`.
3. Asigna un dominio a la App en EasyPanel.
4. Para despliegue automático desde Actions: en la App → Deploy, copia la *Deploy Webhook URL* y guárdala en GitHub → Settings → Secrets como `EASYPANEL_DEPLOY_URL`.
5. Cada push a `main` ejecuta los tests y, si pasan, dispara el despliegue ([.github/workflows/ci.yml](.github/workflows/ci.yml)).
....