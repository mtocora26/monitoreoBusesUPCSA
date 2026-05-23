// src/services/ubicacionService.js
// Lógica de negocio para el procesamiento de coordenadas GPS
// Valida, guarda y emite la ubicación del conductor

import { Ubicacion } from '../models/Ubicacion.js'
import { Bus }       from '../models/Bus.js'

// Validar que las coordenadas son valores numéricos reales (RNF10)
function coordenadasValidas(lat, lng) {
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)

  if (isNaN(latNum) || isNaN(lngNum)) return false
  if (latNum < -90  || latNum > 90)   return false
  if (lngNum < -180 || lngNum > 180)  return false

  return true
}

export async function procesarUbicacion({ id_bus, id_conductor, lat, lng }) {
  // 1. Validar coordenadas (RNF10 — confiabilidad)
  if (!coordenadasValidas(lat, lng)) {
    throw new Error('COORDENADAS_INVALIDAS')
  }

  // 2. Verificar que el bus existe
  const bus = await Bus.porId(id_bus)
  if (!bus) {
    throw new Error('BUS_NO_ENCONTRADO')
  }

  // 3. Verificar que el conductor tiene ese bus asignado
  const esSuBus = await Bus.perteneceAConductor(id_bus, id_conductor)
  if (!esSuBus) {
    throw new Error('BUS_NO_ASIGNADO')
  }

  // 4. Obtener la ruta del bus
  const ruta = await Bus.rutaDeBus(id_bus)
  if (!ruta) {
    throw new Error('RUTA_NO_ENCONTRADA')
  }

  // 5. Guardar ubicación en BD
  await Ubicacion.guardar({ id_bus, lat, lng })

  // 6. Retornar datos para emitir por Socket.io
  return {
    id_bus,
    id_ruta:   ruta.id_ruta,
    lat:       parseFloat(lat),
    lng:       parseFloat(lng),
    timestamp: new Date().toISOString(),
  }
}
