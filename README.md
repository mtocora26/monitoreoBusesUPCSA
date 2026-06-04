# Monitoreo de Buses UPC Aguachica

Aplicacion web para monitoreo de buses en tiempo real con:
- Backend Node.js + Express + Socket.IO
- Frontend React + Vite + Leaflet
- Base de datos MySQL (compatible con PlanetScale)

## Arquitectura de despliegue recomendada

- Backend: Render (Web Service)
- Frontend: Vercel (Static/SPA)
- Base de datos: PlanetScale (MySQL cloud)

> Nota: el backend actual usa `mysql2`. Si deseas usar PostgreSQL en Railway, hay que migrar capa de datos y queries.

## Variables de entorno

### Backend (`backend/.env.example`)

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL` (uno o varios dominios separados por coma)

Ejemplo de `CLIENT_URL`:

`http://localhost:5173,https://monitoreo-buses.vercel.app`

### Frontend (`frontend/.env.example`)

- `VITE_API_URL` (URL publica del backend)

Ejemplo:

`VITE_API_URL=https://monitoreo-buses-backend.onrender.com`

## Deploy del backend en Render

### Opcion A: Blueprint (recomendado)

1. En Render, crear servicio desde repositorio usando `render.yaml`.
2. Confirmar que Render detecta:
   - `rootDir: backend`
   - `buildCommand: npm ci`
   - `startCommand: npm start`
   - `healthCheckPath: /api/health`
3. Completar variables secretas faltantes (`DB_*`, `JWT_SECRET`, `CLIENT_URL`).
4. Desplegar y validar:
   - `https://TU_BACKEND/api/health`

### Opcion B: Manual

1. Crear Web Service en Render apuntando al mismo repo.
2. Root Directory: `backend`.
3. Build Command: `npm ci`.
4. Start Command: `npm start`.
5. Configurar variables de entorno del backend.
6. Verificar salud en `/api/health`.

## Deploy del frontend en Vercel

1. Importar el repositorio en Vercel.
2. Configurar Root Directory: `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Variable de entorno en Vercel:
   - `VITE_API_URL=https://TU_BACKEND_RENDER`
6. Deploy.

El archivo `frontend/vercel.json` ya incluye rewrite de SPA para rutas de React Router.

## Checklist de salida a produccion

1. Backend responde `200` en `/api/health`.
2. Frontend carga y permite login con URL publica.
3. `CLIENT_URL` del backend contiene el dominio de Vercel.
4. CORS y Socket.IO aceptan origen del frontend.
5. Flujo conductor -> GPS -> mapa estudiante validado en dominio publico.

## Redespliegue sin inactividad prolongada

1. Mantener `autoDeploy` en Render y Vercel (deploy atomico en frontend).
2. Antes de merge a `main`, validar local:
   - `npm run dev` (raiz)
   - `npm run build --prefix frontend`
3. Usar PRs pequenas y revert rapido si falla.
4. Si hay incidente:
   - Vercel: restaurar deployment anterior.
   - Render: rollback al deploy previo estable.
5. Evitar cambios destructivos de DB en horas pico; aplicar migraciones en ventana controlada.

## Desarrollo local

### Requisitos

- Node.js 20+
- MySQL local o cloud

### Pasos

1. Copiar variables:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env` (opcional en local)
2. Instalar dependencias:
   - Raiz: `npm install`
   - Backend: `cd backend && npm install`
   - Frontend: `cd ../frontend && npm install`
3. Ejecutar ambos servicios desde raiz:
   - `npm run dev`

## Evidencia para Issue #25

- Configuracion de backend cloud: `render.yaml`
- Configuracion de frontend cloud (SPA): `frontend/vercel.json`
- Variables de entorno documentadas: `backend/.env.example`, `frontend/.env.example`
- Instrucciones de deploy y redespliegue: este README
