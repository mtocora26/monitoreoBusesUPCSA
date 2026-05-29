import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faBus, faRoute,
  faCircleCheck, faCircleXmark, faClock
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import socket from '../services/socket'
import api from '../services/api'
import './MapaTiempoReal.css'

// Icono personalizado del bus
const iconoBus = L.divIcon({
  className: '',
  html: `<div class="marcador-bus">🚌</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const iconoParada = L.divIcon({
  className: '',
  html: `<div class="marcador-parada"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// Componente para mover el mapa cuando cambia el centro
function ControlMapa({ centro }) {
  const map = useMap()
  useEffect(() => {
    if (centro) map.setView(centro, map.getZoom())
  }, [centro, map])
  return null
}

// Datos de ejemplo mientras el backend no está listo
const BUSES_EJEMPLO = [
  {
    id_bus: 1,
    nombre: 'Bus #01',
    placa: 'ABC-123',
    nombre_ruta: 'Centro',
    estado: 'en_recorrido',
    lat: 8.3086,
    lng: -73.6194,
    proxima_parada: 'Bloque 3',
    eta: '8 min',
  },
  {
    id_bus: 2,
    nombre: 'Bus #02',
    placa: 'DEF-456',
    nombre_ruta: 'Norte',
    estado: 'detenido',
    lat: 8.3120,
    lng: -73.6150,
    proxima_parada: 'Entrada Norte',
    eta: '12 min',
  },
]

const RUTA_EJEMPLO = [
  [8.3050, -73.6230],
  [8.3070, -73.6210],
  [8.3086, -73.6194],
  [8.3110, -73.6170],
  [8.3130, -73.6140],
]

const PARADAS_EJEMPLO = [
  { id: 1, nombre: 'Punto de inicio', lat: 8.3050, lng: -73.6230 },
  { id: 2, nombre: 'Bloque 3',        lat: 8.3086, lng: -73.6194 },
  { id: 3, nombre: 'Biblioteca',      lat: 8.3110, lng: -73.6170 },
  { id: 4, nombre: 'Entrada Norte',   lat: 8.3130, lng: -73.6140 },
]

export default function MapaTiempoReal() {
  const [buses, setBuses] = useState(BUSES_EJEMPLO)
  const [busSeleccionado, setBusSeleccionado] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const centro = [8.3086, -73.6194]

  // Escuchar actualizaciones de socket
  useEffect(() => {
    socket.on('bus:location', ({ id_bus, lat, lng }) => {
      setBuses(prev => prev.map(b =>
        b.id_bus === id_bus ? { ...b, lat, lng } : b
      ))
    })

    socket.on('bus:estado', ({ id_bus, estado }) => {
      setBuses(prev => prev.map(b =>
        b.id_bus === id_bus ? { ...b, estado } : b
      ))
    })

    return () => {
      socket.off('bus:location')
      socket.off('bus:estado')
    }
  }, [])

  const busesFiltrados = buses.filter(b => {
    const coincideBusqueda = b.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      b.nombre_ruta.toLowerCase().includes(busqueda.toLowerCase())
    const coincideFiltro = filtro === 'todos' || b.id_bus === parseInt(filtro)
    return coincideBusqueda && coincideFiltro
  })

  function colorEstado(estado) {
    if (estado === 'en_recorrido') return '#1e6b2e'
    if (estado === 'detenido') return '#f39c12'
    return '#e74c3c'
  }

  function textoEstado(estado) {
    if (estado === 'en_recorrido') return 'En recorrido'
    if (estado === 'detenido') return 'Detenido'
    return 'Fuera de servicio'
  }

  return (
    <Layout titulo="Mapa en tiempo real">
      <div className="mapa-page">

        {/* Barra superior */}
        <div className="mapa-toolbar">
          <div className="mapa-buscador">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="mapa-buscador-icono" />
            <input
              type="text"
              placeholder="Buscar ruta o bus"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className="mapa-filtro"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          >
            <option value="todos">Todos los buses</option>
            {buses.map(b => (
              <option key={b.id_bus} value={b.id_bus}>{b.nombre}</option>
            ))}
          </select>
        </div>

        {/* Contenido: mapa + panel */}
        <div className="mapa-contenido">

          {/* Mapa Leaflet */}
          <div className="mapa-leaflet">
            <MapContainer
              center={centro}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap"
              />

              {/* Polilínea de ruta */}
              <Polyline
                positions={RUTA_EJEMPLO}
                color="#1e6b2e"
                weight={4}
                dashArray="10 6"
              />

              {/* Paradas */}
              {PARADAS_EJEMPLO.map(p => (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={iconoParada}>
                  <Popup>{p.nombre}</Popup>
                </Marker>
              ))}

              {/* Buses */}
              {busesFiltrados.map(b => (
                <Marker
                  key={b.id_bus}
                  position={[b.lat, b.lng]}
                  icon={iconoBus}
                  eventHandlers={{ click: () => setBusSeleccionado(b) }}
                />
              ))}
            </MapContainer>
          </div>

          {/* Panel info */}
          <div className="mapa-panel">
            {busSeleccionado ? (
              <div className="mapa-info-bus">
                <h3 className="mapa-info-titulo">Información del bus</h3>

                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Bus:</span>
                  <span className="mapa-info-valor">{busSeleccionado.nombre}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Ruta:</span>
                  <span className="mapa-info-valor">{busSeleccionado.nombre_ruta}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Estado:</span>
                  <span
                    className="mapa-info-badge"
                    style={{ background: colorEstado(busSeleccionado.estado) }}
                  >
                    {textoEstado(busSeleccionado.estado)}
                  </span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Próxima parada:</span>
                  <span className="mapa-info-valor">{busSeleccionado.proxima_parada}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Llegada estimada:</span>
                  <span className="mapa-info-valor">{busSeleccionado.eta}</span>
                </div>

                <button
                  className="mapa-info-btn"
                  onClick={() => setBusSeleccionado(null)}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="mapa-panel-vacio">
                <FontAwesomeIcon icon={faBus} className="mapa-panel-icono" />
                <p>Haz clic en un bus para ver su información</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  )
}