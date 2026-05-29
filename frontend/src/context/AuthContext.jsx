import { createContext, useContext, useState, useEffect } from 'react'
import socket from '../services/socket'

const AuthContext = createContext(null)

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function normalizeUsuario(source) {
  if (!source || typeof source !== 'object') return null

  const nombre = source.nombre || source.name || source.usuario || null
  const tipoUsuario = source.tipo_usuario || source.tipoUsuario || source.rol || source.role || null

  if (!tipoUsuario) return null

  return {
    ...source,
    nombre: nombre || 'Usuario',
    tipo_usuario: tipoUsuario,
  }
}

function getUsuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch {
    localStorage.removeItem('usuario')
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
  const token = localStorage.getItem('token')
  if (token) {
    const payload = parseJwt(token)
    if (payload && payload.exp * 1000 > Date.now()) {
      setUsuario(payload)
      socket.connect()
    } else {
      localStorage.removeItem('token')
    }
  }
  setCargando(false)
}, [])

  function login(token, userData) {
    localStorage.setItem('token', token)
    const usuarioNormalizado = normalizeUsuario(userData)
    if (usuarioNormalizado) {
      localStorage.setItem('usuario', JSON.stringify(usuarioNormalizado))
      setUsuario(usuarioNormalizado)
    } else {
      localStorage.removeItem('usuario')
      setUsuario(null)
    }
    socket.connect()
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    socket.disconnect()
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}