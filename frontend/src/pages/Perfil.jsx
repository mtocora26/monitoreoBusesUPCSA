import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faIdCard, faEnvelope, faShield } from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/shared/Layout'
import './Perfil.css'

export default function Perfil() {
  const { usuario } = useAuth()

  const iniciales = usuario?.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const campos = [
    { icono: faUser,     label: 'Nombre completo', valor: usuario?.nombre || '—' },
    { icono: faIdCard,   label: 'Documento',       valor: usuario?.documento || '123456789000' },
    { icono: faEnvelope, label: 'Correo',          valor: usuario?.correo || usuario?.email || '—' },
    { icono: faShield,   label: 'Rol',             valor: usuario?.tipo_usuario || '—' },
  ]

  return (
    <Layout titulo="Mi perfil">
      <div className="perfil-page">
        <h2 className="perfil-titulo">Mi perfil</h2>

        <div className="perfil-card">
          {/* Avatar */}
          <div className="perfil-avatar-wrap">
            <div className="perfil-avatar">{iniciales}</div>
            <div className="perfil-avatar-info">
              <span className="perfil-nombre">{usuario?.nombre}</span>
              <span className="perfil-correo">{usuario?.correo || usuario?.email}</span>
            </div>
          </div>

          <div className="perfil-divider" />

          {/* Campos */}
          <div className="perfil-campos">
            {campos.map((campo, i) => (
              <div key={i} className="perfil-campo">
                <div className="perfil-campo-label">
                  <FontAwesomeIcon icon={campo.icono} className="perfil-campo-icono" />
                  {campo.label}
                </div>
                <div className="perfil-campo-valor">{campo.valor}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}