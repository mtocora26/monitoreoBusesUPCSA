// src/routes/paradaRoutes.js

import { Router } from 'express'
import { listarParadas } from '../controllers/paradaController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

// GET /api/paradas — todas, o filtrar con ?ruta_id=X
router.get('/', authMiddleware, listarParadas)

export default router
