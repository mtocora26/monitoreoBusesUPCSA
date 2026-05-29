import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBus, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import socket from '../services/socket'
import './Buses.css'

export default function Buses() {
  const [buses, setBuses] = useState([])
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get('/api/buses')
        setBuses(data.buses)
      } catch {
        console.error('Error cargando buses')
        setBuses([])
      } finally {
        setCargando(false)
      }
    }
    cargar()

    // Actualizar estado en tiempo real
    socket.on('bus:estado', ({ id_bus, estado }) => {
      setBuses(prev => prev.map(b =>
        b.id_bus === id_bus ? { ...b, estado } : b
      ))
    })

    return () => socket.off('bus:estado')
  }, [])

  function infoEstado(estado) {
    if (estado === 'en_recorrido')      return { texto: 'En recorrido',      clase: 'badge--verde' }
    if (estado === 'detenido')          return { texto: 'Detenido',          clase: 'badge--amarillo' }
    if (estado === 'fuera_de_servicio') return { texto: 'Fuera de servicio', clase: 'badge--rojo' }
    return { texto: 'Sin señal', clase: 'badge--gris' }
  }

  return (
    <Layout titulo="Buses disponibles">
      <div className="buses-page">
        <h2 className="buses-titulo">Buses disponibles</h2>

        {cargando ? (
          <p className="buses-cargando">Cargando buses...</p>
        ) : (
          <div className="buses-lista">
            {buses.map(bus => {
              const { texto, clase } = infoEstado(bus.estado)
              const activo = bus.estado !== 'fuera_de_servicio'
              return (
                <div
                  key={bus.id_bus}
                  className={`bus-item ${!activo ? 'bus-item--inactivo' : ''}`}
                  onClick={() => navigate(`/mapa?bus=${bus.id_bus}`)}
                >
                  <div className={`bus-icono ${!activo ? 'bus-icono--inactivo' : ''}`}>
                    <FontAwesomeIcon icon={faBus} />
                  </div>

                  <div className="bus-info">
                    <span className="bus-nombre">{bus.nombre}</span>
                    <span className="bus-ruta">Ruta: {bus.nombre_ruta}</span>
                    <span className={`bus-badge ${clase}`}>{texto}</span>
                    <span className="bus-eta">
                      Llegada estimada: {bus.eta || '--'}
                    </span>
                  </div>

                  <FontAwesomeIcon icon={faChevronRight} className="bus-flecha" />
                </div>
              )
            })}

            {buses.length === 0 && (
              <div className="buses-vacio">
                <FontAwesomeIcon icon={faBus} />
                <p>No hay buses disponibles</p>
              </div>
            )}
          </div>
        )}

        <button className="buses-btn-todos">
          Ver todos los buses
        </button>
      </div>
    </Layout>
  )
}