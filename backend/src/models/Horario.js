// src/models/Horario.js
// Clase POO que representa la entidad Horario
// Atributos según diagrama: id_horario, hora_salida, hora_llegada

import { pool } from '../config/database.js'

export class Horario {

  // Listar horarios de una ruta
  static async porRuta(id_ruta) {
    const [rows] = await pool.query(
      `SELECT id_horario, hora_salida, hora_llegada
       FROM horario
       WHERE id_ruta = ?
       ORDER BY hora_salida`,
      [id_ruta]
    )
    return rows
  }

  // Listar todos los horarios
  static async todos() {
    const [rows] = await pool.query(
      `SELECT h.id_horario, h.hora_salida, h.hora_llegada,
              r.id_ruta, r.nombre AS nombre_ruta
       FROM horario h
       JOIN ruta r ON h.id_ruta = r.id_ruta
       ORDER BY r.id_ruta, h.hora_salida`
    )
    return rows
  }
}
