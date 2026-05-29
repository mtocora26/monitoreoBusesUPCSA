// src/services/ubicacionService.js
// Recibe GPS del conductor, guarda en BD y emite por socket

import { Ubicacion } from '../models/Ubicacion.js'
import { Bus }       from '../models/Bus.js'

export async function procesarUbicacion(io, idBus, lat, lng) {
  // 1. Guardar en BD
  await Ubicacion.registrarUbicacion(idBus, lat, lng)

  // 2. Obtener la ruta del bus para emitir al room correcto
  const ruta = await Bus.obtenerRuta(idBus)

  // 3. Emitir evento por socket al room de la ruta
  if (io && ruta) {
    io.to(`ruta_${ruta.id_ruta}`).emit('bus:location', {
      id_bus:    idBus,
      lat:       parseFloat(lat),
      lng:       parseFloat(lng),
      timestamp: new Date().toISOString(),
    })
  }
}