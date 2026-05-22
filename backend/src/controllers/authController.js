// src/controllers/authController.js
// Recibe la petición HTTP, valida los datos
// y llama al servicio correspondiente

import { login } from '../services/authService.js'

// POST /api/auth/login
export async function loginController(req, res) {
  const { correo, password } = req.body

  // 1. Validar que los campos no estén vacíos (RF-01)
  if (!correo || !password) {
    return res.status(400).json({
      error: 'El correo y la contraseña son obligatorios'
    })
  }

  // 2. Validar longitud mínima de contraseña (RNF7)
  if (password.length < 8) {
    return res.status(400).json({
      error: 'La contraseña debe tener mínimo 8 caracteres'
    })
  }

  try {
    const resultado = await login(correo, password)
    return res.status(200).json(resultado)
  } catch (error) {
    if (error.message === 'CREDENCIALES_INVALIDAS') {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      })
    }
    console.error('Error en login:', error)
    return res.status(500).json({
      error: 'Error interno del servidor'
    })
  }
}

// POST /api/auth/logout
// El logout en JWT es del lado del cliente (elimina el token)
// Aquí simplemente confirmamos que la petición llegó autenticada
export function logoutController(req, res) {
  return res.status(200).json({
    message: 'Sesión cerrada correctamente'
  })
}

// GET /api/auth/me
// Retorna los datos del usuario autenticado actual
export function meController(req, res) {
  return res.status(200).json({ usuario: req.usuario })
}
