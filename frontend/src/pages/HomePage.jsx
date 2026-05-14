import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import API from '../api'

const HomePage = () => {
  const [stats, setStats] = useState({
    total_items: 0,
    available_items: 0,
    borrowed_items: 0,
    active_transactions: 0
  })
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.body.classList.contains('light-theme'))
    }
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await API.get('/stats')
      setStats(response.data.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Barang', value: stats.total_items, icon: 'inventory_2', color: 'text-primary' },
    { label: 'Tersedia', value: stats.available_items, icon: 'check_circle', color: 'text-tertiary' },
    { label: 'Dipinjam', value: stats.borrowed_items, icon: 'sync_alt', color: 'text-secondary' },
    { label: 'Transaksi Aktif', value: stats.active_transactions, icon: 'pending_actions', color: 'text-primary-container' },
  ]

  const steps = [
    { number: '01', icon: 'search', title: 'Cek Ketersediaan', desc: 'Cari barang yang Anda butuhkan di katalog digital kami secara real-time.', color: 'text-primary' },
    { number: '02', icon: 'qr_code_scanner', title: 'Datang & Scan QR', desc: 'Kunjungi lokasi penyimpanan dan scan kode QR pada barang untuk verifikasi.', color: 'text-tertiary' },
    { number: '03', icon: 'handshake', title: 'Ambil Barang', desc: 'Konfirmasi peminjaman di aplikasi dan barang siap untuk Anda gunakan.', color: 'text-secondary' },
  ]

  const rules = [
    { icon: 'task_alt', text: 'Hanya untuk keperluan akademik dan kegiatan kampus resmi.' },
    { icon: 'task_alt', text: 'Peminjam bertanggung jawab penuh atas kondisi barang selama masa pinjam.' },
    { icon: 'task_alt', text: 'Keterlambatan pengembalian akan dikenakan denda sesuai ketentuan berlaku.' },
    { icon: 'task_alt', text: 'Wajib mengganti barang dengan tipe yang sama jika terjadi kerusakan fatal atau kehilangan.' },
    { icon: 'task_alt', text: 'Batas maksimal peminjaman adalah 7 hari kalender.' },
  ]

  const cardClass = isDark ? 'glass-card' : 'glass-card-light'
  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const mutedClass = isDark ? 'text-slate-400' : 'text-gray-500'

  return (
    <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-8 min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-10 space-y-6 relative overflow-hidden">
        {isDark && (
          <div className="absolute -z-10 w-64 h-64 bg-primary-container/20 blur-[100px] rounded-full top-0 left-1/2 -translate-x-1/2"></div>
        )}
        <div className={`p-5 rounded-full inline-flex items-center justify-center ${isDark ? 'glass border-primary/20' : 'bg-white/80 border border-gray-200 shadow-sm'}`}>
          <Icon name="warehouse" className="text-5xl text-primary" filled />
        </div>
        <h1 className={`text-5xl md:text-6xl font-bold tracking-tight ${titleClass}`}>
          Inflashtory
        </h1>
        <p className={`text-lg max-w-2xl ${textClass}`}>
          Sistem Inventaris dan Peminjaman Barang Berbasis QR Code untuk Kemudahan Manajemen Kampus
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-3">
          <a href="/items" className="bg-primary text-white font-bold text-xs tracking-wider px-6 py-4 rounded-xl inner-glow shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
            LIHAT DAFTAR BARANG
          </a>
          <a href="/how-to-borrow" className={`font-bold text-xs tracking-wider px-6 py-4 rounded-xl active:scale-95 transition-all ${
            isDark ? 'glass text-white glass-hover' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
          }`}>
            CARA PEMINJAMAN
          </a>
        </div>
      </section>

      {/* Status Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`${cardClass} flex flex-col items-center gap-3 text-center py-6 px-4`}>
            <Icon name={stat.icon} className={`text-4xl ${stat.color}`} />
            <span className={`text-3xl font-bold ${titleClass}`}>
              {loading ? '...' : stat.value.toLocaleString()}
            </span>
            <span className={`text-xs font-semibold tracking-wide ${mutedClass}`}>
              {stat.label}
            </span>
          </div>
        ))}
      </section>

      {/* Langkah Peminjaman */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className={`text-3xl font-bold ${titleClass}`}>Langkah Peminjaman</h2>
          <span className="text-primary text-xs font-bold tracking-wider">PROSES CEPAT & MUDAH</span>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((step, idx) => (
            <div key={idx} className={`${cardClass} p-5 rounded-xl space-y-3 relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 p-3 text-5xl font-bold select-none ${isDark ? 'text-white/5' : 'text-gray-200'}`}>{step.number}</div>
              <Icon name={step.icon} className={`text-4xl ${step.color}`} />
              <h3 className={`text-xl font-semibold ${titleClass}`}>{step.title}</h3>
              <p className={`text-sm ${textClass}`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Aturan Peminjaman */}
      <section className={`${isDark ? 'glass' : 'bg-white/80 border border-gray-200 shadow-sm'} rounded-2xl p-6 space-y-5`}>
        <div className="flex items-center gap-3">
          <Icon name="gavel" className="text-tertiary text-3xl" />
          <h2 className={`text-2xl font-bold ${titleClass}`}>Aturan Peminjaman</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <ul className="space-y-3">
            {rules.slice(0, 3).map((rule, idx) => (
              <li key={idx} className="flex gap-3">
                <Icon name={rule.icon} className="text-primary shrink-0 mt-0.5" />
                <p className={`text-sm ${textClass}`}>{rule.text}</p>
              </li>
            ))}
          </ul>
          <ul className="space-y-3 border-t md:border-t-0 md:border-l border-white/10 md:pl-5 pt-4 md:pt-0">
            {rules.slice(3).map((rule, idx) => (
              <li key={idx} className="flex gap-3">
                <Icon name={rule.icon} className="text-primary shrink-0 mt-0.5" />
                <p className={`text-sm ${textClass}`}>{rule.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

<section className={`text-center py-10 rounded-2xl border space-y-4 ${
  isDark ? 'bg-slate-950/40 border-white/5' : 'bg-gray-100 border-gray-200'
}`}>
  <h2 className={`text-2xl font-bold ${titleClass}`}>Butuh barang sekarang?</h2>
  <p className={textClass}>Telusuri ribuan inventaris kampus yang siap mendukung produktivitas Anda.</p>
  <div className="pt-2">
    <a href="/items" className="inline-block bg-primary text-white font-bold text-sm tracking-wider px-8 py-4 rounded-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-transform">
      LIHAT DAFTAR BARANG
    </a>
  </div>
</section>
    </main>
  )
}

export default HomePage