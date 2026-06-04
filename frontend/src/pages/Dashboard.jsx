import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import './Dashboard.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBus, faRoute, faClock } from '@fortawesome/free-solid-svg-icons'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'

const iconoBusMini = L.divIcon({
  className: '',
  html: `<div style="font-size:20px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3))">🚌</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ buses: 0, rutas: 0, proximoBus: '--' })
  const [busesActivos, setBusesActivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [backendOk, setBackendOk] = useState(false)

  useEffect(() => {
    async function cargarStats() {
      try {
        const [buses, rutas] = await Promise.all([
          api.get('/api/buses'),
          api.get('/api/rutas'),
        ])
        const activos = buses.filter(b => b.estado === 'en_recorrido')
        const rutasActivas = rutas.filter(r => r.activa).length
        setBusesActivos(activos.filter(b => b.lat && b.lng))
        setStats({
          buses: activos.length,
          rutas: rutasActivas,
          proximoBus: activos.length > 0 ? '~10 min' : '—',
        })
        setBackendOk(true)
      } catch {
        setStats({ buses: 0, rutas: 0, proximoBus: '—' })
        setBackendOk(false)
      } finally {
        setCargando(false)
      }
    }
    cargarStats()
  }, [])

  return (
    <Layout titulo="Sistema de Monitoreo de Rutas">
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
          <div className="dash-mapa-preview" onClick={() => navigate('/mapa')} style={{ cursor: 'pointer' }}>
            <MapContainer
              center={[8.3086, -73.6194]}
              zoom={14}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              attributionControl={false}
              className="dash-mapa-leaflet"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {busesActivos.map(b => (
                <Marker key={b.id_bus} position={[b.lat, b.lng]} icon={iconoBusMini} />
              ))}
            </MapContainer>
            <div className="dash-mapa-overlay">
              {!backendOk && (
                <span className="dash-mapa-offline">Sin conexión al servidor</span>
              )}
              <button className="dash-mapa-btn" onClick={() => navigate('/mapa')}>
                Ver mapa completo
              </button>
            </div>
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