import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faLocationDot, faRoute, faBus,
  faBell, faUser, faUsers, faRightFromBracket,
  faMoon, faSun, faBars, faMap
} from '@fortawesome/free-solid-svg-icons'
import logoUpc from '../../assets/logo-upc.png'
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
  { path: '/inicio',         icono: faHouse,  label: 'Inicio' },
  { path: '/admin/usuarios', icono: faUsers,  label: 'Usuarios' },
  { path: '/admin/buses',    icono: faBus,    label: 'Buses' },
  { path: '/admin/rutas',    icono: faRoute,  label: 'Rutas' },
]

export default function Layout({ children, titulo }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [oscuro, setOscuro] = useState(() => localStorage.getItem('tema') === 'oscuro')
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    document.body.dataset.tema = oscuro ? 'oscuro' : 'claro'
    localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro')
  }, [oscuro])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const rol = usuario?.tipo_usuario
  const nav = rol === 'administrador' ? navAdmin
             : rol === 'conductor'    ? navConductor
             : navEstudiante

  const iniciales = usuario?.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

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
            <button
              className="topbar-btn"
              onClick={() => navigate('/notificaciones')}
              title="Notificaciones"
            >
              <FontAwesomeIcon icon={faBell} />
            </button>
            <div
              className="topbar-avatar"
              onClick={() => navigate('/perfil')}
              title={usuario?.nombre}
            >
              {iniciales}
            </div>
          </div>
        </header>

        <main className="layout-contenido">
          {children}
        </main>
      </div>
    </div>
  )
}