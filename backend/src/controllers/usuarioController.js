// src/controllers/usuarioController.js
import { Usuario } from '../models/Usuario.js'
import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'

// GET /api/usuarios
export async function listarUsuarios(_req, res) {
  try {
    const usuarios = await Usuario.todos()
    return res.status(200).json({ usuarios })
  } catch (error) {
    console.error('Error listando usuarios:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// POST /api/usuarios
export async function crearUsuario(req, res) {
  const { nombre, correo, password, tipo_usuario, activo } = req.body

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'nombre, correo y password son obligatorios' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
  }

  try {
    const password_hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      `INSERT INTO usuario (nombre, correo, password_hash, tipo_usuario, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, correo, password_hash, tipo_usuario || 'estudiante', activo === false ? 0 : 1]
    )
    return res.status(201).json({ ok: true, id_usuario: result.insertId })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese correo' })
    }
    console.error('Error creando usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PATCH /api/usuarios/:id
export async function editarUsuario(req, res) {
  const { id } = req.params
  const { nombre, correo, tipo_usuario, activo } = req.body

  try {
    await pool.query(
      `UPDATE usuario SET nombre=?, correo=?, tipo_usuario=?, activo=?
       WHERE id_usuario=?`,
      [nombre, correo, tipo_usuario, activo === false ? 0 : 1, id]
    )
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error editando usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// DELETE /api/usuarios/:id
export async function eliminarUsuario(req, res) {
  const { id } = req.params
  try {
    await pool.query(`DELETE FROM usuario WHERE id_usuario=?`, [id])
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}