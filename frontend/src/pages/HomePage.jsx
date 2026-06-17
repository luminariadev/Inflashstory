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

  // ✅ GANTI JADI "KEUNGGULAN SISTEM" (Biar gak bentrok sama Cara Pinjam)
  const features = [
    { icon: 'devices', title: 'Akses Fleksibel', desc: 'Bisa Booking barang via Web dari rumah, atau datang langsung dan Scan QR di lokasi.', color: 'text-primary' },
    { icon: 'mark_chat_unread', title: 'Notifikasi WhatsApp', desc: 'Pengingat otomatis jadwal ambil dan kembali langsung terkirim ke WhatsApp Anda.', color: 'text-[#25D366]' },
    { icon: 'track_changes', title: 'Real-Time Tracking', desc: 'Pantau ketersediaan stok, jumlah antrean, dan status persetujuan detik ini juga.', color: 'text-tertiary' },
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

      {/* ✅ FITUR UNGGULAN (Pengganti Langkah Peminjaman) */}
      <section className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className={`text-3xl font-bold ${titleClass}`}>Kenapa Menggunakan Inflashtory?</h2>
          <p className={`${textClass}`}>Peminjaman inventaris kampus kini lebih modern, transparan, dan tanpa ribet.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feat, idx) => (
            <div key={idx} className={`${cardClass} p-6 rounded-2xl space-y-4 relative overflow-hidden transition-transform hover:-translate-y-1`}>
              <div className={`w-14 h-14 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center`}>
                <Icon name={feat.icon} className={`text-3xl ${feat.color}`} />
              </div>
              <h3 className={`text-xl font-bold ${titleClass}`}>{feat.title}</h3>
              <p className={`text-sm leading-relaxed ${textClass}`}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ✅ BANNER WAJIB BACA CARA PINJAM (Urgent tapi Profesional) */}
      <section className={`p-6 md:p-8 rounded-3xl border-2 border-dashed flex flex-col lg:flex-row items-center justify-between gap-6 transition-all hover:bg-opacity-50 ${
        isDark ? 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10' : 'border-orange-400 bg-orange-50 hover:bg-orange-100'
      }`}>
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5 md:gap-6 flex-1">
          <div className={`shrink-0 w-16 h-16 rounded-full flex items-center justify-center animate-pulse ${isDark ? 'bg-yellow-500/20 text-yellow-500' : 'bg-orange-200 text-orange-600'}`}>
            <Icon name="warning" className="text-3xl" />
          </div>
          <div className="space-y-1.5">
            <h2 className={`text-xl md:text-2xl font-extrabold ${isDark ? 'text-yellow-500' : 'text-orange-700'}`}>
              Pengguna Baru? Wajib Baca Panduan!
            </h2>
            <p className={`text-sm md:text-base leading-relaxed ${textClass} max-w-2xl`}>
              Jangan sampai terkena <strong className={isDark ? 'text-white' : 'text-gray-900'}>denda Rp 10.000/Jam</strong> atau bookingan hangus. Pahami alur peminjaman, syarat dokumen, dan aturan mainnya sebelum meminjam barang.
            </p>
          </div>
        </div>
        <div className="shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
          <a href="/how-to-borrow" className={`flex items-center justify-center gap-2 font-bold text-sm tracking-widest px-8 py-4 rounded-xl shadow-lg transition-transform hover:scale-105 w-full lg:w-auto ${
            isDark ? 'bg-yellow-500 text-slate-900 shadow-yellow-500/20 hover:brightness-110' : 'bg-orange-500 text-white shadow-orange-500/30 hover:bg-orange-600'
          }`}>
            <Icon name="menu_book" className="text-lg" />
            BACA ATURAN MAIN
          </a>
        </div>
      </section>

      {/* ✅ BANNER PROMOSI FITUR CEK STATUS (Pengganti Aturan) */}
      <section className={`${isDark ? 'bg-gradient-to-r from-primary/20 to-tertiary/20 border border-white/10' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100'} rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg`}>
        <div className="space-y-3 flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold tracking-wider mb-2">
            <Icon name="new_releases" className="text-sm" /> FITUR BARU
          </div>
          <h2 className={`text-2xl md:text-3xl font-bold ${titleClass}`}>Pantau Status Peminjamanmu!</h2>
          <p className={`text-sm md:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'} max-w-lg`}>
            Sudah melakukan pengajuan? Masukkan NIM kamu untuk mengecek apakah barang sudah di-ACC Admin atau belum secara *real-time*.
          </p>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <a href="/cek-status" className="flex items-center justify-center gap-2 bg-primary text-white font-bold text-sm tracking-wider px-8 py-4 rounded-xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform w-full md:w-auto">
            <Icon name="manage_search" className="text-lg" />
            CEK STATUS SEKARANG
          </a>
        </div>
      </section>

      {/* CTA Akhir */}
      <section className={`text-center py-10 rounded-3xl border space-y-4 ${
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