import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass, faBus, faRoute,
  faCircleCheck, faCircleXmark, faClock,
  faLocationDot, faXmark
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import socket from '../services/socket'
import api from '../services/api'
import { calcularETA, formatearETA, distanciaKm } from '../utils/calcularETA'
import './MapaTiempoReal.css'

// ── Iconos ──────────────────────────────────────────────────

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

const iconoParadaInactiva = L.divIcon({
  className: '',
  html: `<div class="marcador-parada marcador-parada--inactiva"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const iconoParadaSeleccionada = L.divIcon({
  className: '',
  html: `<div class="marcador-parada marcador-parada--seleccionada"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// ── Control de vista del mapa ────────────────────────────────

function ControlMapa({ centro }) {
  const map = useMap()
  useEffect(() => {
    if (centro) map.setView(centro, map.getZoom())
  }, [centro, map])
  return null
}

// ── Umbral sin señal: 60 segundos ───────────────────────────

const UMBRAL_SIN_SENAL = 60000

// ── Componente principal ─────────────────────────────────────

export default function MapaTiempoReal() {
  const [buses, setBuses]                       = useState([])
  const [rutas, setRutas]                       = useState([])
  const [paradas, setParadas]                   = useState([])
  const [cargando, setCargando]                 = useState(true)
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)
  const [busSeleccionado, setBusSeleccionado]   = useState(null)
  const [paradaSeleccionada, setParadaSeleccionada] = useState(null)
  const [busqueda, setBusqueda]                 = useState('')
  const [filtro, setFiltro]                     = useState('todos')
  const [centro, setCentro]                     = useState([8.3086, -73.6194])

  const ultimaUbicacion = useRef({})
  const [searchParams] = useSearchParams()

  // ── Carga inicial ──────────────────────────────────────────

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [dataBuses, dataRutas] = await Promise.all([
          api.get('/api/buses/activos'),
          api.get('/api/rutas'),
        ])

        const listaBuses = Array.isArray(dataBuses)
          ? dataBuses
          : (dataBuses.buses || [])

        const listaRutas = Array.isArray(dataRutas)
          ? dataRutas
          : (dataRutas.rutas || [])

        setBuses(listaBuses)
        setRutas(listaRutas)

        listaBuses.forEach(b => {
          ultimaUbicacion.current[b.id_bus] = Date.now()
        })

        // Preseleccionar desde URL (?ruta=1 o ?bus=1)
        const rutaParam = searchParams.get('ruta')
        const busParam  = searchParams.get('bus')

        if (rutaParam) {
          const ruta = listaRutas.find(r => r.id_ruta === Number(rutaParam))
          if (ruta) await cargarParadas(ruta)
        }

        if (busParam) {
          const bus = listaBuses.find(b => b.id_bus === Number(busParam))
          if (bus) setBusSeleccionado(bus)
        }

      } catch (err) {
        console.error('Error cargando mapa:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, []) // eslint-disable-line

  // ── Socket.io ──────────────────────────────────────────────

  useEffect(() => {
    if (!socket.connected) socket.connect()

    rutas.filter(r => r.activa).forEach(r => {
      socket.emit('join:ruta', { id_ruta: r.id_ruta })
    })

    socket.on('bus:location', ({ id_bus, lat, lng }) => {
      ultimaUbicacion.current[id_bus] = Date.now()
      setBuses(prev => prev.map(b =>
        b.id_bus === id_bus ? { ...b, lat, lng } : b
      ))
      setBusSeleccionado(prev =>
        prev?.id_bus === id_bus ? { ...prev, lat, lng } : prev
      )
    })

    socket.on('bus:estado', ({ id_bus, estado }) => {
      setBuses(prev => prev.map(b =>
        b.id_bus === id_bus ? { ...b, estado } : b
      ))
      setBusSeleccionado(prev =>
        prev?.id_bus === id_bus ? { ...prev, estado } : prev
      )
    })

    return () => {
      socket.off('bus:location')
      socket.off('bus:estado')
    }
  }, [rutas])

  // ── Detector sin señal ─────────────────────────────────────

  useEffect(() => {
    const intervalo = setInterval(() => {
      const ahora = Date.now()
      setBuses(prev => prev.map(b => {
        const ultimo = ultimaUbicacion.current[b.id_bus]
        if (ultimo && (ahora - ultimo) > UMBRAL_SIN_SENAL &&
            b.estado !== 'fuera_de_servicio' && b.estado !== 'sin_senal') {
          return { ...b, estado: 'sin_senal' }
        }
        return b
      }))
    }, 10000)
    return () => clearInterval(intervalo)
  }, [])

  // ── Cargar paradas de una ruta ─────────────────────────────

  async function cargarParadas(ruta) {
    setRutaSeleccionada(ruta)
    setBusSeleccionado(null)
    setParadaSeleccionada(null)
    try {
      const data = await api.get(`/api/paradas?ruta_id=${ruta.id_ruta}`)
      const lista = Array.isArray(data) ? data : (data.paradas || [])
      setParadas(lista)
      if (lista.length > 0) setCentro([lista[0].lat, lista[0].lng])
    } catch (err) {
      console.error('Error cargando paradas:', err)
      setParadas([])
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  function colorEstado(estado) {
    if (estado === 'en_recorrido') return '#1e6b2e'
    if (estado === 'detenido')     return '#f39c12'
    if (estado === 'sin_senal')    return '#95a5a6'
    return '#e74c3c'
  }

  function textoEstado(estado) {
    if (estado === 'en_recorrido') return 'En recorrido'
    if (estado === 'detenido')     return 'Detenido'
    if (estado === 'sin_senal')    return 'Sin señal'
    return 'Fuera de servicio'
  }

  // ── Filtros ────────────────────────────────────────────────

  const busesFiltrados = buses.filter(b => {
    const texto = busqueda.toLowerCase()
    const coincideBusqueda = !texto ||
      (b.nombre || '').toLowerCase().includes(texto) ||
      (b.nombre_ruta || '').toLowerCase().includes(texto)
    const coincideFiltro = filtro === 'todos' || b.id_bus === parseInt(filtro)
    return coincideBusqueda && coincideFiltro
  })

  // ── Polilínea ──────────────────────────────────────────────

  const puntosRuta = paradas
    .filter(p => p.lat && p.lng)
    .sort((a, b) => (a.orden || 0) - (b.orden || 0))
    .map(p => [p.lat, p.lng])

  // ── ETA parada seleccionada (#12) ──────────────────────────

  const etaParada = paradaSeleccionada
    ? calcularETA(paradaSeleccionada, buses)
    : null

  // ── Render ─────────────────────────────────────────────────

  if (cargando) {
    return (
      <Layout titulo="Mapa en tiempo real">
        <div className="mapa-cargando">
          <div className="mapa-cargando-spinner" />
          <p>Cargando mapa...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Mapa en tiempo real">
      <div className="mapa-page">

        {/* ── Barra superior ── */}
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

          {/* Selector de ruta (#14) */}
          <select
            className="mapa-filtro"
            value={rutaSeleccionada?.id_ruta || ''}
            onChange={e => {
              const id = Number(e.target.value)
              if (!id) {
                setRutaSeleccionada(null)
                setParadas([])
                setParadaSeleccionada(null)
                return
              }
              const ruta = rutas.find(r => r.id_ruta === id)
              if (ruta) cargarParadas(ruta)
            }}
          >
            <option value="">Todos los buses</option>
            {rutas.map(r => (
              <option key={r.id_ruta} value={r.id_ruta} disabled={!r.activa}>
                {r.nombre}{!r.activa ? ' (Suspendida)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* ── Contenido: mapa + panel ── */}
        <div className="mapa-contenido">

          {/* ── Mapa Leaflet (#09) ── */}
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
              <ControlMapa centro={centro} />

              {/* Polilínea de la ruta (#14) */}
              {puntosRuta.length > 1 && (
                <Polyline
                  positions={puntosRuta}
                  color="#1e6b2e"
                  weight={4}
                  dashArray="10 6"
                />
              )}

              {/* Paradas (#10) */}
              {paradas.map(p => (
                <Marker
                  key={p.id_parada}
                  position={[p.lat, p.lng]}
                  icon={
                    paradaSeleccionada?.id_parada === p.id_parada
                      ? iconoParadaSeleccionada
                      : p.activa === false || p.activa === 0
                        ? iconoParadaInactiva
                        : iconoParada
                  }
                  eventHandlers={{ click: () => {
                    setParadaSeleccionada(p)
                    setBusSeleccionado(null)
                  }}}
                >
                  <Popup>
                    <strong>{p.nombre}</strong><br />
                    <span style={{ fontSize: 12, color: p.activa ? '#1e6b2e' : '#aaa' }}>
                      {p.activa === false || p.activa === 0 ? 'Inactiva' : 'Activa'}
                    </span>
                  </Popup>
                </Marker>
              ))}

              {/* Buses (#09) */}
              {busesFiltrados
                .filter(b => b.lat && b.lng)
                .map(b => (
                  <Marker
                    key={b.id_bus}
                    position={[b.lat, b.lng]}
                    icon={iconoBus}
                    eventHandlers={{ click: () => {
                      setBusSeleccionado(b)
                      setParadaSeleccionada(null)
                    }}}
                  />
                ))
              }
            </MapContainer>
          </div>

          {/* ── Panel lateral ── */}
          <div className="mapa-panel">

            {/* Info bus seleccionado (#11) */}
            {busSeleccionado && (
              <div className="mapa-info-bus">
                <h3 className="mapa-info-titulo">Información del bus</h3>

                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Bus:</span>
                  <span className="mapa-info-valor">{busSeleccionado.nombre}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Placa:</span>
                  <span className="mapa-info-valor">{busSeleccionado.placa || '—'}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Ruta:</span>
                  <span className="mapa-info-valor">{busSeleccionado.nombre_ruta || '—'}</span>
                </div>
                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Conductor:</span>
                  <span className="mapa-info-valor">{busSeleccionado.nombre_conductor || '—'}</span>
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

                {/* Próxima parada con ETA */}
                {paradas.length > 0 && busSeleccionado.lat && (
                  <div className="mapa-info-fila">
                    <span className="mapa-info-label">Próxima parada:</span>
                    <span className="mapa-info-valor">
                      {(() => {
                        const activas = paradas.filter(p => p.activa !== false && p.activa !== 0 && p.lat && p.lng)
                        if (!activas.length) return '—'
                        let cercana = activas[0], menor = Infinity
                        for (const p of activas) {
                          const d = distanciaKm(busSeleccionado.lat, busSeleccionado.lng, p.lat, p.lng)
                          if (d < menor) { menor = d; cercana = p }
                        }
                        const eta = calcularETA(cercana, [busSeleccionado])
                        return `${cercana.nombre} — ${formatearETA(eta.etaMinutos)}`
                      })()}
                    </span>
                  </div>
                )}

                <button className="mapa-info-btn" onClick={() => setBusSeleccionado(null)}>
                  Cerrar
                </button>
              </div>
            )}

            {/* Info parada seleccionada (#12) */}
            {paradaSeleccionada && !busSeleccionado && (
              <div className="mapa-info-bus">
                <h3 className="mapa-info-titulo">
                  <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: 8 }} />
                  {paradaSeleccionada.nombre}
                </h3>

                <div className="mapa-info-fila">
                  <span className="mapa-info-label">Estado:</span>
                  <span
                    className="mapa-info-badge"
                    style={{ background: paradaSeleccionada.activa === false || paradaSeleccionada.activa === 0 ? '#95a5a6' : '#1e6b2e' }}
                  >
                    {paradaSeleccionada.activa === false || paradaSeleccionada.activa === 0 ? 'Inactiva' : 'Activa'}
                  </span>
                </div>

                {etaParada?.busCercano ? (
                  <>
                    <div className="mapa-info-fila">
                      <span className="mapa-info-label">Bus más cercano:</span>
                      <span className="mapa-info-valor">{etaParada.busCercano.nombre}</span>
                    </div>
                    <div className="mapa-info-fila">
                      <span className="mapa-info-label">Distancia:</span>
                      <span className="mapa-info-valor">{etaParada.distanciaKmVal} km</span>
                    </div>
                    <div className="mapa-info-fila">
                      <span className="mapa-info-label">
                        <FontAwesomeIcon icon={faClock} style={{ marginRight: 6 }} />
                        Llegada estimada:
                      </span>
                      <span className="mapa-info-valor" style={{ color: '#1e6b2e', fontSize: 18, fontWeight: 700 }}>
                        {etaParada.etaMinutos > 30 ? '> 30 min' : formatearETA(etaParada.etaMinutos)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--texto-suave)', fontSize: 13, marginTop: 8 }}>
                    Sin buses activos en esta ruta
                  </p>
                )}

                <button className="mapa-info-btn" onClick={() => setParadaSeleccionada(null)}>
                  Cerrar
                </button>
              </div>
            )}

            {/* Panel vacío — lista de buses (#13) */}
            {!busSeleccionado && !paradaSeleccionada && (
              <div className="mapa-panel-vacio">
                <FontAwesomeIcon icon={faBus} className="mapa-panel-icono" />
                <p>
                  {busesFiltrados.length > 0
                    ? `${busesFiltrados.filter(b => b.lat && b.lng).length} bus(es) en el mapa`
                    : 'No hay buses activos'
                  }
                </p>
                <p style={{ fontSize: 12, marginTop: 4 }}>
                  Haz clic en un bus o parada para ver su información
                </p>
                {/* Lista rápida de buses activos */}
                {busesFiltrados.filter(b => b.lat && b.lng).map(b => (
                  <div
                    key={b.id_bus}
                    onClick={() => setBusSeleccionado(b)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px',
                      marginTop: 8, background: 'var(--fondo)', borderRadius: 8,
                      cursor: 'pointer', border: '1px solid var(--borde)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{b.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{b.nombre_ruta || 'Sin ruta'}</div>
                    </div>
                    <span
                      style={{
                        background: colorEstado(b.estado), color: '#fff',
                        fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600
                      }}
                    >
                      {textoEstado(b.estado)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}