// src/controllers/ubicacionController.js
// Recibe la ubicación GPS del conductor y la procesa

import { procesarUbicacion } from '../services/ubicacionService.js'
import { io }                from '../server.js'

// POST /api/ubicacion
export async function recibirUbicacion(req, res) {
  const { id_bus, lat, lng } = req.body
  const id_conductor = req.usuario.id_usuario

  // Validar campos obligatorios
  if (!id_bus || lat === undefined || lng === undefined) {
    return res.status(400).json({
      error: 'id_bus, lat y lng son obligatorios'
    })
  }

  try {
    const datos = await procesarUbicacion({ id_bus, id_conductor, lat, lng })

    // Emitir por Socket.io al room de la ruta
    io.to(`ruta_${datos.id_ruta}`).emit('bus:location', datos)

    return res.status(200).json({ ok: true, datos })

  } catch (error) {
    const errores = {
      COORDENADAS_INVALIDAS: { status: 400, mensaje: 'Coordenadas GPS inválidas' },
      BUS_NO_ENCONTRADO:     { status: 404, mensaje: 'Bus no encontrado' },
      BUS_NO_ASIGNADO:       { status: 403, mensaje: 'Este bus no está asignado a tu cuenta' },
      RUTA_NO_ENCONTRADA:    { status: 404, mensaje: 'El bus no tiene una ruta asignada' },
    }

    const err = errores[error.message]
    if (err) {
      return res.status(err.status).json({ error: err.mensaje })
    }

    console.error('Error en ubicación:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
