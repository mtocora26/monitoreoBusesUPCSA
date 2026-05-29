import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import './Dashboard.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBus, faRoute, faClock,
  faLocationDot, faMap
} from '@fortawesome/free-solid-svg-icons'

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ buses: 0, rutas: 0, proximoBus: '--' })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarStats() {
      try {
        const [buses, rutas] = await Promise.all([
          api.get('/api/buses'),
          api.get('/api/rutas'),
        ])
        const busesActivos = buses.filter(b => b.estado === 'en_recorrido').length
        const rutasActivas = rutas.filter(r => r.activa).length
        setStats({
          buses: busesActivos,
          rutas: rutasActivas,
          proximoBus: '10 min',
        })
      } catch {
        // Backend no disponible aún — mostramos datos de ejemplo
        setStats({ buses: 5, rutas: 3, proximoBus: '10 min' })
      } finally {
        setCargando(false)
      }
    }
    cargarStats()
  }, [])

  return (
    <Layout titulo="Bienvenido al Sistema de Monitoreo de Rutas">
      <div className="dash">

        {/* Saludo */}
        <p className="dash-saludo">
          Hola, <strong>{usuario?.nombre || 'Usuario'}</strong> —
          <span className="dash-rol"> {usuario?.tipo_usuario}</span>
        </p>

        {/* Tarjetas métricas */}
{/* Tarjetas métricas */}
<section className="dash-seccion">
  <h3 className="dash-seccion-titulo">Resumen de transporte</h3>
  <div className="dash-tarjetas">
    <div className="dash-tarjeta">
      <div className="dash-tarjeta-icono">
        <FontAwesomeIcon icon={faBus} />
      </div>
      <div className="dash-tarjeta-info">
        <span className="dash-tarjeta-label">Buses disponibles</span>
        <span className="dash-tarjeta-valor">{cargando ? '...' : stats.buses}</span>
        <span className="dash-tarjeta-sub">En servicio</span>
      </div>
    </div>

    <div className="dash-tarjeta">
      <div className="dash-tarjeta-icono">
        <FontAwesomeIcon icon={faRoute} />
      </div>
      <div className="dash-tarjeta-info">
        <span className="dash-tarjeta-label">Rutas activas</span>
        <span className="dash-tarjeta-valor">{cargando ? '...' : stats.rutas}</span>
        <span className="dash-tarjeta-sub">Operativas</span>
      </div>
    </div>

    <div className="dash-tarjeta">
      <div className="dash-tarjeta-icono">
        <FontAwesomeIcon icon={faClock} />
      </div>
      <div className="dash-tarjeta-info">
        <span className="dash-tarjeta-label">Próximo bus</span>
        <span className="dash-tarjeta-valor">{cargando ? '...' : stats.proximoBus}</span>
        <span className="dash-tarjeta-sub">Llegada estimada</span>
      </div>
    </div>
  </div>
</section>

        {/* Mapa preview */}
        <section className="dash-seccion">
          <h3 className="dash-seccion-titulo">Mapa en tiempo real</h3>
          <div className="dash-mapa-preview">
            <div className="dash-mapa-ilustracion">
              <svg viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 110 Q80 60 130 80 Q180 100 220 50 Q250 20 270 30"
                  stroke="#1e6b2e" strokeWidth="3" strokeDasharray="8 4" fill="none"/>
                <circle cx="130" cy="80" r="6" fill="#1e6b2e"/>
                <text x="120" y="100" fontSize="22">🚌</text>
              </svg>
            </div>
            <button
              className="dash-mapa-btn"
              onClick={() => navigate('/mapa')}
            >
              Ver mapa completo
            </button>
          </div>
        </section>

        {/* Accesos rápidos */}
        <section className="dash-seccion">
          <h3 className="dash-seccion-titulo">Accesos rápidos</h3>
          <div className="dash-accesos">
            <button className="dash-acceso-btn" onClick={() => navigate('/rutas')}>
            <FontAwesomeIcon icon={faRoute} /> Ver rutas
            </button>
            <button className="dash-acceso-btn" onClick={() => navigate('/buses')}>
            <FontAwesomeIcon icon={faBus} /> Ver buses
            </button>
          </div>
        </section>

      </div>
    </Layout>
  )
}