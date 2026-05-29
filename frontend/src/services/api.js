const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, config)
    const data = await res.json()

    if (!res.ok) throw { status: res.status, message: data.error || 'Error del servidor' }
    return data
  },

  get: (endpoint) => api.request(endpoint),
  post: (endpoint, body) => api.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => api.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => api.request(endpoint, { method: 'DELETE' }),
}

export default api