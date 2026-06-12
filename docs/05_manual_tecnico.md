# Manual Tecnico

## 1. Arquitectura
- Frontend: React + Vite + React Router + Leaflet + Socket.IO client.
- Backend: Node.js + Express + Socket.IO + JWT + MySQL.
- Base de datos: MySQL.

## 2. Estructura general
- backend/: API, sockets, modelos, controladores.
- frontend/: UI, rutas, contexto de autenticacion, servicios API/socket.
- docs/: documentacion de entrega.

## 3. Backend

### 3.1 Seguridad
- JWT en Authorization Bearer.
- authMiddleware y roleMiddleware por endpoint.

### 3.2 CORS
- Origenes permitidos por CLIENT_URL.
- Soporte LAN/ngrok en entorno desarrollo.

### 3.3 Sockets
- Namespace por defecto con rooms por ruta: ruta_{id_ruta}.
- Eventos principales:
  - bus:location
  - bus:estado
  - notificacion:nueva

## 4. Frontend
- Servicio API centralizado en src/services/api.js.
- Socket client en src/services/socket.js.
- Rutas protegidas por rol con RutaProtegida.

## 5. Configuracion de entorno

### Backend
Ver backend/.env.example.

### Frontend
- VITE_API_URL opcional.
- Sin VITE_API_URL usa mismo origen y proxy de Vite para /api y /socket.io.

## 6. Ejecucion local
1. npm install (raiz, backend y frontend).
2. npm run dev (raiz) o correr backend/frontend por separado.

## 7. Despliegue de sustentacion sin tarjeta
- Frontend: Vercel o Vite local con ngrok.
- Backend: local.
- Opcion 1 tunel ngrok: publicar frontend y usar proxy a backend local.

## 8. Logs y monitoreo
- Health: GET /api/health.
- Consola backend para errores API/sockets.

## 9. Buenas practicas
- Validar inputs en controllers.
- Manejo de errores consistente.
- Separacion por capas (routes/controllers/models/services).
