// src/app.js
import express          from 'express'
import cors             from 'cors'
import { env }          from './config/env.js'
import { authMiddleware, roleMiddleware } from './middlewares/authMiddleware.js'
import authRoutes       from './routes/authRoutes.js'

const app = express()

// ── Middlewares globales ─────────────────────────────────────
app.use(cors({
  origin:      env.clientUrl,
  credentials: true,
}))
app.use(express.json())

// ── Ruta de salud ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:  'ok',
    message: 'Servidor de monitoreo de buses UPC funcionando',
    time:    new Date().toISOString(),
  })
})

// ── Rutas de la API ──────────────────────────────────────────
app.use('/api/auth', authRoutes)

// ── Ruta de prueba de roles (temporal) ───────────────────────
app.get('/api/test/admin', authMiddleware, roleMiddleware('admin'), (_req, res) => {
  res.json({ mensaje: 'Acceso de administrador correcto' })
})

// ── Ruta no encontrada ───────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

export default app