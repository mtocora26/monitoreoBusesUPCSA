// src/models/Bus.js
// Clase POO que representa la tabla bus

import { pool } from '../config/database.js'

export class Bus {

  // Buscar bus por ID
  static async porId(id_bus) {
    const [rows] = await pool.query(
      `SELECT b.*, u.nombre AS nombre_conductor
       FROM bus b
       LEFT JOIN usuario u ON b.id_conductor = u.id_usuario
       WHERE b.id_bus = ?`,
      [id_bus]
    )
    return rows[0] || null
  }

  // Verificar que un conductor tiene asignado ese bus
  static async perteneceAConductor(id_bus, id_conductor) {
    const [rows] = await pool.query(
      `SELECT id_bus FROM bus
       WHERE id_bus = ? AND id_conductor = ?`,
      [id_bus, id_conductor]
    )
    return rows.length > 0
  }

  // Obtener la ruta asignada a un bus
  static async rutaDeBus(id_bus) {
    const [rows] = await pool.query(
      `SELECT r.id_ruta, r.nombre, r.activa
       FROM bus_ruta br
       JOIN ruta r ON br.id_ruta = r.id_ruta
       WHERE br.id_bus = ?`,
      [id_bus]
    )
    return rows[0] || null
  }

  // Actualizar estado del bus
  static async actualizarEstado(id_bus, estado) {
    await pool.query(
      `UPDATE bus SET estado = ? WHERE id_bus = ?`,
      [estado, id_bus]
    )
  }

  // Listar todos los buses con su ruta y conductor
  static async todos() {
    const [rows] = await pool.query(
      `SELECT b.id_bus, b.placa, b.nombre, b.capacidad, b.estado,
              u.nombre AS nombre_conductor,
              r.id_ruta, r.nombre AS nombre_ruta
       FROM bus b
       LEFT JOIN usuario u ON b.id_conductor = u.id_usuario
       LEFT JOIN bus_ruta br ON b.id_bus = br.id_bus
       LEFT JOIN ruta r ON br.id_ruta = r.id_ruta`
    )
    return rows
  }
}
