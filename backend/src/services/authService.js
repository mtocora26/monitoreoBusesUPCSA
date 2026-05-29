// src/services/authService.js
// Lógica de negocio de autenticación
// Usa el modelo Usuario del diagrama de clases

import bcrypt           from 'bcryptjs'
import { Usuario }      from '../models/Usuario.js'
import { generarToken } from '../utils/jwt.js'

export async function login(correo, password) {
  // 1. Buscar usuario por correo usando el modelo Usuario
  const usuario = await Usuario.porCorreo(correo)

  // 2. Verificar que el usuario existe
  if (!usuario) {
    throw new Error('CREDENCIALES_INVALIDAS')
  }

  // 3. Verificar contraseña con bcrypt (RNF7)
  const passwordValida = await bcrypt.compare(password, usuario.password_hash)
  if (!passwordValida) {
    throw new Error('CREDENCIALES_INVALIDAS')
  }

  // 4. Generar JWT con datos del usuario
  const token = generarToken({
    id_usuario:   usuario.id_usuario,
    nombre:       usuario.nombre,
    correo:       usuario.correo,
    tipo_usuario: usuario.tipo_usuario,
  })

  // 5. Retornar token y datos básicos (sin password_hash)
  return {
    token,
    usuario: {
      id_usuario:   usuario.id_usuario,
      nombre:       usuario.nombre,
      correo:       usuario.correo,
      tipo_usuario: usuario.tipo_usuario,
    },
  }
}
