import { useState, useEffect } from 'react'
import Icon from '../components/Icon'

const HowToBorrowPage = () => {
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
    <main className="pt-32 pb-12 px-6 max-w-7xl mx-auto space-y-8 min-h-screen flex-1">
      {/* Header */}
      <section className="text-center space-y-4">
        <div className={`p-4 rounded-full inline-flex mx-auto ${isDark ? 'glass border-primary/20' : 'bg-white/80 border border-gray-200 shadow-sm'}`}>
          <Icon name="qr_code_scanner" className="text-4xl text-primary" />
        </div>
        <h1 className={`text-3xl font-bold ${titleClass}`}>Cara Peminjaman Barang</h1>
        <p className={`max-w-2xl mx-auto ${textClass}`}>
          Ikuti langkah-langkah berikut untuk meminjam barang inventaris kampus
        </p>
      </section>

      {/* Steps */}
      <section className="grid md:grid-cols-3 gap-5">
        {steps.map((step, idx) => (
          <div key={idx} className={`${cardClass} p-5 rounded-xl space-y-3 relative overflow-hidden text-center`}>
            <div className={`absolute top-0 right-0 p-3 text-5xl font-bold select-none ${isDark ? 'text-white/5' : 'text-gray-200'}`}>{step.number}</div>
            <div className={`w-14 h-14 mx-auto rounded-xl ${isDark ? 'bg-primary/10' : 'bg-primary/5'} flex items-center justify-center`}>
              <Icon name={step.icon} className={`text-3xl ${step.color}`} />
            </div>
            <h3 className={`text-lg font-semibold ${titleClass}`}>{step.title}</h3>
            <p className={`text-sm ${textClass}`}>{step.desc}</p>
          </div>
        ))}
      </section>

      {/* Rules */}
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

      {/* CTA */}
      <section className={`text-center py-10 rounded-2xl border space-y-4 ${
        isDark ? 'bg-slate-950/40 border-white/5' : 'bg-white/50 border-gray-200'
      }`}>
        <h2 className={`text-2xl font-bold ${titleClass}`}>Siap untuk meminjam?</h2>
        <p className={textClass}>Datang langsung ke jurusan/lab dan scan QR Code pada barang</p>
        <div className="pt-2">
          <a href="/items" className="inline-block bg-primary text-white font-bold text-sm tracking-wider px-8 py-4 rounded-xl shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
            LIHAT DAFTAR BARANG
          </a>
        </div>
      </section>
    </main>
  )
}

export default HowToBorrowPage