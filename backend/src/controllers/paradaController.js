// src/controllers/paradaController.js
// Endpoints para consultar paradas — Issue #10

import { Parada } from '../models/Parada.js'

// GET /api/paradas — todas, o filtrar con ?ruta_id=X
export async function listarParadas(req, res) {
  const { ruta_id } = req.query

  try {
    if (ruta_id) {
      const paradas = await Parada.porRuta(ruta_id)
      return res.status(200).json({ paradas })
    }

    const paradas = await Parada.todas()
    return res.status(200).json({ paradas })
  } catch (error) {
    console.error('Error listando paradas:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
