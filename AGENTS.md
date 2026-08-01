# AGENTS.md — Sapy'Aite

## Descripción del proyecto

Sistema de pedidos por QR para el local de comida **Sapy'Aite**. El cliente escanea un QR de mesa, ve el menú digital, arma su carrito y envía el pedido (con confirmación por WhatsApp). Incluye reservas y un panel de administración con CRUD de productos/mesas e informes.

## Stack

- **Backend**: Python 3.11 + Flask 2.3 + Flask-CORS + bcrypt + qrcode
- **Base de datos**: PostgreSQL (psycopg2). Esquema y datos de ejemplo en `backend/data_base.sql`
- **Frontend**: HTML/CSS/JS vanilla (sin framework ni build system), carpeta `froned/`
- **Deploy**: Backend en Render (gunicorn `wsgi:app`), frontend en Vercel, DB en SupaBase (PostgreSQL)

## Estructura

- `backend/app.py` — Rutas API Flask: menú, verificación de mesa, pedidos, reservas, login/logout, CRUD admin e informes
- `backend/conexion.py` — Capa de acceso a datos: conexiones psycopg2 y consultas SQL
- `backend/qr.py` — Script para generar los QR de cada mesa
- `backend/data_base.sql` — Esquema completo de la base de datos + datos de ejemplo
- `backend/.env` — Variables de entorno locales (NO se sube al repo, está en .gitignore)
- `froned/index.html` + `froned/scrip.js` — Menú y carrito del cliente
- `froned/login.html` + `froned/login.js` — Login de empleados
- `froned/admin.html` + `froned/admin.js` — Panel de administración
- `froned/qr-scaner.html` — Verificación del QR de mesa
- `froned/styles/` — CSS (login.css, admin.css, menu.css, style.css)
- `wsgi.py` — Entry point para gunicorn en producción
- `requirements.txt`, `render.yaml`, `runtime.txt` — Configuración de deploy

## Comandos

- Instalar dependencias: `pip install -r requirements.txt` (usar el virtualenv `.venv/`)
- Correr backend local: `python backend/app.py` (puerto 5000, modo debug)
- Correr con gunicorn: `gunicorn wsgi:app`
- Generar QRs de mesas: `python backend/qr.py`
- No hay tests ni linter configurados en el proyecto

## Variables de entorno (`backend/.env`)

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — conexión PostgreSQL (o `DATABASE_URL` que tiene prioridad en `conexion.py`)
- `SECRET_KEY` — clave para firmar cookies de sesión (en producción via Render env vars)

## Convenciones

- Código y comentarios en español (variante rioplatense)
- Base de datos: usar `get_connection()` con `psycopg2.extras.RealDictCursor` y consultas parametrizadas con `%s` (nunca concatenar valores)
- Nuevas rutas API: prefijo `/api/`, respuesta JSON con estructura `{success: true/false, ...}` y campo `error` ante fallos
- Rutas de administración: decoradores `@login_required` + `@admin_required`
- Frontend: resolver la URL de la API con `window.API_URL` / `API_BASE` (local = `http://localhost:5000/api`, producción = `https://sapiayte-bz3i.onrender.com/api`) y `fetch` con `credentials: 'include'`
- El estado de la mesa/carrito del cliente se persiste en `localStorage`
- No modificar ni exponer credenciales; `.env` nunca se sube al repo

## Deploy

- **Render**: se define en `render.yaml` + `runtime.txt` (Python 3.11.0). La DB se provisiona con el mismo servicio
- **Vercel**: la carpeta `froned/` es la raíz del sitio (`https://sapiayte.vercel.app`)
- **CORS**: al agregar un nuevo origen, sumarlo a la lista de `origins` en `CORS(app, ...)` dentro de `backend/app.py`
