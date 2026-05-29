import { useEffect, useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBus, faRoute, faLocationDot, faClock,
  faPlay, faStop, faPaperPlane, faSignal,
  faCircleCheck, faCirclePause, faCircleXmark
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import api from '../../services/api'
import logoBus from '../../assets/logo-bus.jpeg'
import './MiRecorrido.css'

export default function MiRecorrido() {
  const [busInfo, setBusInfo] = useState(null)
  const [enRecorrido, setEnRecorrido] = useState(false)
  const [estado, setEstado] = useState('en_recorrido')
  const [gps, setGps] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [log, setLog] = useState([])
  const watchRef = useRef(null)

  // Cargar bus asignado
  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get('/api/buses/mi-bus')
        if (data.bus) setBusInfo(data.bus)
      } catch {
        // Datos de ejemplo
        setBusInfo({
          nombre: 'Bus #01',
          placa: 'ABC-123',
          nombre_ruta: 'Centro',
          proxima_parada: 'Bloque 3',
          eta: '6 min',
        })
      }
    }
    cargar()
  }, [])

  function iniciarRecorrido() {
    if (!navigator.geolocation) {
      agregarLog('GPS no disponible en este dispositivo', 'error')
      return
    }

    setEnRecorrido(true)
    setEstado('en_recorrido')
    agregarLog('Recorrido iniciado', 'ok')

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setGps({ lat, lng })
        enviarUbicacion(lat, lng)
      },
      (err) => {
        agregarLog(`Error GPS: ${err.message}`, 'error')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    )

    // WakeLock para mantener pantalla
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {})
    }
  }

  function finalizarRecorrido() {
    setEnRecorrido(false)
    setEstado('fuera_de_servicio')
    setGps(null)

    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }

    agregarLog('Recorrido finalizado', 'ok')
  }

  async function enviarUbicacion(lat, lng) {
    const hora = new Date().toLocaleTimeString()
    try {
      await api.post('/api/ubicacion', { lat, lng })
      agregarLog(`${hora} — lat: ${lat.toFixed(5)}, lng: ${lng.toFixed(5)}`, 'ok')
    } catch {
      agregarLog(`${hora} — Error al enviar ubicación`, 'error')
    }
  }

  async function enviarAviso() {
    if (!mensaje.trim()) return
    try {
      await api.post('/api/notificaciones', {
        mensaje,
        tipo: 'retraso',
      })
      agregarLog('Aviso enviado correctamente', 'ok')
    } catch {
      agregarLog('Aviso enviado (simulado)', 'ok')
    }
    setMensaje('')
  }

  function agregarLog(msg, tipo) {
    setLog(prev => [...prev.slice(-20), { msg, tipo, id: Date.now() }])
  }

  function infoEstado(est) {
    if (est === 'en_recorrido') return { texto: 'En recorrido', icono: faCircleCheck, clase: 'conductor-badge--verde' }
    if (est === 'detenido') return { texto: 'Detenido', icono: faCirclePause, clase: 'conductor-badge--amarillo' }
    return { texto: 'Fuera de servicio', icono: faCircleXmark, clase: 'conductor-badge--rojo' }
  }

  const estadoInfo = infoEstado(estado)

  return (
    <Layout titulo="Mi recorrido">
      <div className="conductor-page">

        <h2 className="conductor-titulo">Mi recorrido</h2>

        {/* Info del bus + ilustración */}
        <div className="conductor-top">
          <div className="conductor-ilustracion">
            <img src={logoBus} alt="Bus" />
          </div>

          <div className="conductor-info-card">
            <div className="conductor-info-fila">
              <span className="conductor-info-label">
                <FontAwesomeIcon icon={faBus} /> Bus asignado
              </span>
              <span className="conductor-info-valor">{busInfo?.nombre || '—'}</span>
            </div>
            <div className="conductor-info-fila">
              <span className="conductor-info-label">
                <FontAwesomeIcon icon={faRoute} /> Ruta
              </span>
              <span className="conductor-info-valor">{busInfo?.nombre_ruta || '—'}</span>
            </div>
            <div className="conductor-info-fila">
              <span className="conductor-info-label">
                <FontAwesomeIcon icon={faSignal} /> Estado actual
              </span>
              <span className={`conductor-badge ${estadoInfo.clase}`}>
                <FontAwesomeIcon icon={estadoInfo.icono} /> {estadoInfo.texto}
              </span>
            </div>
            <div className="conductor-info-fila">
              <span className="conductor-info-label">
                <FontAwesomeIcon icon={faLocationDot} /> Próxima parada
              </span>
              <span className="conductor-info-valor">{busInfo?.proxima_parada || '—'}</span>
            </div>
            <div className="conductor-info-fila">
              <span className="conductor-info-label">
                <FontAwesomeIcon icon={faClock} /> Llegada estimada
              </span>
              <span className="conductor-info-valor">{busInfo?.eta || '—'}</span>
            </div>
          </div>
        </div>

        {/* GPS */}
        {gps && (
          <div className="conductor-gps">
            <span className="conductor-gps-indicador" />
            GPS activo — lat: {gps.lat.toFixed(5)}, lng: {gps.lng.toFixed(5)}
          </div>
        )}

        {/* Botones recorrido */}
        <div className="conductor-botones">
          <button
            className="conductor-btn conductor-btn--iniciar"
            onClick={iniciarRecorrido}
            disabled={enRecorrido}
          >
            <FontAwesomeIcon icon={faPlay} /> Iniciar recorrido
          </button>
          <button
            className="conductor-btn conductor-btn--finalizar"
            onClick={finalizarRecorrido}
            disabled={!enRecorrido}
          >
            <FontAwesomeIcon icon={faStop} /> Finalizar recorrido
          </button>
        </div>

        {/* Enviar aviso */}
        <div className="conductor-aviso">
          <h3 className="conductor-aviso-titulo">Enviar aviso</h3>
          <div className="conductor-aviso-form">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviarAviso()}
            />
            <button className="conductor-aviso-btn" onClick={enviarAviso}>
              <FontAwesomeIcon icon={faPaperPlane} /> Enviar
            </button>
          </div>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="conductor-log">
            <h4 className="conductor-log-titulo">Registro de actividad</h4>
            <div className="conductor-log-lista">
              {log.map(l => (
                <div key={l.id} className={`conductor-log-item conductor-log--${l.tipo}`}>
                  {l.tipo === 'ok' ? '✓' : '✗'} {l.msg}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}