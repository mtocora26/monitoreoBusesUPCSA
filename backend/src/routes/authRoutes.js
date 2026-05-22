// src/routes/authRoutes.js
// Define las URLs del módulo de autenticación

import { Router } from 'express'
import { loginController, logoutController, meController } from '../controllers/authController.js'
import { authMiddleware }   from '../middlewares/authMiddleware.js'
import { loginRateLimit }   from '../middlewares/rateLimitMiddleware.js'

const router = Router()

// POST /api/auth/login — público, con rate limit (RNF11)
router.post('/login', loginRateLimit, loginController)

// POST /api/auth/logout — requiere token válido (RF-02)
router.post('/logout', authMiddleware, logoutController)

// GET /api/auth/me — datos del usuario actual
router.get('/me', authMiddleware, meController)

export default router
