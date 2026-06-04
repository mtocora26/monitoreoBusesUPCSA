import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faLocationDot, faRoute, faBus,
  faBell, faUser, faUsers, faRightFromBracket,
  faMoon, faSun, faBars, faMap, faGear,
  faTriangleExclamation, faRotate, faCircleCheck
} from '@fortawesome/free-solid-svg-icons'
import logoUpc from '../../assets/logo-upc.png'
import api from '../../services/api'
import socket from '../../services/socket'
import './Layout.css'

const navEstudiante = [
  { path: '/inicio',         icono: faHouse,       label: 'Inicio' },
  { path: '/mapa',           icono: faLocationDot, label: 'Mapa en tiempo real' },
  { path: '/rutas',          icono: faRoute,       label: 'Rutas' },
  { path: '/buses',          icono: faBus,         label: 'Buses' },
  { path: '/notificaciones', icono: faBell,        label: 'Notificaciones' },
  { path: '/perfil',         icono: faUser,        label: 'Perfil' },
]

const navConductor = [
  { path: '/inicio',         icono: faHouse,  label: 'Inicio' },
  { path: '/conductor',      icono: faMap,    label: 'Mi recorrido' },
  { path: '/notificaciones', icono: faBell,   label: 'Notificaciones' },
  { path: '/perfil',         icono: faUser,   label: 'Perfil' },
]

const navAdmin = [
  { path: '/inicio',                     icono: faHouse,    label: 'Inicio' },
  { path: '/admin/usuarios',             icono: faUsers,    label: 'Usuarios' },
  { path: '/admin/buses',                icono: faBus,      label: 'Buses' },
  { path: '/admin/rutas',                icono: faRoute,    label: 'Rutas' },
]

function iconoNotif(tipo) {
  if (tipo === 'retraso')     return { icono: faTriangleExclamation, color: '#f57f17' }
  if (tipo === 'cambio_ruta') return { icono: faRotate,              color: '#1565c0' }
  return                             { icono: faCircleCheck,         color: '#1e6b2e' }
}

function formatearHace(fechaHora) {
  const diff = Math.floor((Date.now() - new Date(fechaHora)) / 60000)
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `${diff}m`
  return `${Math.floor(diff / 60)}h`
}

export default function Layout({ children, titulo, sinPadding = false }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [oscuro, setOscuro] = useState(() => localStorage.getItem('tema') === 'oscuro')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [perfilMenu, setPerfilMenu] = useState(false)
  const [notifPanel, setNotifPanel] = useState(false)
  const [notifs, setNotifs] = useState([])
  const perfilRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    document.body.dataset.tema = oscuro ? 'oscuro' : 'claro'
    localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro')
  }, [oscuro])

  // Cargar notificaciones al abrir panel
  useEffect(() => {
    if (!notifPanel) return
    api.get('/api/notificaciones')
      .then(data => {
        const lista = (data.notificaciones || []).slice(0, 6).map(n => ({
          ...n,
          hace: formatearHace(n.fecha_hora),
        }))
        setNotifs(lista)
      })
      .catch(() => setNotifs([]))
  }, [notifPanel])

  // Nuevas notificaciones en tiempo real
  useEffect(() => {
    socket.on('notificacion:nueva', (n) => {
      setNotifs(prev => [{ ...n, hace: 'Ahora' }, ...prev].slice(0, 6))
    })
    return () => socket.off('notificacion:nueva')
  }, [])

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handler(e) {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) setPerfilMenu(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifPanel(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const rol = usuario?.tipo_usuario
  const nav = rol === 'admin' ? navAdmin
             : rol === 'conductor'    ? navConductor
             : navEstudiante

  const iniciales = usuario?.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const sinLeer = notifs.length

  return (
    <div className="layout">
      {menuAbierto && (
        <div className="layout-overlay" onClick={() => setMenuAbierto(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar--abierto' : ''}`}>
        <div className="sidebar-logo">
          <img src={logoUpc} alt="UPC" />
        </div>

        <nav className="sidebar-nav">
          {nav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link--activo' : ''}`
              }
              onClick={() => setMenuAbierto(false)}
            >
              <FontAwesomeIcon icon={item.icono} className="sidebar-link-icono" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* Main */}
      <div className="layout-main">
        <header className="topbar">
          <button
            className="topbar-menu-btn"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <h2 className="topbar-titulo">{titulo || 'Sistema de Monitoreo'}</h2>

          <div className="topbar-acciones">
            <button
              className="topbar-btn"
              onClick={() => setOscuro(!oscuro)}
              title="Cambiar tema"
            >
              <FontAwesomeIcon icon={oscuro ? faSun : faMoon} />
            </button>

            {/* Botón notificaciones */}
            <div className="topbar-dropdown-wrap" ref={notifRef}>
              <button
                className="topbar-btn topbar-btn--notif"
                onClick={() => { setNotifPanel(v => !v); setPerfilMenu(false) }}
                title="Notificaciones"
              >
                <FontAwesomeIcon icon={faBell} />
                {sinLeer > 0 && <span className="topbar-badge">{sinLeer}</span>}
              </button>

              {notifPanel && (
                <div className="topbar-panel topbar-panel--notif">
                  <div className="topbar-panel-header">
                    <span>Notificaciones</span>
                    <button
                      className="topbar-panel-link"
                      onClick={() => { setNotifPanel(false); navigate('/notificaciones') }}
                    >
                      Ver todas
                    </button>
                  </div>
                  {notifs.length === 0 ? (
                    <p className="topbar-panel-vacio">Sin notificaciones recientes</p>
                  ) : (
                    <div className="topbar-notif-lista">
                      {notifs.map((n, i) => {
                        const { icono, color } = iconoNotif(n.tipo)
                        return (
                          <div key={n.id_notificacion || i} className="topbar-notif-item">
                            <FontAwesomeIcon icon={icono} style={{ color, fontSize: 14, flexShrink: 0 }} />
                            <div className="topbar-notif-info">
                              <span className="topbar-notif-titulo">
                                {n.tipo === 'retraso' ? 'Retraso' : 'Cambio de ruta'} — {n.nombre_ruta}
                              </span>
                              <span className="topbar-notif-msg">{n.mensaje}</span>
                            </div>
                            <span className="topbar-notif-hace">{n.hace}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Avatar con dropdown de perfil */}
            <div className="topbar-dropdown-wrap" ref={perfilRef}>
              <div
                className="topbar-avatar"
                onClick={() => { setPerfilMenu(v => !v); setNotifPanel(false) }}
                title={usuario?.nombre}
              >
                {iniciales}
              </div>

              {perfilMenu && (
                <div className="topbar-panel topbar-panel--perfil">
                  <div className="topbar-perfil-cabeza">
                    <div className="topbar-perfil-avatar">{iniciales}</div>
                    <div>
                      <div className="topbar-perfil-nombre">{usuario?.nombre}</div>
                      <div className="topbar-perfil-rol">{usuario?.tipo_usuario}</div>
                    </div>
                  </div>
                  <div className="topbar-panel-divider" />
                  <button className="topbar-panel-item" onClick={() => { setPerfilMenu(false); navigate('/perfil') }}>
                    <FontAwesomeIcon icon={faUser} />
                    Ver perfil
                  </button>
                  <button className="topbar-panel-item" onClick={() => { setPerfilMenu(false); navigate('/perfil') }}>
                    <FontAwesomeIcon icon={faGear} />
                    Configuración
                  </button>
                  <div className="topbar-panel-divider" />
                  <button className="topbar-panel-item topbar-panel-item--danger" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`layout-contenido${sinPadding ? ' layout-contenido--sin-padding' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
