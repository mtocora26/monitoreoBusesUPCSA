import { useEffect, useState, useRef } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBus, faRoute, faLocationDot, faClock,
  faPlay, faStop, faPaperPlane, faSignal,
  faCircleCheck, faCirclePause, faCircleXmark,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import api from '../../services/api'
import './MiRecorrido.css'

const CENTRO_DEFECTO = [8.3086, -73.6194]

const iconoBus = L.divIcon({
  className: '',
  html: '<div class="conductor-mapa-bus">🚌</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

function ControlCamara({ centro }) {
  const map = useMap()

  useEffect(() => {
    if (!centro) return
    map.setView(centro, Math.max(map.getZoom(), 16), { animate: true })
  }, [centro, map])

  return null
}

export default function MiRecorrido() {
  const [busInfo, setBusInfo]       = useState(null)
  const [enRecorrido, setEnRecorrido] = useState(false)
  const [estado, setEstado]         = useState('fuera_de_servicio')
  const [gps, setGps]               = useState(null)
  const [historialGps, setHistorialGps] = useState([])
  const [estadoConexion, setEstadoConexion] = useState(() => (navigator.onLine ? 'online' : 'offline'))
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [mensaje, setMensaje]       = useState('')
  const [log, setLog]               = useState([])
  const watchRef = useRef(null)

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get('/api/buses/mi-bus')
        if (data.bus) {
          setBusInfo(data.bus)
          setEstado(data.bus.estado || 'fuera_de_servicio')
        }
      } catch {
        setBusInfo({
          nombre: 'Bus #01',
          placa: 'ABC-123',
          nombre_ruta: 'Ruta Centro',
          proxima_parada: 'Bloque 3',
          eta: '6 min',
          estado: 'fuera_de_servicio',
        })
      }
    }
    cargar()
  }, [])

  useEffect(() => {
    return () => {
      if (watchRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current)
      }
    }
  }, [])

  useEffect(() => {
    function handleOnline() {
      setEstadoConexion(prev => (prev === 'offline' ? 'retrying' : prev))
    }

    function handleOffline() {
      setEstadoConexion('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  function iniciarRecorrido() {
    if (!navigator.geolocation) {
      agregarLog('GPS no disponible en este dispositivo', 'error')
      return
    }
    setEnRecorrido(true)
    setEstado('en_recorrido')
    agregarLog('Recorrido iniciado', 'ok')
    actualizarEstadoBus('en_recorrido')

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setGps({ lat, lng })
        setHistorialGps(prev => [...prev.slice(-19), { lat, lng, id: Date.now() }])
        enviarUbicacion(lat, lng)
      },
      (err) => agregarLog(`Error GPS: ${err.message}`, 'error'),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )

    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {})
    }
  }

  function finalizarRecorrido() {
    setEnRecorrido(false)
    setEstado('fuera_de_servicio')
    setGps(null)
    setHistorialGps([])
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    agregarLog('Recorrido finalizado', 'ok')
    actualizarEstadoBus('fuera_de_servicio')
  }

  function alternarDetenido() {
    if (!enRecorrido) return

    const nuevoEstado = estado === 'detenido' ? 'en_recorrido' : 'detenido'
    setEstado(nuevoEstado)

    if (nuevoEstado === 'detenido') {
      agregarLog('Bus marcado como detenido', 'ok')
    } else {
      agregarLog('Bus reanudo el recorrido', 'ok')
    }

    actualizarEstadoBus(nuevoEstado)
  }

  async function actualizarEstadoBus(nuevoEstado) {
    const idBus = busInfo?.id_bus
    if (!idBus) {
      agregarLog('No hay bus asignado para actualizar estado', 'error')
      return
    }

    try {
      await api.patch(`/api/buses/${idBus}/estado`, { estado: nuevoEstado })
    } catch {
      agregarLog(`Error al actualizar estado a ${nuevoEstado}`, 'error')
    }
  }

  async function enviarUbicacion(lat, lng) {
    const idBus = busInfo?.id_bus
    if (!idBus) {
      agregarLog('No hay bus asignado para enviar ubicación', 'error')
      return
    }

    const hora = new Date().toLocaleTimeString()
    try {
      setEstadoConexion('syncing')
      await api.post('/api/ubicacion', { id_bus: idBus, lat, lng })
      setEstadoConexion('online')
      setUltimaActualizacion(hora)
      agregarLog(`${hora} — lat: ${lat.toFixed(5)}, lng: ${lng.toFixed(5)}`, 'ok')
    } catch {
      setEstadoConexion(navigator.onLine ? 'retrying' : 'offline')
      agregarLog(`${hora} — Error al enviar ubicación`, 'error')
    }
  }

  async function enviarAviso() {
    if (!mensaje.trim()) return
    try {
      await api.post('/api/notificaciones', { mensaje, tipo: 'retraso' })
      agregarLog('Aviso enviado', 'ok')
    } catch {
      agregarLog('Aviso enviado (modo local)', 'ok')
    }
    setMensaje('')
  }

  function agregarLog(msg, tipo) {
    setLog(prev => [...prev.slice(-20), { msg, tipo, id: Date.now() }])
  }

  const estadoConfig = {
    en_recorrido:     { texto: 'En recorrido',      icono: faCircleCheck,  clase: 'badge--verde'    },
    detenido:         { texto: 'Detenido',           icono: faCirclePause,  clase: 'badge--amarillo' },
    fuera_de_servicio:{ texto: 'Fuera de servicio',  icono: faCircleXmark,  clase: 'badge--rojo'     },
  }

  const conexionConfig = {
    online:   { texto: 'En linea',          icono: faCircleCheck,      clase: 'conexion-chip--online' },
    syncing:  { texto: 'Sincronizando...',  icono: faCirclePause,      clase: 'conexion-chip--syncing' },
    retrying: { texto: 'Reintentando',      icono: faTriangleExclamation, clase: 'conexion-chip--retrying' },
    offline:  { texto: 'Sin conexion',      icono: faCircleXmark,      clase: 'conexion-chip--offline' },
  }

  const estadoInfo = estadoConfig[estado] || estadoConfig.fuera_de_servicio
  const conexionInfo = conexionConfig[estadoConexion] || conexionConfig.offline
  const centroMapa = gps ? [gps.lat, gps.lng] : CENTRO_DEFECTO
  const trazoRecorrido = historialGps.map(p => [p.lat, p.lng])

  return (
    <Layout titulo="Mi recorrido" sinPadding>
      <div className="conductor-ride-page">
        <div className="conductor-ride-map">
          <MapContainer
            center={centroMapa}
            zoom={16}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />

            <ControlCamara centro={gps ? [gps.lat, gps.lng] : null} />

            {trazoRecorrido.length > 1 && (
              <Polyline
                positions={trazoRecorrido}
                color="#1f7a4d"
                weight={6}
                opacity={0.86}
              />
            )}

            {gps && <Marker position={[gps.lat, gps.lng]} icon={iconoBus} />}
          </MapContainer>
        </div>

        <aside className="conductor-ride-panel">
          <div className="conductor-panel-header">
            <div>
              <p className="conductor-panel-kicker">Modo conductor</p>
              <h3>{busInfo?.nombre || 'Bus sin asignar'}</h3>
            </div>
            <div className={`conductor-conexion-chip ${conexionInfo.clase}`}>
              <FontAwesomeIcon icon={conexionInfo.icono} />
              {conexionInfo.texto}
            </div>
          </div>

          <div className="conductor-panel-badges">
            <span className={`conductor-badge ${estadoInfo.clase}`}>
              <FontAwesomeIcon icon={estadoInfo.icono} />
              {estadoInfo.texto}
            </span>
            <span className="conductor-pill">
              <FontAwesomeIcon icon={faSignal} /> {busInfo?.placa || '---'}
            </span>
            <span className="conductor-pill">
              <FontAwesomeIcon icon={faRoute} /> {busInfo?.nombre_ruta || 'Sin ruta'}
            </span>
          </div>

          <div className="conductor-stats-grid">
            <div className="conductor-stat-card">
              <span>Ultimo envio</span>
              <strong>{ultimaActualizacion || 'Sin datos'}</strong>
            </div>
            <div className="conductor-stat-card">
              <span>Puntos GPS</span>
              <strong>{historialGps.length}</strong>
            </div>
            <div className="conductor-stat-card conductor-stat-card--full">
              <span>
                <FontAwesomeIcon icon={faLocationDot} /> Coordenadas actuales
              </span>
              <strong>{gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : 'Aun sin señal GPS'}</strong>
            </div>
          </div>

          <div className="conductor-botones">
            <button
              className="conductor-btn conductor-btn--iniciar"
              onClick={iniciarRecorrido}
              disabled={enRecorrido}
            >
              <FontAwesomeIcon icon={faPlay} />
              Iniciar
            </button>
            <button
              className="conductor-btn conductor-btn--detener"
              onClick={alternarDetenido}
              disabled={!enRecorrido}
            >
              <FontAwesomeIcon icon={faCirclePause} />
              {estado === 'detenido' ? 'Reanudar' : 'Detener'}
            </button>
            <button
              className="conductor-btn conductor-btn--finalizar"
              onClick={finalizarRecorrido}
              disabled={!enRecorrido}
            >
              <FontAwesomeIcon icon={faStop} />
              Finalizar
            </button>
          </div>

          <div className="conductor-aviso">
            <h4>
              <FontAwesomeIcon icon={faTriangleExclamation} /> Aviso rapido
            </h4>
            <div className="conductor-aviso-form">
              <input
                type="text"
                placeholder="Ej: Retraso por trafico en la Calle 7"
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarAviso()}
              />
              <button className="conductor-aviso-btn" onClick={enviarAviso}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </div>

          <div className="conductor-log">
            <h4 className="conductor-log-titulo">
              <FontAwesomeIcon icon={faClock} /> Actividad reciente
            </h4>
            <div className="conductor-log-lista">
              {log.length === 0 && (
                <p className="conductor-log-vacio">Sin eventos por ahora.</p>
              )}
              {[...log].reverse().map(l => (
                <div key={l.id} className={`conductor-log-item conductor-log--${l.tipo}`}>
                  <span className="conductor-log-dot" />
                  {l.msg}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  )
}
