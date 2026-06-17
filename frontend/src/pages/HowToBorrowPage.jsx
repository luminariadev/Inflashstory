import { useState, useEffect } from 'react'
import Icon from '../components/Icon'

const HowToBorrowPage = () => {
  const [isDark, setIsDark] = useState(true)
  const [activeTab, setActiveTab] = useState('booking') // ✅ Tambahan State untuk Tab

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.body.classList.contains('light-theme'))
    }
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  // ✅ Pisahin Step untuk Booking dan OTS
  const bookingSteps = [
    { number: '01', icon: 'search', title: 'Pilih Barang', desc: 'Buka menu Katalog, cari barang yang dibutuhkan dan pastikan jadwal tersedia.', color: 'text-primary' },
    { number: '02', icon: 'edit_calendar', title: 'Booking & Isi Form', desc: 'Klik tombol Booking, pilih tanggal ambil/kembali, dan lengkapi data diri.', color: 'text-tertiary' },
    { number: '03', icon: 'hourglass_top', title: 'Tunggu Validasi', desc: 'Admin akan mengecek dan menyetujui (ACC) pengajuan Anda jika data valid.', color: 'text-yellow-500' },
    { number: '04', icon: 'front_hand', title: 'Ambil Barang', desc: 'Datang ke TU/Laboratorium tepat waktu sesuai jadwal untuk mengambil fisik barang.', color: 'text-secondary' },
  ]

  const otsSteps = [
    { number: '01', icon: 'directions_walk', title: 'Datang ke Lokasi', desc: 'Kunjungi TU/Lab tempat penyimpanan barang inventaris yang ingin dipinjam.', color: 'text-primary' },
    { number: '02', icon: 'qr_code_scanner', title: 'Scan QR Code', desc: 'Buka kamera HP atau scanner, scan stiker QR pada fisik barang.', color: 'text-tertiary' },
    { number: '03', icon: 'edit_document', title: 'Isi Formulir', desc: 'Isi kelengkapan data diri dan jam pengembalian pada form yang muncul di HP Anda.', color: 'text-yellow-500' },
    { number: '04', icon: 'verified_user', title: 'Validasi & Ambil', desc: 'Tunjukkan layar HP ke Admin jaga untuk di-ACC, lalu barang siap dibawa.', color: 'text-secondary' },
  ]

  const rules = [
    { icon: 'school', text: 'Hanya untuk keperluan akademik dan kegiatan kampus resmi.' },
    { icon: 'health_and_safety', text: 'Peminjam bertanggung jawab penuh atas kondisi barang selama masa pinjam.' },
    { icon: 'schedule', text: 'Maksimal peminjaman via web adalah 7 hari. Hubungi Admin jika butuh waktu lebih lama.' },
    // ✅ PERUBAHAN DENDA & DISPENSASI SENIN
    { icon: 'payments', text: 'Keterlambatan pengembalian tanpa konfirmasi akan dikenakan denda tunai sebesar Rp 10.000 / Jam.' },
    { icon: 'event_available', text: 'Sabtu & Minggu libur. Pengembalian akhir pekan mendapat dispensasi ke hari Senin pagi (Maksimal 10:00 WIB). Lewat dari jam tersebut, argometer denda berlaku!' },
    { icon: 'currency_exchange', text: 'Wajib mengganti barang dengan spesifikasi yang sama jika terjadi kerusakan fatal atau kehilangan.' },
    // ✅ TAMBAHAN ATURAN BOOKING HANGUS
    { icon: 'warning', text: 'Khusus jalur Booking: Jika terlambat mengambil barang lebih dari 2 Jam dari jadwal, booking OTOMATIS HANGUS.' },
  ]

  const cardClass = isDark ? 'glass-card' : 'glass-card-light'
  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'

  return (
    <main className="pt-32 pb-12 px-6 max-w-7xl mx-auto space-y-8 min-h-screen flex-1">
      {/* Header */}
      <section className="text-center space-y-4">
        <div className={`p-4 rounded-full inline-flex mx-auto ${isDark ? 'glass border-primary/20' : 'bg-white/80 border border-gray-200 shadow-sm'}`}>
          <Icon name="qr_code_scanner" className="text-4xl text-primary" />
        </div>
        <h1 className={`text-3xl font-bold ${titleClass}`}>Cara Peminjaman Barang</h1>
        <p className={`max-w-2xl mx-auto ${textClass}`}>
          Pilih jalur peminjaman yang Anda inginkan dan ikuti langkah-langkahnya.
        </p>
      </section>

      {/* ✅ TAB NAVIGATION (Booking vs OTS) */}
      <section className="flex justify-center">
        <div className={`flex p-1.5 rounded-2xl w-full max-w-md ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-200/60 border border-gray-300'}`}>
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'booking'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : `${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`
            }`}
          >
            <Icon name="event_available" className="text-lg" />
            Booking Web
          </button>
          <button
            onClick={() => setActiveTab('ots')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'ots'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : `${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`
            }`}
          >
            <Icon name="qr_code_scanner" className="text-lg" />
            Scan QR (Di Tempat)
          </button>
        </div>
      </section>

      {/* ✅ STEPS CONTENT (Render Dinamis sesuai Tab) */}
      <section className="grid md:grid-cols-4 sm:grid-cols-2 gap-5 animate-fade-in">
        {(activeTab === 'booking' ? bookingSteps : otsSteps).map((step, idx) => (
          <div key={idx} className={`${cardClass} p-5 rounded-xl space-y-3 relative overflow-hidden text-center transition-all hover:-translate-y-1`}>
            <div className={`absolute top-0 right-0 p-3 text-5xl font-bold select-none ${isDark ? 'text-white/5' : 'text-gray-200'}`}>{step.number}</div>
            <div className={`w-14 h-14 mx-auto rounded-xl ${isDark ? 'bg-primary/10' : 'bg-primary/5'} flex items-center justify-center`}>
              <Icon name={step.icon} className={`text-3xl ${step.color}`} />
            </div>
            <h3 className={`text-lg font-semibold ${titleClass}`}>{step.title}</h3>
            <p className={`text-xs leading-relaxed ${textClass}`}>{step.desc}</p>
          </div>
        ))}
      </section>

      {/* Info Operasional & Rules */}
      <div className="space-y-6 pt-6 border-t border-white/5">
        {/* Banner Jam Operasional */}
        <section className={`p-5 rounded-2xl border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-200 text-blue-700'}`}>
              <Icon name="schedule" className="text-3xl" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>Jam Operasional Tata Usaha (TU)</h2>
              <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-blue-400/80' : 'text-blue-700/80'}`}>Senin - Jumat | 08:00 - 16:00 WIB</p>
            </div>
          </div>
          <p className={`text-xs md:text-right max-w-sm leading-relaxed ${isDark ? 'text-blue-400/70' : 'text-blue-700/70'}`}>
            Pengajuan di luar jam operasional akan diproses pada hari kerja berikutnya. Peminjaman On The Spot hanya berlaku di jam ini.
          </p>
        </section>

        {/* Rules */}
        <section className={`${isDark ? 'glass' : 'bg-white/80 border border-gray-200 shadow-sm'} rounded-2xl p-6 space-y-6`}>
          <div className="flex items-center gap-3 pb-2">
            <Icon name="gavel" className="text-tertiary text-3xl" />
            <h2 className={`text-2xl font-bold ${titleClass}`}>Aturan & Kebijakan Peminjaman</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-5">
              {rules.slice(0, 4).map((rule, idx) => (
                <li key={idx} className="flex gap-4 items-start">
                  <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <Icon name={rule.icon} className={idx === 3 ? 'text-red-500 text-xl' : `text-xl ${isDark ? 'text-primary' : 'text-primary/80'}`} />
                  </div>
                  <p className={`text-sm leading-relaxed mt-1 ${textClass}`}>{rule.text}</p>
                </li>
              ))}
            </ul>
            <ul className="space-y-5 border-t md:border-t-0 md:border-l border-white/10 md:pl-6 pt-5 md:pt-0">
              {rules.slice(4).map((rule, idx) => (
                <li key={idx} className="flex gap-4 items-start">
                  <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <Icon name={rule.icon} className={idx === 2 ? 'text-orange-500 text-xl' : `text-xl ${isDark ? 'text-primary' : 'text-primary/80'}`} />
                  </div>
                  <p className={`text-sm leading-relaxed mt-1 ${textClass}`}>{rule.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* CTA */}
      <section className={`text-center py-10 rounded-2xl border space-y-4 ${
        isDark ? 'bg-slate-950/40 border-white/5' : 'bg-white/50 border-gray-200'
      }`}>
        <h2 className={`text-2xl font-bold ${titleClass}`}>Siap untuk meminjam?</h2>
        <p className={textClass}>Silakan Booking via Web atau langsung datang dan Scan QR di tempat.</p>
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