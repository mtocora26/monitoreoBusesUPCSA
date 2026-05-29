import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell, faTriangleExclamation,
  faRotate, faCircleCheck, faCheckDouble
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import socket from '../services/socket'
import './Notificaciones.css'

const NOTIFICACIONES_EJEMPLO = [
  {
    id: 1,
    titulo: 'Retraso en Ruta 2',
    mensaje: 'La ruta 2 presenta un retraso aproximado de 10 minutos.',
    tipo: 'retraso',
    leida: false,
    hace: 'Hace 5 min',
  },
  {
    id: 2,
    titulo: 'Cambio de ruta en Bus #03',
    mensaje: 'El bus #03 tomará una ruta alterna por obras en la vía.',
    tipo: 'cambio_ruta',
    leida: false,
    hace: 'Hace 30 min',
  },
  {
    id: 3,
    titulo: 'Ruta 1 en horario normal',
    mensaje: 'La ruta 1 se encuentra operando con normalidad.',
    tipo: 'normal',
    leida: true,
    hace: 'Hace 1 h',
  },
]

function infoTipo(tipo) {
  if (tipo === 'retraso')     return { icono: faTriangleExclamation, clase: 'notif-icono--amarillo' }
  if (tipo === 'cambio_ruta') return { icono: faRotate,              clase: 'notif-icono--azul' }
  return                             { icono: faCircleCheck,         clase: 'notif-icono--verde' }
}

export default function Notificaciones() {
  const [notifs, setNotifs] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get('/api/notificaciones')
        setNotifs(data)
      } catch {
        setNotifs(NOTIFICACIONES_EJEMPLO)
      } finally {
        setCargando(false)
      }
    }
    cargar()

    // Nuevas notificaciones en tiempo real
    socket.on('notificacion:nueva', (notif) => {
      setNotifs(prev => [{ ...notif, leida: false, hace: 'Ahora' }, ...prev])
    })

    return () => socket.off('notificacion:nueva')
  }, [])

  function marcarTodasLeidas() {
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
  }

  function marcarLeida(id) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const sinLeer = notifs.filter(n => !n.leida).length

  return (
    <Layout titulo="Notificaciones">
      <div className="notifs-page">

        <div className="notifs-header">
          <div className="notifs-titulo-wrap">
            <h2 className="notifs-titulo">Notificaciones</h2>
            {sinLeer > 0 && (
              <span className="notifs-badge">{sinLeer}</span>
            )}
          </div>
          <button className="notifs-btn-leer" onClick={marcarTodasLeidas}>
            <FontAwesomeIcon icon={faCheckDouble} />
            Marcar todas como leídas
          </button>
        </div>

        {cargando ? (
          <p className="notifs-cargando">Cargando notificaciones...</p>
        ) : (
          <div className="notifs-lista">
            {notifs.map(notif => {
              const { icono, clase } = infoTipo(notif.tipo)
              return (
                <div
                  key={notif.id}
                  className={`notif-item ${!notif.leida ? 'notif-item--nueva' : ''}`}
                  onClick={() => marcarLeida(notif.id)}
                >
                  <div className={`notif-icono ${clase}`}>
                    <FontAwesomeIcon icon={icono} />
                  </div>

                  <div className="notif-info">
                    <span className="notif-titulo">{notif.titulo}</span>
                    <span className="notif-mensaje">{notif.mensaje}</span>
                  </div>

                  <span className="notif-hace">{notif.hace}</span>
                </div>
              )
            })}

            {notifs.length === 0 && (
              <div className="notifs-vacio">
                <FontAwesomeIcon icon={faBell} />
                <p>No hay notificaciones</p>
              </div>
            )}
          </div>
        )}

        <button className="notifs-btn-todas">
          Ver todas las notificaciones
        </button>
      </div>
    </Layout>
  )
}