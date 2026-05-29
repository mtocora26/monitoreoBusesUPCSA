import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRoute, faMapLocationDot, faCircleCheck, faCircleMinus } from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import api from '../services/api'
import './Rutas.css'

const RUTAS_EJEMPLO = [
  { id_ruta: 1, nombre: 'Ruta 1 - Centro', num_paradas: 5, activa: true },
  { id_ruta: 2, nombre: 'Ruta 2 - Norte',  num_paradas: 8, activa: true },
  { id_ruta: 3, nombre: 'Ruta 3 - Sur',    num_paradas: 6, activa: false },
]

export default function Rutas() {
  const [rutas, setRutas] = useState([])
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.get('/api/rutas')
        setRutas(data)
      } catch {
        setRutas(RUTAS_EJEMPLO)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  function verEnMapa(idRuta) {
    navigate(`/mapa?ruta=${idRuta}`)
  }

  return (
    <Layout titulo="Rutas disponibles">
      <div className="rutas-page">
        <div className="rutas-header">
          <h2 className="rutas-titulo">Rutas disponibles</h2>
        </div>

        {cargando ? (
          <p className="rutas-cargando">Cargando rutas...</p>
        ) : (
          <div className="rutas-lista">
            {rutas.map(ruta => (
              <div key={ruta.id_ruta} className={`ruta-item ${!ruta.activa ? 'ruta-item--inactiva' : ''}`}>
                <div className="ruta-icono">
                  <FontAwesomeIcon icon={faRoute} />
                </div>

                <div className="ruta-info">
                  <span className="ruta-nombre">{ruta.nombre}</span>
                  <span className="ruta-detalle">Paradas: {ruta.num_paradas}</span>
                  <span className={`ruta-badge ${ruta.activa ? 'ruta-badge--activa' : 'ruta-badge--suspendida'}`}>
                    <FontAwesomeIcon icon={ruta.activa ? faCircleCheck : faCircleMinus} />
                    {ruta.activa ? 'Activa' : 'Suspendida'}
                  </span>
                </div>

                <button
                  className="ruta-btn-mapa"
                  onClick={() => verEnMapa(ruta.id_ruta)}
                  disabled={!ruta.activa}
                >
                  <FontAwesomeIcon icon={faMapLocationDot} />
                  Ver en mapa
                </button>
              </div>
            ))}

            {rutas.length === 0 && (
              <div className="rutas-vacio">
                <FontAwesomeIcon icon={faRoute} />
                <p>No hay rutas disponibles</p>
              </div>
            )}
          </div>
        )}

        <button className="rutas-btn-todas" onClick={() => {}}>
          Ver todas las rutas
        </button>
      </div>
    </Layout>
  )
}