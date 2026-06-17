import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'

const AdminLoginPage = () => {
  const [isDark, setIsDark] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.body.classList.contains('light-theme'))
    }
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    
    // Cek jika sudah login
    const token = localStorage.getItem('adminToken')
    if (token === 'admin-secret-key') {
      navigate('/admin/dashboard')
    }
    
    return () => observer.disconnect()
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await API.post('/admin/login', { username, password })
      if (response.data.status === 'success') {
        localStorage.setItem('adminToken', response.data.token)
        localStorage.setItem('adminData', JSON.stringify(response.data.data))
        toast.success('Login berhasil!')
        navigate('/admin/dashboard')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const inputClass = isDark 
    ? 'bg-surface-container-high border-white/10 text-white placeholder:text-slate-400 focus:ring-1 focus:ring-primary' 
    : 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:ring-1 focus:ring-primary'
  const cardClass = isDark ? 'glass-card' : 'glass-card-light'

  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-20 pb-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`p-4 rounded-full inline-flex items-center justify-center mb-4 ${isDark ? 'glass border-primary/20' : 'bg-white/80 border border-gray-200 shadow-sm'}`}>
            <Icon name="admin_panel_settings" className="text-5xl text-primary" filled />
          </div>
          <h1 className={`text-3xl font-bold ${titleClass}`}>Admin Panel</h1>
          <p className={`text-sm mt-2 ${textClass}`}>Masuk untuk mengelola inventaris</p>
        </div>

        {/* Form Login */}
        <div className={cardClass}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Username
              </label>
              <div className="relative">
                <Icon name="person" className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition ${inputClass}`}
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative">
                <Icon name="lock" className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition ${inputClass}`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                'MASUK'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Default: admin / admin123
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AdminLoginPage