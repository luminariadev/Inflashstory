import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    
    // Baca theme user dari localStorage
    const savedTheme = localStorage.getItem('userTheme')
    if (savedTheme === 'light') {
      setIsDark(false)
    } else {
      setIsDark(true)
    }
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    localStorage.setItem('userTheme', newIsDark ? 'dark' : 'light')
    // Update body class
    if (newIsDark) {
      document.body.classList.remove('light-theme')
    } else {
      document.body.classList.add('light-theme')
    }
  }

  const handleNavigate = (path) => {
    navigate(path, { state: { prevPath: location.pathname } })
    setIsMenuOpen(false)
  }

  // ✅ TAMBAHIN MENU CEK STATUS DI SINI
  const navLinks = [
    { name: 'Beranda', href: '/', icon: 'dashboard' },
    { name: 'Inventaris', href: '/items', icon: 'inventory_2' },
    { name: 'Cara Pinjam', href: '/how-to-borrow', icon: 'help' },
    { name: 'Cek Status', href: '/cek-status', icon: 'manage_search' },
  ]

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? (isDark ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg' : 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm')
        : 'bg-transparent'
    }`}>
      <div className="flex justify-between items-center px-6 h-16 max-w-7xl mx-auto">
        <button onClick={() => handleNavigate('/')} className="flex items-center gap-2 cursor-pointer group">
          <Icon name="warehouse" className="text-primary text-2xl transition-transform group-hover:scale-105" filled />
          <span className={`text-lg font-bold tracking-widest transition-colors ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Inflashtory
          </span>
        </button>

        <nav className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavigate(link.href)}
              className={`${
                location.pathname === link.href 
                  ? 'text-primary' 
                  : (isDark ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              } font-medium hover:bg-white/5 transition-colors px-3 py-2 rounded-lg cursor-pointer`}
            >
              {link.name}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className={`material-symbols-outlined ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            } p-2 rounded-full transition-colors`}
          >
            {isDark ? 'dark_mode' : 'light_mode'}
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden material-symbols-outlined ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            } p-2 rounded-full transition-colors`}
          >
            menu
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className={`md:hidden mt-2 ${
          isDark 
            ? 'bg-slate-900/80 backdrop-blur-xl border-t border-white/10' 
            : 'bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg'
        }`}>
          <div className="flex flex-col py-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigate(link.href)}
                className={`flex items-center gap-3 px-6 py-3 w-full text-left ${
                  isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } transition-colors cursor-pointer`}
              >
                <Icon name={link.icon} className="text-xl" />
                <span>{link.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar