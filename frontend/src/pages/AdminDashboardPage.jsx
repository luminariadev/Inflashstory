import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const AdminDashboardPage = () => {
  const [isDark, setIsDark] = useState(true)
  const [stats, setStats] = useState({
    total_items: 0,
    available_items: 0,
    borrowed_items: 0,
    damaged_items: 0,
    active_transactions: 0,
    total_borrowers: 0,
    pending_bookings: 0,
    today_transactions: 0
  })
  const [loading, setLoading] = useState(true)
  const [adminData, setAdminData] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([]) // ✅ STATE BARU BUAT TABEL
  const [isMobile, setIsMobile] = useState(false)
  const [chartKey, setChartKey] = useState(0)
  const pieChartRef = useRef(null)
  const barChartRef = useRef(null)
  const navigate = useNavigate()

  // Force chart resize setelah komponen mount
  useEffect(() => {
    // Delay untuk memastikan DOM sudah siap
    const timer = setTimeout(() => {
      if (pieChartRef.current) {
        pieChartRef.current.resize()
      }
      if (barChartRef.current) {
        barChartRef.current.resize()
      }
    }, 200)
    
    return () => clearTimeout(timer)
  }, [loading, chartKey])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Resize chart saat window diresize
      setTimeout(() => {
        if (pieChartRef.current) {
          pieChartRef.current.resize()
        }
        if (barChartRef.current) {
          barChartRef.current.resize()
        }
      }, 100)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Force re-render chart saat tema berubah
  useEffect(() => {
    setChartKey(prev => prev + 1)
  }, [isDark])

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.body.classList.contains('light-theme'))
    }
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    
    const token = localStorage.getItem('adminToken')
    if (token !== 'admin-secret-key') {
      navigate('/admin/login')
    } else {
      const admin = localStorage.getItem('adminData')
      if (admin) setAdminData(JSON.parse(admin))
      fetchStats()
    }
    
    return () => observer.disconnect()
  }, [navigate])

  const fetchStats = async () => {
    try {
      // Fetch Statistik
      const response = await API.get('/admin/stats/detail', {
        headers: { 'X-Admin-Token': 'admin-secret-key' }
      })
      setStats(response.data.data)

      // ✅ Fetch Transaksi Terbaru
      const resTrx = await API.get('/admin/transactions?limit=5', {
        headers: { 'X-Admin-Token': 'admin-secret-key' }
      })
      // Ambil 5 data pertama aja
      setRecentTransactions((resTrx.data.data || []).slice(0, 5)) 

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Data untuk Pie Chart
  const pieData = {
    labels: ['Tersedia', 'Dipinjam', 'Rusak', 'Perawatan'],
    datasets: [{
      data: [stats.available_items, stats.borrowed_items, stats.damaged_items || 0, 0],
      backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'],
      borderWidth: 0,
    }]
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'right',
        labels: { 
          color: isDark ? '#c1c6d7' : '#4a4a6a', 
          font: { size: 11 },
          boxWidth: 12,
          padding: 8
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1e1f23' : '#fff',
        titleColor: isDark ? '#fff' : '#333',
        bodyColor: isDark ? '#c1c6d7' : '#666'
      }
    }
  }

  // Data untuk Bar Chart
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [{
      label: 'Jumlah Transaksi',
      data: [12, 19, 15, 17, 14, stats.today_transactions || 0],
      backgroundColor: '#adc6ff',
      borderRadius: 8,
    }]
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: isDark ? '#1e1f23' : '#fff', 
        titleColor: isDark ? '#fff' : '#333', 
        bodyColor: isDark ? '#c1c6d7' : '#666' 
      }
    },
    scales: {
      y: { 
        grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }, 
        ticks: { color: isDark ? '#c1c6d7' : '#666', stepSize: 5 } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: isDark ? '#c1c6d7' : '#666' } 
      }
    }
  }

  const statCards = [
    { label: 'Total Barang', value: stats.total_items, icon: 'inventory_2', color: 'text-primary' },
    { label: 'Tersedia', value: stats.available_items, icon: 'check_circle', color: 'text-tertiary' },
    { label: 'Dipinjam', value: stats.borrowed_items, icon: 'sync_alt', color: 'text-secondary' },
    { label: 'Transaksi Aktif', value: stats.active_transactions, icon: 'pending_actions', color: 'text-primary-container' },
    { label: 'Total Peminjam', value: stats.total_borrowers, icon: 'groups', color: 'text-primary' },
    { label: 'Booking Pending', value: stats.pending_bookings, icon: 'event_available', color: 'text-tertiary' },
    { label: 'Hari Ini', value: stats.today_transactions, icon: 'today', color: 'text-secondary' },
  ]

  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const cardClass = isDark ? 'glass-card' : 'bg-white rounded-xl shadow-md border border-gray-200 p-4'

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Memuat dashboard...</div>
      </div>
    )
  }

  return (
    <div className="pb-12 space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className={`text-2xl lg:text-3xl font-bold ${titleClass}`}>Dashboard Admin</h1>
        <p className={`text-sm mt-1 ${textClass}`}>
          Selamat datang kembali, {adminData?.name || 'Administrator'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`${cardClass} flex items-center gap-3 p-4`}>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <Icon name={stat.icon} className={`text-2xl ${stat.color}`} />
            </div>
            <div>
              <p className={`text-xl lg:text-2xl font-bold ${titleClass}`}>{stat.value.toLocaleString()}</p>
              <p className={`text-xs ${textClass}`}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="pie_chart" className="text-primary text-xl" />
            <h2 className={`text-lg font-semibold ${titleClass}`}>Status Barang</h2>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <div className="w-full max-w-[300px] md:max-w-none mx-auto">
              <Pie 
                ref={pieChartRef}
                key={`pie-${chartKey}-${isMobile}`}
                data={pieData} 
                options={pieOptions}
              />
            </div>
          </div>
        </div>
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="bar_chart" className="text-primary text-xl" />
            <h2 className={`text-lg font-semibold ${titleClass}`}>Statistik Transaksi</h2>
          </div>
          <div className="h-72 w-full">
            <Bar 
              ref={barChartRef}
              key={`bar-${chartKey}-${isMobile}`}
              data={barData} 
              options={barOptions}
            />
          </div>
        </div>
      </div>

      {/* BAWAH: Quick Actions & Tabel Transaksi Terbaru */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Quick Actions (Kiri, lebih ramping) */}
        <div className={`${cardClass} p-5 col-span-1 flex flex-col`}>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="bolt" className="text-yellow-500 text-xl" />
            <h2 className={`text-lg font-semibold ${titleClass}`}>Aksi Cepat</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <button onClick={() => navigate('/admin/items')} className={`p-4 rounded-xl text-center transition flex flex-col justify-center items-center ${isDark ? 'glass hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <Icon name="add_circle" className={`text-3xl ${isDark ? 'text-primary' : 'text-primary/80'} mb-2`} />
              <p className={`text-sm font-bold ${titleClass}`}>Barang Baru</p>
            </button>
            <button onClick={() => navigate('/admin/transactions')} className={`p-4 rounded-xl text-center transition flex flex-col justify-center items-center ${isDark ? 'glass hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <Icon name="fact_check" className={`text-3xl ${isDark ? 'text-orange-500' : 'text-orange-500/80'} mb-2`} />
              <p className={`text-sm font-bold ${titleClass}`}>Validasi Trx</p>
            </button>
            <button onClick={() => window.open('http://localhost:8080/api/items/1/qr', '_blank')} className={`p-4 rounded-xl text-center transition flex flex-col justify-center items-center ${isDark ? 'glass hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <Icon name="qr_code_2" className={`text-3xl ${isDark ? 'text-green-500' : 'text-green-500/80'} mb-2`} />
              <p className={`text-sm font-bold ${titleClass}`}>Cetak QR</p>
            </button>
            <button onClick={() => navigate('/admin/transactions')} className={`p-4 rounded-xl text-center transition flex flex-col justify-center items-center ${isDark ? 'glass hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <Icon name="history" className={`text-3xl ${isDark ? 'text-blue-500' : 'text-blue-500/80'} mb-2`} />
              <p className={`text-sm font-bold ${titleClass}`}>Riwayat</p>
            </button>
          </div>
        </div>

        {/* Tabel Transaksi Terbaru (Kanan, lebih lebar) */}
        <div className={`${cardClass} p-0 col-span-1 lg:col-span-2 overflow-hidden flex flex-col`}>
          <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <Icon name="notifications_active" className="text-primary text-xl" />
              <h2 className={`text-lg font-semibold ${titleClass}`}>Transaksi Terbaru</h2>
            </div>
            <button onClick={() => navigate('/admin/transactions')} className={`text-sm font-bold text-primary hover:underline`}>
              Lihat Semua
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {recentTransactions.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={isDark ? 'bg-white/5 text-slate-400' : 'bg-gray-50 text-gray-500'}>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Peminjam</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Barang</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentTransactions.map((trx) => (
                    <tr key={trx.id} className={`transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <td className={`py-3 px-4 text-sm font-semibold ${titleClass}`}>{trx.borrower?.name}</td>
                      <td className={`py-3 px-4 text-sm ${textClass}`}>{trx.item?.name}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide
                          ${trx.status === 'pending' ? 'bg-orange-500/20 text-orange-500' : 
                            trx.status === 'approved' ? 'bg-purple-500/20 text-purple-500' : 
                            trx.status === 'borrowed' ? 'bg-blue-500/20 text-blue-500' : 
                            trx.status === 'returned' ? 'bg-green-500/20 text-green-500' : 
                            'bg-red-500/20 text-red-500'}`}>
                          {trx.status === 'approved' ? 'Siap Diambil' : trx.status === 'borrowed' ? 'Dipinjam' : trx.status === 'pending' ? 'Menunggu' : trx.status}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-xs font-medium ${textClass}`}>
                        {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={`p-8 text-center text-sm ${textClass}`}>Belum ada transaksi terbaru hari ini.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminDashboardPage