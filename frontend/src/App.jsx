import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminSidebar from './components/AdminSidebar'
import HomePage from './pages/HomePage'
import ItemListPage from './pages/ItemListPage'
import HowToBorrowPage from './pages/HowToBorrowPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminItemsPage from './pages/AdminItemsPage'
import AdminTransactionsPage from './pages/AdminTransactionsPage'
import AdminBookingsPage from './pages/AdminBookingsPage'
import AdminBorrowersPage from './pages/AdminBorrowersPage'
import BorrowFormPage from './pages/BorrowFormPage'
import CheckStatusPage from './pages/CheckStatusPage'

// ✅ IMPORT BANNER PWA SAKTI KITA
import InstallPrompt from './components/InstallPrompt'

// Animasi variants
const pageVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction === 'right' ? 60 : -60,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction === 'right' ? -60 : 60,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }
  })
}

// Layout User
const UserLayout = ({ children, isDark }) => (
  <>
    <Navbar />
    {children}
    <Footer isDark={isDark} />
  </>
)

// Layout Admin
const AdminLayout = ({ children, isDark, onToggleTheme }) => (
  <div className="flex">
    <AdminSidebar isDark={isDark} onToggleTheme={onToggleTheme} />
    <div className="flex-1 lg:ml-64">
      <div className="pt-6 px-4 lg:px-8">
        {children}
      </div>
    </div>
  </div>
)

function AppContent() {
  const location = useLocation()
  const [direction, setDirection] = useState('right')
  const [prevPath, setPrevPath] = useState('/')
  
  // Pisahkan state theme untuk user dan admin
  const [userTheme, setUserTheme] = useState(() => {
    const saved = localStorage.getItem('userTheme')
    return saved === 'light' ? false : true // default dark
  })
  
  const [adminTheme, setAdminTheme] = useState(() => {
    const saved = localStorage.getItem('adminTheme')
    return saved === 'light' ? false : true // default dark
  })

  const isAdminRoute = location.pathname.startsWith('/admin')
  const isLoginPage = location.pathname === '/admin/login'
  const isBorrowPage = location.pathname === '/borrow'
  
  // Theme yang aktif berdasarkan route
  const isDark = isAdminRoute ? adminTheme : userTheme

  // Apply theme ke body
  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-theme')
    } else {
      document.body.classList.add('light-theme')
    }
  }, [isDark])

  // Toggle theme untuk user
  const toggleUserTheme = () => {
    const newIsDark = !userTheme
    setUserTheme(newIsDark)
    localStorage.setItem('userTheme', newIsDark ? 'dark' : 'light')
  }

  // Toggle theme untuk admin
  const toggleAdminTheme = () => {
    const newIsDark = !adminTheme
    setAdminTheme(newIsDark)
    localStorage.setItem('adminTheme', newIsDark ? 'dark' : 'light')
  }

  // Tentukan arah animasi
  useEffect(() => {
    const adminPaths = ['/admin/dashboard', '/admin/items', '/admin/transactions', '/admin/bookings', '/admin/borrowers']
    const userPaths = ['/', '/items', '/how-to-borrow', '/borrow', '/cek-status'] // ✅ TAMBAHIN DISINI
    const currentPath = location.pathname
    const prevPathname = prevPath
    
    let currentIndex, prevIndex
    
    if (adminPaths.includes(currentPath) && adminPaths.includes(prevPathname)) {
      currentIndex = adminPaths.indexOf(currentPath)
      prevIndex = adminPaths.indexOf(prevPathname)
      setDirection(currentIndex > prevIndex ? 'right' : 'left')
    } else if (userPaths.includes(currentPath) && userPaths.includes(prevPathname)) {
      currentIndex = userPaths.indexOf(currentPath)
      prevIndex = userPaths.indexOf(prevPathname)
      setDirection(currentIndex > prevIndex ? 'right' : 'left')
    } else {
      setDirection('right')
    }
    
    setPrevPath(currentPath)
  }, [location.pathname])

  if (isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          <Routes location={location} key={location.pathname}>
            <Route path="/admin/login" element={
              <motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1">
                <AdminLoginPage />
              </motion.div>
            } />
          </Routes>
        </AnimatePresence>
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? '#1e1f23' : '#ffffff',
            color: isDark ? '#e3e2e7' : '#1a1a2e',
            borderRadius: '12px',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          },
        }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {isAdminRoute ? (
        <AdminLayout isDark={adminTheme} onToggleTheme={toggleAdminTheme}>
          <AnimatePresence mode="wait" custom={direction}>
            <Routes location={location} key={location.pathname}>
              <Route path="/admin/dashboard" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit"><AdminDashboardPage /></motion.div>} />
              <Route path="/admin/items" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit"><AdminItemsPage /></motion.div>} />
              <Route path="/admin/transactions" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit"><AdminTransactionsPage /></motion.div>} />
              <Route path="/admin/bookings" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit"><AdminBookingsPage /></motion.div>} />
              <Route path="/admin/borrowers" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit"><AdminBorrowersPage /></motion.div>} />
            </Routes>
          </AnimatePresence>
        </AdminLayout>  
      ) : (
        <UserLayout isDark={userTheme}>
          <AnimatePresence mode="wait" custom={direction}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1"><HomePage /></motion.div>} />
              <Route path="/items" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1"><ItemListPage /></motion.div>} />
              <Route path="/how-to-borrow" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1"><HowToBorrowPage /></motion.div>} />
              <Route path="/borrow" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1"><BorrowFormPage /></motion.div>} />
              {/* ✅ PINDAH KE SINI DAN KASIH ANIMASI */}
              <Route path="/cek-status" element={<motion.div custom={direction} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex-1"><CheckStatusPage /></motion.div>} />
            </Routes>
          </AnimatePresence>
        </UserLayout>
      )}
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#1e1f23' : '#ffffff',
          color: isDark ? '#e3e2e7' : '#1a1a2e',
          borderRadius: '12px',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        },
      }} />
    </div>
  )
}

function App() {
  return (
    <Router>
      {/* ✅ BANNER PWA CUSTOM: Bakal nahan popup default Chrome & munculin UI elegan kita */}
      <InstallPrompt /> 
      <AppContent />
    </Router>
  )
}

export default App