import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RutaProtegida from './components/shared/RutaProtegida'

// Pages — las iremos creando en los siguientes issues
import Login from './pages/Login'
import Layout from './components/shared/Layout'
import Dashboard from './pages/Dashboard'
import MapaTiempoReal from './pages/MapaTiempoReal'
import Rutas from './pages/Rutas'
import Buses from './pages/Buses'
import Notificaciones from './pages/Notificaciones'
import Perfil from './pages/Perfil'
import PanelAdmin from './pages/admin/PanelAdmin'
import GestionUsuarios from './pages/admin/GestionUsuarios'
import GestionBuses from './pages/admin/GestionBuses'
import GestionRutas from './pages/admin/GestionRutas'
import MiRecorrido from './pages/conductor/MiRecorrido'
// Placeholders 
const Placeholder = ({ nombre }) => {
  return (
    <Layout titulo={nombre}>
      <div style={{ padding: 20 }}>
        <h2>🚧 {nombre}</h2>
        <p style={{ marginTop: 8, color: 'var(--texto-suave)' }}>Vista en construcción</p>
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Estudiante y admin */}
          <Route path="/inicio" element={
            <RutaProtegida roles={['estudiante', 'administrador', 'conductor']}>
              <Dashboard />
            </RutaProtegida>
          } />

          <Route path="/mapa" element={
            <RutaProtegida roles={['estudiante', 'administrador']}>
              <MapaTiempoReal />
            </RutaProtegida>
          } />

          <Route path="/rutas" element={
            <RutaProtegida roles={['estudiante', 'administrador']}>
              <Rutas />
            </RutaProtegida>
          } />

          <Route path="/buses" element={
            <RutaProtegida roles={['estudiante', 'administrador']}>
              <Buses />
            </RutaProtegida>
          } />

          <Route path="/notificaciones" element={
            <RutaProtegida roles={['estudiante', 'conductor', 'administrador']}>
              <Notificaciones />
            </RutaProtegida>
          } />

          <Route path="/perfil" element={
            <RutaProtegida roles={['estudiante', 'conductor', 'administrador']}>
              <Perfil />
            </RutaProtegida>
          } />

          {/* Conductor */}
          <Route path="/conductor" element={
            <RutaProtegida roles={['conductor']}>
              <MiRecorrido/>
            </RutaProtegida>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <RutaProtegida roles={['administrador']}>
              <PanelAdmin/>
            </RutaProtegida>
          } />

          <Route path="/admin/usuarios" element={
            <RutaProtegida roles={['administrador']}>
              <GestionUsuarios/>
            </RutaProtegida>
          } />

          <Route path="/admin/buses" element={
            <RutaProtegida roles={['administrador']}>
              <GestionBuses />
            </RutaProtegida>
          } />

          <Route path="/admin/rutas" element={
            <RutaProtegida roles={['administrador']}>
              <GestionRutas/>
            </RutaProtegida>
          } />

          {/* Redirecciones */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}