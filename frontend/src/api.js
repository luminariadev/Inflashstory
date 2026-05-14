import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor untuk error handling
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