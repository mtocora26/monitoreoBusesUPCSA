// src/server.js
// Punto de entrada — inicia HTTP y Socket.io

import { createServer } from 'http'
import { Server }       from 'socket.io'
import app              from './app.js'
import { env }          from './config/env.js'
import { connectDB }    from './config/database.js'

// ── Crear servidor HTTP sobre Express ────────────────────────
const httpServer = createServer(app)

// ── Configurar Socket.io ─────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin:      env.clientUrl,
    credentials: true,
  },
})

// Evento de conexión base — se expandirá en sockets/busSocket.js
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`)

  // El cliente se une al room de su ruta
  // Ejemplo: socket.emit('join:ruta', { id_ruta: 1 })
  socket.on('join:ruta', ({ id_ruta }) => {
    socket.join(`ruta_${id_ruta}`)
    console.log(`📍 Socket ${socket.id} unido a ruta_${id_ruta}`)
  })

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`)
  })
})

// ── Iniciar servidor ─────────────────────────────────────────
async function start() {
  // 1. Verificar conexión a la base de datos
  await connectDB()

  // 2. Levantar el servidor HTTP
  httpServer.listen(env.port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${env.port}`)
    console.log(`🏥 Health check: http://localhost:${env.port}/api/health`)
  })
}

start()