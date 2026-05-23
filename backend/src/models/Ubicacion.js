// src/models/Ubicacion.js
// Clase POO que representa la tabla ubicacion_bus
// Contiene los métodos para guardar y consultar posiciones GPS

import { pool } from '../config/database.js'

export class Ubicacion {

  // Guardar nueva posición GPS del bus
  static async guardar({ id_bus, lat, lng }) {
    const [result] = await pool.query(
      `INSERT INTO ubicacion_bus (id_bus, latitud, longitud)
       VALUES (?, ?, ?)`,
      [id_bus, lat, lng]
    )
    return result.insertId
  }

  // Obtener la última posición conocida de un bus
  static async ultimaPorBus(id_bus) {
    const [rows] = await pool.query(
      `SELECT id_ubicacion, id_bus, latitud, longitud, fecha_hora
       FROM ubicacion_bus
       WHERE id_bus = ?
       ORDER BY fecha_hora DESC
       LIMIT 1`,
      [id_bus]
    )
    return rows[0] || null
  }

  // Obtener la última posición de todos los buses activos
  static async ultimasDeTodos() {
    const [rows] = await pool.query(
      `SELECT ub.id_bus, ub.latitud, ub.longitud, ub.fecha_hora,
              b.nombre, b.placa, b.estado
       FROM ubicacion_bus ub
       INNER JOIN (
         SELECT id_bus, MAX(fecha_hora) AS ultima
         FROM ubicacion_bus
         GROUP BY id_bus
       ) latest ON ub.id_bus = latest.id_bus AND ub.fecha_hora = latest.ultima
       INNER JOIN bus b ON ub.id_bus = b.id_bus
       WHERE b.estado = 'en_recorrido'`
    )
    return rows
  }
}
