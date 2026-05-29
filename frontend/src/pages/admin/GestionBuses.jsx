import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faXmark, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import api from '../../services/api'
import './GestionBuses.css'

export default function GestionBuses() {
  const [buses, setBuses] = useState([])
  const [rutas, setRutas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nombre: '', placa: '', id_ruta: '', estado: 'en_recorrido' })
  const [editandoId, setEditandoId] = useState(null)

  async function cargar() {
    try {
      const [dataBuses, dataRutas] = await Promise.all([
        api.get('/api/buses'),
        api.get('/api/rutas'),
      ])
      setBuses(dataBuses.buses || [])
      setRutas(dataRutas.rutas || [])
    } catch {
      console.error('Error cargando datos')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  function abrirCrear() {
    setForm({ nombre: '', placa: '', id_ruta: '', estado: 'en_recorrido' })
    setEditandoId(null)
    setModal('crear')
  }

  function abrirEditar(bus) {
    setForm({
      nombre: bus.nombre,
      placa: bus.placa,
      id_ruta: bus.id_ruta || '',
      estado: bus.estado,
    })
    setEditandoId(bus.id_bus)
    setModal('editar')
  }

  function cerrarModal() {
    setModal(null)
    setEditandoId(null)
  }

  async function guardar() {
    if (!form.nombre || !form.placa) return

    try {
      if (modal === 'crear') {
        await api.post('/api/buses', form)
      } else {
        await api.patch(`/api/buses/${editandoId}`, form)
      }
      cerrarModal()
      cargar()
    } catch (err) {
      alert(err.message || 'Error al guardar')
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Estás seguro de eliminar este bus?')) return
    try {
      await api.delete(`/api/buses/${id}`)
      cargar()
    } catch (err) {
      alert(err.message || 'Error al eliminar')
    }
  }

  function textoEstado(estado) {
    if (estado === 'en_recorrido') return 'En servicio'
    if (estado === 'detenido') return 'Detenido'
    return 'Fuera de servicio'
  }

  function claseEstado(estado) {
    if (estado === 'en_recorrido') return 'estado--activo'
    if (estado === 'detenido') return 'estado--detenido'
    return 'estado--inactivo'
  }

  return (
    <Layout titulo="Gestión de buses">
      <div className="gestion-page">
        <div className="gestion-header">
          <h2 className="gestion-titulo">Gestión de buses</h2>
          <button className="gestion-btn-agregar" onClick={abrirCrear}>
            <FontAwesomeIcon icon={faPlus} /> Agregar bus
          </button>
        </div>

        {cargando ? (
          <p className="gestion-cargando">Cargando buses...</p>
        ) : (
          <>
            <div className="gestion-tabla-wrap">
              <table className="gestion-tabla">
                <thead>
                  <tr>
                    <th>Bus</th>
                    <th>Ruta asignada</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map(b => (
                    <tr key={b.id_bus}>
                      <td className="celda-nombre">{b.nombre}</td>
                      <td>{b.nombre_ruta}</td>
                      <td>
                        <span className={`estado-badge ${claseEstado(b.estado)}`}>
                          {textoEstado(b.estado)}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <button className="btn-accion btn-accion--editar" onClick={() => abrirEditar(b)}>
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button className="btn-accion btn-accion--eliminar" onClick={() => eliminar(b.id_bus)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="gestion-conteo">Mostrando 1 a {buses.length} de {buses.length} buses</p>
          </>
        )}

        {modal && (
          <div className="modal-overlay" onClick={cerrarModal}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modal === 'crear' ? 'Agregar bus' : 'Editar bus'}</h3>
                <button className="modal-cerrar" onClick={cerrarModal}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-campo">
                  <label>Nombre del bus</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Bus #05"
                  />
                </div>
                <div className="modal-campo">
                  <label>Placa</label>
                  <input
                    type="text"
                    value={form.placa}
                    onChange={e => setForm({ ...form, placa: e.target.value })}
                    placeholder="Ej: ABC-123"
                  />
                </div>
                <div className="modal-campo">
                  <label>Ruta asignada</label>
                  <select
                    value={form.id_ruta}
                    onChange={e => setForm({ ...form, id_ruta: e.target.value })}
                  >
                    <option value="">Seleccionar ruta</option>
                    {rutas.map(r => (
                      <option key={r.id_ruta} value={r.id_ruta}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-campo">
                  <label>Estado</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm({ ...form, estado: e.target.value })}
                  >
                    <option value="en_recorrido">En servicio</option>
                    <option value="detenido">Detenido</option>
                    <option value="fuera_de_servicio">Fuera de servicio</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button className="modal-btn modal-btn--cancelar" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button className="modal-btn modal-btn--guardar" onClick={guardar}>
                  <FontAwesomeIcon icon={faFloppyDisk} /> Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}