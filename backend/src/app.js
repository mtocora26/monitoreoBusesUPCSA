// src/app.js
import express          from 'express'
import cors             from 'cors'
import { env }          from './config/env.js'
import { authMiddleware, roleMiddleware } from './middlewares/authMiddleware.js'
import authRoutes       from './routes/authRoutes.js'
import ubicacionRoutes from './routes/ubicacionRoutes.js'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import busRoutes       from './routes/busRoutes.js'
import rutaRoutes      from './routes/rutaRoutes.js'
import paradaRoutes    from './routes/paradaRoutes.js'
import notificacionRoutes from './routes/notificacionRoutes.js'
import usuarioRoutes from './routes/usuarioRoutes.js'


const app = express()

// servir archivos estaticamente
const __dirname = dirname(fileURLToPath(import.meta.url))
app.use(express.static(join(__dirname, '../public')))

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
app.use('/api/ubicacion', ubicacionRoutes)
app.use('/api/buses',     busRoutes)
app.use('/api/rutas',     rutaRoutes)
app.use('/api/paradas',   paradaRoutes)
app.use('/api/ubicacion', ubicacionRoutes)
app.use('/api/notificaciones', notificacionRoutes)
app.use('/api/usuarios', usuarioRoutes)

// ── Ruta de prueba de roles (temporal) ───────────────────────
app.get('/api/test/admin', authMiddleware, roleMiddleware('admin'), (_req, res) => {
  res.json({ mensaje: 'Acceso de administrador correcto' })
})

// ── Ruta no encontrada ───────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

export default app