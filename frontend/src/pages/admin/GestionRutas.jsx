import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faXmark, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import Layout from '../../components/shared/Layout'
import api from '../../services/api'
import './GestionRutas.css'

export default function GestionRutas() {
  const [rutas, setRutas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', activa: true })
  const [editandoId, setEditandoId] = useState(null)

  async function cargar() {
    try {
      const data = await api.get('/api/rutas')
      setRutas(data.rutas || [])
    } catch {
      console.error('Error cargando rutas')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  function abrirCrear() {
    setForm({ nombre: '', descripcion: '', activa: true })
    setEditandoId(null)
    setModal('crear')
  }

  function abrirEditar(ruta) {
    setForm({
      nombre: ruta.nombre,
      descripcion: ruta.descripcion || '',
      activa: ruta.activa,
    })
    setEditandoId(ruta.id_ruta)
    setModal('editar')
  }

  function cerrarModal() {
    setModal(null)
    setEditandoId(null)
  }

  async function guardar() {
    if (!form.nombre) return

    try {
      if (modal === 'crear') {
        await api.post('/api/rutas', form)
      } else {
        await api.patch(`/api/rutas/${editandoId}`, form)
      }
      cerrarModal()
      cargar()
    } catch (err) {
      alert(err.message || 'Error al guardar')
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Estás seguro de eliminar esta ruta?')) return
    try {
      await api.delete(`/api/rutas/${id}`)
      cargar()
    } catch (err) {
      alert(err.message || 'Error al eliminar')
    }
  }

  return (
    <Layout titulo="Gestión de rutas">
      <div className="gestion-page">
        <div className="gestion-header">
          <h2 className="gestion-titulo">Gestión de rutas</h2>
          <button className="gestion-btn-agregar" onClick={abrirCrear}>
            <FontAwesomeIcon icon={faPlus} /> Agregar ruta
          </button>
        </div>

        {cargando ? (
          <p className="gestion-cargando">Cargando rutas...</p>
        ) : (
          <>
            <div className="gestion-tabla-wrap">
              <table className="gestion-tabla">
                <thead>
                  <tr>
                    <th>Ruta</th>
                    <th>Paradas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.map(r => (
                    <tr key={r.id_ruta}>
                      <td className="celda-nombre">{r.nombre}</td>
                      <td>{r.num_paradas}</td>
                      <td>
                        <span className={`estado-badge ${r.activa ? 'estado--activo' : 'estado--inactivo'}`}>
                          {r.activa ? 'Activa' : 'Suspendida'}
                        </span>
                      </td>
                      <td className="celda-acciones">
                        <button className="btn-accion btn-accion--editar" onClick={() => abrirEditar(r)}>
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button className="btn-accion btn-accion--eliminar" onClick={() => eliminar(r.id_ruta)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="gestion-conteo">Mostrando 1 a {rutas.length} de {rutas.length} rutas</p>
          </>
        )}

        {modal && (
          <div className="modal-overlay" onClick={cerrarModal}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modal === 'crear' ? 'Agregar ruta' : 'Editar ruta'}</h3>
                <button className="modal-cerrar" onClick={cerrarModal}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-campo">
                  <label>Nombre de la ruta</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Centro"
                  />
                </div>
                <div className="modal-campo">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Descripción de la ruta"
                  />
                </div>
                <div className="modal-campo">
                  <label>Estado</label>
                  <select
                    value={form.activa ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, activa: e.target.value === 'true' })}
                  >
                    <option value="true">Activa</option>
                    <option value="false">Suspendida</option>
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