import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'

const AdminSidebar = ({ isDark, onToggleTheme }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { name: 'Manajemen Barang', path: '/admin/items', icon: 'inventory_2' },
    { name: 'Transaksi', path: '/admin/transactions', icon: 'swap_horiz' },
    { name: 'Data Peminjam', path: '/admin/borrowers', icon: 'groups' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    navigate('/admin/login')
  }

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl transition ${
          isDark 
            ? 'glass text-white' 
            : 'bg-white text-gray-800 shadow-md border border-gray-200'
        }`}
      >
        <Icon name={isMobileOpen ? 'close' : 'menu'} className="text-2xl" />
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 flex flex-col
        ${isDark 
          ? 'bg-surface-dim/95 backdrop-blur-xl border-r border-white/10' 
          : 'bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-xl'
        }
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-2 p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <Icon name="warehouse" className="text-primary text-2xl" filled />
          <span className={`text-lg font-bold tracking-widest ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Admin Panel
          </span>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                setIsMobileOpen(false)
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive(item.path)
                  ? (isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary')
                  : (isDark ? 'text-slate-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100')
                }
              `}
            >
              <Icon name={item.icon} className="text-xl" />
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Theme Toggle & Logout */}
        <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} space-y-2`}>
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isDark ? 'text-slate-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon name={isDark ? 'light_mode' : 'dark_mode'} className="text-xl" />
            <span className="text-sm font-medium">{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <Icon name="logout" className="text-xl" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar