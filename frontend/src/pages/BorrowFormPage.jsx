import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'

// ✅ IMPORT BARU UNTUK KALENDER SAKTI
import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { id } from 'date-fns/locale'
registerLocale('id', id)

const BorrowFormPage = () => {
  const [searchParams] = useSearchParams()
  const itemId = searchParams.get('item_id')
  const navigate = useNavigate()
  
  const [isDark, setIsDark] = useState(true)
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // ✅ STATE BARU: Nampung antrean jadwal bentrok dari Go
  const [activeBookings, setActiveBookings] = useState([])
  const [showSuccessModal, setShowSuccessModal] = useState(false) // ✅ TAHAN REDIRECT BUAT ANAK OTS
  
  const [formData, setFormData] = useState({
    borrower_name: '',
    identity_no: '',
    study_program: '',
    class: '',
    phone: '',
    email: '',
    purpose: '',
    start_date: null,     // ✅ UBAH JADI NULL (Object Date)
    est_return_date: null, // ✅ UBAH JADI NULL (Object Date)
    notes: '',
    id_photo: '', 
    attachment: '' 
  })

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
    if (!itemId) {
      toast.error('QR Code tidak valid', { id: 'qr-error' }) // ✅ Kasih ID unik
      navigate('/')
      return
    }
    
    fetchItem()
  }, [itemId, navigate])

  const fetchItem = async () => {
    try {
      const response = await API.get(`/items/${itemId}`)
      const itemData = response.data.data
      
      if (itemData.status !== 'available') {
        toast.error(`Barang sedang ${itemData.status === 'borrowed' ? 'dipinjam' : 'tidak tersedia'}`, { id: 'status-error' })
        navigate('/')
        return
      }
      setItem(itemData)

      // ✅ FETCH DATA JADWAL ANTREAN BIAR ADS DI OTS
      const resBookings = await API.get(`/items/${itemId}/bookings`)
      setActiveBookings(resBookings.data.data || [])

      // ✅ AUTOMATIC SET JAM AMBIL = DETIK SCAN SEKARANG
      setFormData(prev => ({ ...prev, start_date: new Date() }))

    } catch (error) {
      toast.error('Gagal memuat data barang', { id: 'fetch-error' })
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  // ✅ LOGIKA SAKTI ANTI BENTROK JAM & HIGHLIGHT WARNA (ULTIMATE PATCH)
  const getLocalDate = (dateString) => {
    if (!dateString) return new Date()
    return new Date(dateString) 
  }

  // ✅ FIX MULTI-STOK: Jangan langsung blokir jam, hitung dulu berapa yg overlap!
  const isTimeConflicting = (timeCheck) => {
    const overlapCount = activeBookings.filter(trx => {
      const start = getLocalDate(trx.borrow_date)
      const end = getLocalDate(trx.est_return_date)
      return timeCheck > start && timeCheck < end
    }).length
    
    // Baru diblokir kalau yang minjam di jam itu udah nyentuh batas maksimal stok
    return overlapCount >= (item?.total_stock || 1)
  }

  // ✅ FIX MULTI-STOK: Tembok waktu hari hanya berlaku kalau stok di tanggal tersebut benar-benar HABIS (0)
  const getMaxReturnDate = () => {
    const defaultMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 hari web
    if (!formData.start_date) return defaultMax

    const start = formData.start_date.getTime()
    const totalStock = item?.total_stock || 1

    // Cari semua waktu mulai transaksi di masa depan yang bentrokannya sudah menghabiskan seluruh stok
    const fullyBookedTimes = activeBookings
      .map(trx => getLocalDate(trx.borrow_date).getTime())
      .filter(trxStart => trxStart > start)
      .filter(trxStart => {
        const overlapCount = activeBookings.filter(b => {
          const bStart = getLocalDate(b.borrow_date).getTime()
          const bEnd = getLocalDate(b.est_return_date).getTime()
          return trxStart >= bStart && trxStart < bEnd
        }).length
        return overlapCount >= totalStock
      })

    if (fullyBookedTimes.length > 0) {
      const closestWall = Math.min(...fullyBookedTimes)
      const closestWallDate = new Date(closestWall)
      return closestWallDate < defaultMax ? closestWallDate : defaultMax
    }

    return defaultMax
  }

  // ✅ FIX MULTI-STOK: Jam di dalam rentang hari hanya diblokir jika melompati jadwal yang sisa stoknya sudah 0
  const filterAvailableTimes = (time) => {
    const selectedDate = new Date(time)
    const hours = selectedDate.getHours()
    
    // 1. Harus jam operasional
    if (hours < 8 || hours >= 16) return false
    
    // 2. Gak boleh milih titik jam yang kuota stoknya sudah penuh dipinjam orang
    if (isTimeConflicting(selectedDate)) return false

    // 3. Gak boleh MELEWATI antrean jadwal orang lain yang sisa stoknya sudah habis!
    if (formData.start_date) {
      const start = formData.start_date.getTime()
      const checkTime = selectedDate.getTime()
      const totalStock = item?.total_stock || 1
      
      const hasFullBlockInBetween = activeBookings.some(trx => {
        const trxStart = getLocalDate(trx.borrow_date).getTime()
        if (trxStart > start && trxStart < checkTime) {
          const overlapCount = activeBookings.filter(b => {
            const bStart = getLocalDate(b.borrow_date).getTime()
            const bEnd = getLocalDate(b.est_return_date).getTime()
            return trxStart >= bStart && trxStart < bEnd
          }).length
          return overlapCount >= totalStock
        }
        return false
      })

      if (hasFullBlockInBetween) return false 
    }

    return true
  }

  const getDayClassName = (date) => {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const bookingIndex = activeBookings.findIndex(trx => {
      const startObj = getLocalDate(trx.borrow_date)
      const endObj = getLocalDate(trx.est_return_date)
      const start = new Date(startObj.getFullYear(), startObj.getMonth(), startObj.getDate()).getTime()
      const end = new Date(endObj.getFullYear(), endObj.getMonth(), endObj.getDate()).getTime()
      return checkDate >= start && checkDate <= end
    })

    if (bookingIndex !== -1) {
      return `has-booking-range-${(bookingIndex % 3) + 1}`
    }
    return undefined
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Cegah submit kalau barang butuh Surat PDF
    if (item?.require_letter && !formData.attachment) {
      toast.error('Surat peminjaman (PDF) wajib diunggah!')
      return
    }

    // Cegah submit kalau barang butuh KTP/KTM tapi foto belum ada
    if (item?.required_id && item.required_id !== 'none' && !formData.id_photo) {
      toast.error(`Foto ${item.required_id.toUpperCase()} wajib diunggah!`)
      return
    }

    if (!formData.start_date || !formData.est_return_date) {
      toast.error('Waktu pengambilan dan pengembalian wajib diisi!')
      return
    }

    setSubmitting(true)
    
    // ✅ UBAH OBJECT DATE MENJADI STRING YANG DIMENGERTI GO (YYYY-MM-DDThh:mm)
    const formatToGo = (dateObj) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    const payload = {
      ...formData,
      start_date: formatToGo(formData.start_date),
      est_return_date: formatToGo(formData.est_return_date),
      type: '' // ✅ KOSONGKAN: Penanda ke Go kalau ini murni Scan OTS di tempat
    }
    
    try {
      const response = await API.post(`/borrow/${itemId}`, payload)
      
      if (response.data.status === 'success') {
        // ✅ Cuma nampilin sukses ringan, sisanya dijelasin di Modal
        toast.success(`Berhasil terkirim!`, { duration: 2000 })
        
        // ✅ TAHAN REDIRECT! Buka Pop-up Edukasi OTS
        setShowSuccessModal(true)
        setSubmitting(false)
      }
    } catch (error) {
      // Ambil pesan error dari backend, kalau kosong pakai pesan fallback
      const errorMessage = error.response?.data?.message || 'Barang gagal dipinjam (mungkin sudah di-lock orang lain)'
      
      // Tampilkan error (Hapus emoji ❌ manual biar gak double)
      toast.error(errorMessage)
      
      // LOGIC UX SUPER KETAT: 
      // Kalau status 400 (Bad Request) ATAU pesannya gak jelas dari Ngrok, langsung tendang balik ke Katalog!
      const isItemTaken = error.response?.status === 400 || errorMessage.includes('tersedia') || !error.response;
      
      if (isItemTaken) {
        setTimeout(() => {
          toast('Mengalihkan kembali ke katalog...', { icon: '🔄', duration: 2000 })
        }, 500); // Jeda setengah detik biar dia baca error merahnya dulu
        
        setTimeout(() => {
          navigate('/items', { state: { refresh: Date.now() } })
        }, 2500)
      } else {
        setSubmitting(false) // Tombol cuma bisa diklik lagi kalau errornya murni typo data
      }
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Setup Tanggal Pinjam (Bisa hari ini, Maksimal 7 Hari)
  const today = new Date()
  const minDateStr = today.toISOString().split('T')[0]
  
  const maxDate = new Date()
  maxDate.setDate(today.getDate() + 7)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const inputClass = isDark 
    ? 'bg-[#1e1f23] border border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 w-full outline-none transition' 
    : 'bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 w-full outline-none transition'
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`
  const cardClass = isDark 
    ? 'bg-[#1e1f23]/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6' 
    : 'bg-white rounded-2xl shadow-xl border border-gray-200 p-6'

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-20">
        <div className={`text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          Memuat data barang...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 max-w-2xl mx-auto">
      
      {/* ✅ INJEKSI CSS BIAR DATEPICKER-NYA IKUTAN DARK MODE ELEGAN */}
      <style>{`
        .react-datepicker-popper { z-index: 9999 !important; }
        .react-datepicker { font-family: inherit !important; background-color: #1e1f23 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .react-datepicker__header { background-color: #121215 !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        .react-datepicker__current-month, .react-datepicker-time__header { color: #fff !important; }
        .react-datepicker__day-name { color: #888 !important; }
        .react-datepicker__day { color: #ccc !important; border-radius: 6px !important; }
        .react-datepicker__day:hover { background-color: rgba(99, 102, 241, 0.5) !important; color: white !important; }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected { background-color: #6366f1 !important; color: white !important; font-weight: bold; }
        .react-datepicker__day--disabled { color: #3f3f46 !important; text-decoration: line-through !important; cursor: not-allowed !important; background-color: transparent !important; }
        .react-datepicker__day--disabled:hover { background-color: transparent !important; color: #3f3f46 !important; }
        .has-booking-range-1 { background-color: rgba(249, 115, 22, 0.15) !important; color: #f97316 !important; font-weight: bold; border-radius: 6px !important; } 
        .has-booking-range-2 { background-color: rgba(6, 182, 212, 0.15) !important; color: #06b6d4 !important; font-weight: bold; border-radius: 6px !important; } 
        .has-booking-range-3 { background-color: rgba(244, 63, 94, 0.15) !important; color: #f43f5e !important; font-weight: bold; border-radius: 6px !important; } 
        .react-datepicker__time-container { border-left: 1px solid rgba(255,255,255,0.1) !important; }
        .react-datepicker__time { background-color: #1e1f23 !important; }
        .react-datepicker__time-list-item { color: #ccc !important; transition: all 0.2s; }
        .react-datepicker__time-list-item:hover { background-color: rgba(99, 102, 241, 0.3) !important; color: white !important; }
        .react-datepicker__time-list-item--selected { background-color: #6366f1 !important; color: white !important; font-weight: bold; }
        .react-datepicker__time-list-item--disabled { color: #333 !important; cursor: not-allowed !important; text-decoration: line-through; }
      `}</style>
      {/* Header */}
      <div className="text-center mb-8">
        <div className={`p-4 rounded-full inline-flex items-center justify-center mb-4 ${isDark ? 'bg-[#1e1f23]/50 border border-white/10' : 'bg-white/80 border border-gray-200 shadow-sm'}`}>
          <Icon name="qr_code_scanner" className="text-5xl text-primary" />
        </div>
        <h1 className={`text-2xl font-bold ${titleClass}`}>Form Peminjaman Barang</h1>
        <p className={`text-sm mt-2 ${textClass}`}>
          Scan QR Code berhasil! Silakan isi form berikut untuk meminjam
        </p>
      </div>

      {/* Info Barang */}
      <div className={`${cardClass} mb-6`}>
        <div className="flex gap-4">
          <img 
            src={item?.image_url || `https://picsum.photos/seed/${item?.id}/80/80`} 
            alt={item?.name}
            className="w-20 h-20 rounded-xl object-cover"
          />
          <div className="flex-1">
            <h2 className={`font-semibold ${titleClass}`}>{item?.name}</h2>
            <p className={`text-sm ${textClass}`}>Kode: {item?.code || `INV-${item?.id}`}</p>
            <p className={`text-sm ${textClass}`}>Lokasi: {item?.location || 'Ruang Jurusan'}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600">
              Tersedia
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className={cardClass}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="borrower_name"
                value={formData.borrower_name}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <label className={labelClass}>
                NIM / NIP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="identity_no"
                value={formData.identity_no}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Masukkan NIM atau NIP"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Program Studi</label>
              <input
                type="text"
                name="study_program"
                value={formData.study_program}
                onChange={handleChange}
                className={inputClass}
                placeholder="Contoh: Teknik Informatika"
              />
            </div>
            <div>
              <label className={labelClass}>Kelas / Angkatan</label>
              <input
                type="text"
                name="class"
                value={formData.class}
                onChange={handleChange}
                className={inputClass}
                placeholder="Contoh: IF-6 / 2022"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="081234567890"
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Keperluan Peminjaman <span className="text-red-500">*</span>
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              rows="3"
              className={inputClass}
              placeholder="Contoh: Presentasi tugas akhir, Praktikum, dll"
            />
          </div>

          {/* ✅ CONTAINER BARU: SEJAJARIN JAM AMBIL & JAM KEMBALI PAKAI DATEPICKER SAKTI */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121215]/50 border-white/10' : 'bg-gray-50 border-gray-200'} space-y-4`}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <label className={labelClass}>Waktu Diambil <span className="text-red-500">*</span></label>
                <DatePicker
                  selected={formData.start_date}
                  onChange={() => {}} 
                  showTimeSelect
                  timeFormat="HH:mm"
                  dateFormat="d MMMM yyyy, HH:mm"
                  locale="id"
                  className={`${inputClass} opacity-70 cursor-not-allowed`}
                  disabled
                />
              </div>
              <div className="relative">
                <label className={labelClass}>Waktu Dikembalikan <span className="text-red-500">*</span></label>
                <DatePicker
                  selected={formData.est_return_date}
                  onChange={(date) => setFormData({ ...formData, est_return_date: date })}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={30}
                  timeCaption="Waktu"
                  dateFormat="d MMMM yyyy, HH:mm"
                  locale="id"
                  minDate={formData.start_date}
                  maxDate={getMaxReturnDate()} // ✅ PAKAI TEMBOK TANGGAL SAKTI
                  filterTime={filterAvailableTimes}
                  dayClassName={getDayClassName}
                  className={inputClass}
                  placeholderText="Pilih jam kembali"
                  portalId="datepicker-portal"
                  required
                />
              </div>
            </div>
            <div className={`text-xs space-y-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <p className="flex items-center gap-1.5"><Icon name="info" className="text-[14px] text-blue-400" /> Karena Scan OTS, jam ambil otomatis terkunci di jam saat ini.</p>
              <p className="flex items-center gap-1.5"><Icon name="schedule" className="text-[14px] text-orange-400" /> Jam yang sudah dibooking orang lain otomatis dicoret dan dikunci.</p>
            </div>
          </div>

          {/* RENDER KONDISIONAL: Cuma muncul kalau barang butuh KTP/KTM */}
          {item?.required_id && item.required_id !== 'none' && (
            <div>
              <label className={labelClass}>
                Unggah Foto {item.required_id.toUpperCase()} (Jaminan) <span className="text-red-500">*</span>
              </label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl ${isDark ? 'border-white/20 hover:border-primary/50 bg-[#1e1f23]/50' : 'border-gray-300 hover:border-primary/50 bg-gray-50'}`}>
                <div className="space-y-1 text-center w-full">
                  {formData.id_photo ? (
                    <div className="flex flex-col items-center">
                      <img src={formData.id_photo} alt="Preview ID" className="h-40 w-auto object-contain mb-3 rounded-lg border border-gray-500/30 shadow-md" />
                      <button type="button" onClick={() => setFormData({...formData, id_photo: ''})} className="text-sm px-4 py-1.5 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20 transition">Hapus Foto</button>
                    </div>
                  ) : (
                    <>
                      <Icon name="badge" className={`mx-auto h-12 w-12 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                      <div className="flex text-sm text-gray-600 justify-center mt-2">
                        <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                          <span>Klik untuk Upload File</span>
                          <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) { // Batas 2MB
                                toast.error('Ukuran maksimal foto 2MB bro!');
                                e.target.value = '';
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => setFormData({ ...formData, id_photo: reader.result });
                              reader.readAsDataURL(file); // Convert gambar ke Base64
                            }
                          }} />
                        </label>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>PNG, JPG, atau JPEG (Maks 2MB)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ✅ RENDER KONDISIONAL: Muncul kalau butuh Surat Pengantar PDF */}
          {item?.require_letter && (
            <div>
              <label className={labelClass}>
                Unggah Surat Peminjaman Resmi <span className="text-red-500">*</span>
              </label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl ${isDark ? 'border-white/20 hover:border-primary/50 bg-[#1e1f23]/50' : 'border-gray-300 hover:border-primary/50 bg-gray-50'}`}>
                <div className="space-y-1 text-center w-full">
                  {formData.attachment ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
                        <Icon name="picture_as_pdf" />
                        <span className="text-sm font-medium">Surat_Terlampir.pdf</span>
                      </div>
                      <button type="button" onClick={() => setFormData({...formData, attachment: ''})} className="text-sm px-4 py-1.5 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20 transition">Hapus File</button>
                    </div>
                  ) : (
                    <>
                      <Icon name="upload_file" className={`mx-auto h-12 w-12 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                      <div className="flex text-sm text-gray-600 justify-center mt-2">
                        <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                          <span>Klik untuk Upload PDF</span>
                          <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 3 * 1024 * 1024) { // Batas 3MB buat PDF
                                toast.error('Ukuran maksimal PDF 3MB bro!');
                                e.target.value = '';
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => setFormData({ ...formData, attachment: reader.result });
                              reader.readAsDataURL(file); // Convert PDF ke Base64
                            }
                          }} />
                        </label>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Hanya format PDF (Maks 3MB)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Catatan (Opsional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className={inputClass}
              placeholder="Catatan tambahan jika ada..."
            />
          </div>

          {/* ✅ Checkbox Persetujuan Legal */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-0.5">
                <input 
                  type="checkbox" 
                  required
                  className="peer appearance-none w-5 h-5 border-2 rounded-md checked:bg-primary checked:border-primary border-gray-400 transition-all cursor-pointer"
                />
                <Icon name="check" className="absolute text-white text-sm opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className={`text-sm leading-relaxed select-none ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                Saya menjamin data ini benar dan bersedia mematuhi <a href="/how-to-borrow" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Aturan Peminjaman</a> yang berlaku, termasuk sanksi keterlambatan.
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
            <button
              type="button"
              onClick={() => navigate('/items')}
              className={`flex-1 py-3 rounded-xl font-medium text-sm transition ${
                isDark 
                  ? 'bg-[#1e1f23] border border-white/10 text-white hover:bg-white/5' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Konfirmasi Peminjaman'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ✅ UI PRO OTS: MODAL EDUKASI "MASA TUNGGU" */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`max-w-md w-full p-8 rounded-3xl shadow-2xl animate-zoom-in text-center ${isDark ? 'bg-[#1e1f23] border border-white/10' : 'bg-white border border-gray-200'}`}>
            
            {/* Animasi Jam Pasir (Nunggu ACC) */}
            <div className="mx-auto w-20 h-20 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              <Icon name="hourglass_empty" className="text-4xl animate-pulse" />
            </div>
            
            <h2 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Pengajuan Diproses!</h2>
            
            <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              Pengajuan pinjam <span className="font-bold text-primary">{item?.name}</span> kamu sudah masuk ke antrean sistem.
            </p>

            {/* Kotak Instruksi Anti-Bingung */}
            <div className={`p-5 rounded-2xl text-left mb-8 border ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <p className="text-xs font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Icon name="info" className="text-[16px]" /> Instruksi Selanjutnya:
              </p>
              <ul className="text-[13px] space-y-2.5 list-disc pl-4 opacity-90 font-medium">
                <li>Sistem sedang menunggu <b>Persetujuan (ACC)</b> dari Admin.</li>
                <li>Tunggu pesan notifikasi otomatis dari <b>WhatsApp</b>, ATAU pantau halaman <b>Cek Status</b>.</li>
                <li className="text-orange-500 dark:text-orange-400">Jika status sudah <b>Disetujui</b>, barulah temui Admin di ruangan.</li>
              </ul>
            </div>

            {/* Tombol yang nge-redirect beneran */}
            <button
              onClick={() => navigate('/items', { state: { refresh: Date.now() } })}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Icon name="check_circle" className="text-xl" /> Saya Mengerti
            </button>
            
          </div>
        </div>
      )}

    </main>
  )
}

export default BorrowFormPage