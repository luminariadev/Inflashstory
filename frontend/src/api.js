import axios from 'axios'

// Use VITE_API_URL from env, fallback to relative /api (works in dev with Vite proxy)
// For production/preview, set VITE_API_URL to http://localhost:8080/api
const baseURL = import.meta.env.VITE_API_URL || '/api'

const API = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  const adminDataStr = localStorage.getItem('adminData')

  if (token) {
    config.headers['X-Admin-Token'] = token
  }

  // Send X-Admin-Username for admin routes
  if (adminDataStr && adminDataStr !== 'null') {
    try {
      const adminData = JSON.parse(adminDataStr)
      if (adminData && typeof adminData === 'object' && adminData.username) {
        config.headers['X-Admin-Username'] = adminData.username
      }
    } catch (e) {
      // ignore JSON parse errors
    }
  }

  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'Terjadi kesalahan pada server'
      console.error('[API Error]', message)
      return Promise.reject({ message, status: error.response.status })
    }
    if (error.request) {
      console.error('[API Error] No response from server')
      return Promise.reject({ message: 'Tidak dapat terhubung ke server', status: 503 })
    }
    console.error('[API Error]', error.message)
    return Promise.reject({ message: error.message, status: 500 })
  }
)

export default API