// src/server.js
// Punto de entrada — inicia HTTP y Socket.io

import { createServer } from 'http'
import { Server }       from 'socket.io'
import app              from './app.js'
import { env }          from './config/env.js'
import { connectDB }    from './config/database.js'
import { busSocket }    from './sockets/busSocket.js'

// ── Crear servidor HTTP sobre Express ────────────────────────
const httpServer = createServer(app)

// ── Configurar Socket.io ─────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin:      env.clientUrl,
    credentials: true,
  },
})

// Registrar eventos de Socket.io
busSocket(io)

// ── Iniciar servidor ─────────────────────────────────────────
async function start() {
  await connectDB()

  httpServer.listen(env.port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${env.port}`)
    console.log(`🏥 Health check: http://localhost:${env.port}/api/health`)
  })
}

start()