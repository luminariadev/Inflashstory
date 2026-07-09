import { useState, useEffect } from 'react'
import Icon from './Icon'
import API from '../api'
import toast from 'react-hot-toast'

import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { id } from 'date-fns/locale'
registerLocale('id', id)

const BookingModal = ({ isOpen, onClose, item, isDark = true }) => {
  if (!isOpen || !item) return null

  const [submitting, setSubmitting] = useState(false)
  const [activeBookings, setActiveBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  
  // ✅ STATE BARU: Buat nyimpen data tiket pas sukses booking
  const [successTicket, setSuccessTicket] = useState(null) 
  const [isAgreed, setIsAgreed] = useState(false)

  const [formData, setFormData] = useState({
    borrower_name: '',
    identity_no: '',
    // ✅ TAMBAHAN BIAR IDENTIK SAMA FORM OTS
    study_program: '',
    class: '',
    phone: '',
    purpose: '',
    start_date: null,
    est_return_date: null,
    notes: '',
    id_photo: '', 
    attachment: '' 
  })

  useEffect(() => {
    if (isOpen && item) {
      fetchBookings()
    }
  }, [isOpen, item])

  const fetchBookings = async () => {
    setLoadingBookings(true)
    try {
      const response = await API.get(`/items/${item.id}/bookings`)
      setActiveBookings(response.data.data || [])
    } catch (error) {
      console.error("Gagal memuat jadwal:", error)
    } finally {
      setLoadingBookings(false)
    }
  }

  // ✅ DATE PARSER NORMAL (Karena backend Go udah sehat)
  const getLocalDate = (dateString) => {
    if (!dateString) return new Date()
    return new Date(dateString) 
  }

  const formatSchedule = (start, end) => {
    const startDate = getLocalDate(start)
    const endDate = getLocalDate(end)
    const dateOpt = { day: 'numeric', month: 'short', year: 'numeric' }
    const timeOpt = { hour: '2-digit', minute: '2-digit' }
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${startDate.toLocaleDateString('id-ID', dateOpt)} (${startDate.toLocaleTimeString('id-ID', timeOpt)} - ${endDate.toLocaleTimeString('id-ID', timeOpt)} WIB)`
    }
    return `${startDate.toLocaleDateString('id-ID', dateOpt)} ${startDate.toLocaleTimeString('id-ID', timeOpt)} s/d ${endDate.toLocaleDateString('id-ID', dateOpt)} ${endDate.toLocaleTimeString('id-ID', timeOpt)}`
  }

  // ✅ FIX MULTI-STOK: Hitung total overlap, baru blokir jika sudah menyentuh batas total_stock
  const isTimeConflicting = (timeCheck) => {
    const overlapCount = activeBookings.filter(trx => {
      const start = getLocalDate(trx.borrow_date)
      const end = getLocalDate(trx.est_return_date)
      return timeCheck >= start && timeCheck < end
    }).length
    return overlapCount >= (item?.total_stock || 1)
  }

  // ✅ FIX MULTI-STOK: Cari batas tanggal kembali maksimal berdasarkan kuota total_stock
  const getMaxReturnDate = () => {
    const defaultMax = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Batas 14 hari bawaan modal booking
    if (!formData.start_date) return defaultMax

    const start = formData.start_date.getTime()
    const totalStock = item?.total_stock || 1

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

  // ✅ FIX MULTI-STOK: Validasi jam operasional, konflik stok, dan melompati rentang jadwal yang sudah penuh
  const filterAvailableTimes = (time) => {
    const selectedDate = new Date(time)
    const hours = selectedDate.getHours()
    
    if (hours < 8 || hours >= 16) return false
    if (isTimeConflicting(selectedDate)) return false

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

  // ✅ LOGIC HIGHLIGHT RENTANG TANGGAL DENGAN WARNA DINAMIS
  const getDayClassName = (date) => {
    // Hilangkan jam, fokus murni ke tanggalnya aja (jam 00:00:00)
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

    // Cari tahu tanggal ini masuk ke rentang booking yang mana (index ke berapa)
    const bookingIndex = activeBookings.findIndex(trx => {
      const startObj = getLocalDate(trx.borrow_date)
      const endObj = getLocalDate(trx.est_return_date)
      
      const start = new Date(startObj.getFullYear(), startObj.getMonth(), startObj.getDate()).getTime()
      const end = new Date(endObj.getFullYear(), endObj.getMonth(), endObj.getDate()).getTime()
      
      return checkDate >= start && checkDate <= end // Cek apakah di antara rentang!
    })

    if (bookingIndex !== -1) {
      // Pilih 1 dari 3 varian warna berdasarkan urutan antrean (modulo)
      const colorVariant = (bookingIndex % 3) + 1
      return `has-booking-range-${colorVariant}`
    }
    return undefined
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.start_date || !formData.est_return_date) {
      toast.error('Waktu pengambilan dan pengembalian wajib diisi!')
      return
    }

    const isRuanganOrRequireLetter = item?.category_type === 'Ruangan' || item?.require_letter;
    if (isRuanganOrRequireLetter) {
      if (!formData.attachment) {
        toast.error('Surat permohonan (PDF) wajib diunggah!')
        return
      }
      if (!formData.id_photo) {
        toast.error('Foto KTP wajib diunggah!')
        return
      }
    }

    const diffTime = Math.abs(formData.est_return_date - formData.start_date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 7) {
      toast.error('Maksimal peminjaman via web adalah 7 hari!')
      return
    }

    setSubmitting(true)

    // ✅ FST INTEGRATION: Proses Upload File secara paralel (biar cepat)
    let finalSuratUrl = '';
    let finalKtpUrl = '';

    try {
      const uploadPromises = [];

      if (formData.attachment instanceof File) {
        const suratData = new FormData();
        suratData.append('file', formData.attachment);
        suratData.append('type', 'surat');
        uploadPromises.push(
          API.post('/upload', suratData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(res => { finalSuratUrl = res.data.file_path })
        );
      }

      if (formData.id_photo instanceof File) {
        const ktpData = new FormData();
        ktpData.append('file', formData.id_photo);
        ktpData.append('type', 'ktp');
        uploadPromises.push(
          API.post('/upload', ktpData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(res => { finalKtpUrl = res.data.file_path })
        );
      }

      await Promise.all(uploadPromises);
    } catch (error) {
      toast.error('Upload dokumen gagal: ' + (error.response?.data?.error || error.message));
      setSubmitting(false);
      return;
    }

    // ✅ FIX: Kirim tanggal murni sesuai yang dipilih, tanpa ngubah zona waktu!
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
      id_photo: '', // Kosongkan base64 lama
      attachment: '', // Kosongkan base64 lama
      start_date: formatToGo(formData.start_date),
      est_return_date: formatToGo(formData.est_return_date),
      type: 'booking',
      surat_url: finalSuratUrl,
      ktp_url: finalKtpUrl
    }
    
    try {
      const response = await API.post(`/borrow/${item.id}`, payload)
      if (response.data.status === 'success') {
        // ✅ Alert dilamain jadi 5 detik (5000ms)
        toast.success(`Booking sukses! Silakan simpan resi Anda.`, { duration: 5000 })

        // ✅ FIX R14: Optional chaining to handle empty object {}
        const ticketData = response.data.transaction?.id ? response.data.transaction : {
          id: 'PROSES-ACC',
          transaction_code: 'TRX-MENUNGGU-ACC'
        }

        setSuccessTicket(ticketData)
        setSubmitting(false)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal memproses booking.'
      toast.error(errorMessage)
      setSubmitting(false)
    }
  }

  // ✅ FUNGSI BARU: Buat nutup modal tiket setelah user puas nge-screenshot
  const handleFinishBooking = () => {
    onClose()
    window.location.reload()
  }

  const modalClass = isDark ? 'bg-[#121215] border border-white/10' : 'bg-white border border-gray-200'
  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const inputClass = isDark 
    ? 'bg-[#1e1f23] border border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 w-full outline-none transition' 
    : 'bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 w-full outline-none transition'
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`

  return (
    // ✅ UBAH ONCLICK DI SINI: Biar modal nggak ketutup pas user mau SS tiket
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={successTicket ? null : onClose}>
      
      {/* ✅ INJEKSI CSS SUPER SAKTI UNTUK MENGHITAMKAN DATEPICKER */}
      <style>{`
        /* Portal Z-Index biar melayang di atas modal */
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
        
        .react-datepicker {
          font-family: inherit !important;
          background-color: #1e1f23 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .react-datepicker__header {
          background-color: #121215 !important;
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        }
        .react-datepicker__current-month, .react-datepicker-time__header { color: #fff !important; }
        .react-datepicker__day-name { color: #888 !important; }
        .react-datepicker__day { color: #ccc !important; border-radius: 6px !important; }
        .react-datepicker__day:hover { background-color: rgba(99, 102, 241, 0.5) !important; color: white !important; }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected { background-color: #6366f1 !important; color: white !important; font-weight: bold; }
        
        /* ✅ Style Tanggal Kadaluarsa / Lewat Batas 14 Hari */
        .react-datepicker__day--disabled { 
          color: #3f3f46 !important; /* Warna abu-abu sangat gelap */
          text-decoration: line-through !important; /* Dicoret */
          cursor: not-allowed !important; /* Kursor dilarang */
          background-color: transparent !important;
        }
        .react-datepicker__day--disabled:hover {
          background-color: transparent !important;
          color: #3f3f46 !important;
        }
        
        /* ✅ Varian Warna untuk Rentang Booking */
        .has-booking-range-1 { background-color: rgba(249, 115, 22, 0.15) !important; color: #f97316 !important; font-weight: bold; border-radius: 6px !important; } /* Oranye */
        .has-booking-range-2 { background-color: rgba(6, 182, 212, 0.15) !important; color: #06b6d4 !important; font-weight: bold; border-radius: 6px !important; } /* Cyan */
        .has-booking-range-3 { background-color: rgba(244, 63, 94, 0.15) !important; color: #f43f5e !important; font-weight: bold; border-radius: 6px !important; } /* Merah Muda / Rose */
        
        .has-booking-range-1:hover, .has-booking-range-2:hover, .has-booking-range-3:hover {
          filter: brightness(1.3);
        }
        
        .react-datepicker__time-container { border-left: 1px solid rgba(255,255,255,0.1) !important; }
        .react-datepicker__time { background-color: #1e1f23 !important; }
        .react-datepicker__time-list-item { color: #ccc !important; transition: all 0.2s; }
        .react-datepicker__time-list-item:hover { background-color: rgba(99, 102, 241, 0.3) !important; color: white !important; }
        .react-datepicker__time-list-item--selected { background-color: #6366f1 !important; color: white !important; font-weight: bold; }
        .react-datepicker__time-list-item--disabled { color: #333 !important; cursor: not-allowed !important; text-decoration: line-through; }
      `}</style>

      {/* ✅ CEK APAKAH BOOKING SUKSES? KALAU SUKSES, TAMPILIN TIKET INI: */}
      {successTicket ? (
        <div className="bg-white max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl animate-zoom-in" onClick={(e) => e.stopPropagation()}>
          <div className="bg-orange-100 p-3 text-center border-b border-orange-200">
            <p className="text-orange-600 text-xs font-bold animate-pulse">⚠️ SCREENSHOT HALAMAN INI SEKARANG!</p>
            <p className="text-orange-500 text-[10px] mt-0.5">Tiket ini hanya muncul satu kali untuk keamanan.</p>
          </div>
          <div className="bg-purple-600 p-6 text-center text-white">
            <Icon name="inventory_2" className="text-5xl mb-2 opacity-90" />
            <h3 className="font-bold text-lg tracking-widest opacity-80 uppercase">RESI BOOKING</h3>
            <p className="text-3xl font-black mt-2 tracking-widest drop-shadow-md">
              {successTicket.transaction_code || `TRX-${successTicket.id}`}
            </p>
          </div>
          <div className="relative h-6 bg-white">
            <div className="absolute left-[-12px] top-0 w-6 h-6 bg-black/80 rounded-full"></div>
            <div className="absolute right-[-12px] top-0 w-6 h-6 bg-black/80 rounded-full"></div>
            <div className="absolute top-1/2 left-4 right-4 border-t-2 border-dashed border-gray-300"></div>
          </div>
          <div className="p-6 bg-white text-gray-800 space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Nama Peminjam</p>
              <p className="text-base font-black">{formData.borrower_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Jalur</p>
                <p className="text-sm font-bold text-purple-600">Web Booking</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">NIM / NIP</p>
                <p className="text-sm font-bold">{formData.identity_no}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Barang yang Dibooking</p>
              <p className="text-sm font-bold line-clamp-1">{item.name}</p>
              <p className="text-xs text-gray-500 mt-2">🕒 Ambil: {formData.start_date?.toLocaleString('id-ID', {day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'}).replace('.', ':')} WIB</p>
            </div>
            <button onClick={handleFinishBooking} className="w-full mt-4 bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2">
              <Icon name="check_circle" className="text-lg" /> Sudah di-Screenshot, Selesai!
            </button>
          </div>
        </div>
      ) : (
        /* ❌ INI ADALAH FORM BOOKING LAMA LU (TETEP SAMA, CUMA DIBUNGKUS KE DALAM ELSE TERNARY) */
        <div className={`${modalClass} max-w-2xl w-full max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl animate-zoom-in flex flex-col`} onClick={(e) => e.stopPropagation()}>
          <div className={`sticky top-0 z-10 flex justify-between items-center p-6 border-b ${isDark ? 'border-white/10 bg-[#121215]/90 backdrop-blur-md' : 'border-gray-200 bg-white/90 backdrop-blur-md'}`}>
            <div className="space-y-1">
              <h3 className={`text-xl sm:text-2xl font-bold ${titleClass}`}>Form Booking Barang</h3>
              <p className="text-primary text-xs font-bold tracking-wider uppercase">Amankan Jadwal {item.name}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition">
              <Icon name="close" className="text-xl" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className={`p-4 rounded-xl border flex gap-3 items-start ${isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
              <Icon name="calendar_month" className="text-xl shrink-0 mt-0.5" />
              <div className="text-sm w-full">
                <p className="font-bold mb-2">Jadwal yang sudah Ter-Booking:</p>
                {loadingBookings ? (
                  <p className="text-xs animate-pulse">Memuat jadwal...</p>
                ) : activeBookings.length > 0 ? (
                  <ul className="space-y-2">
                    {activeBookings.map((trx, idx) => {
                      const bulletColors = ['bg-orange-500', 'bg-cyan-500', 'bg-rose-500']
                      const bulletColor = bulletColors[idx % 3]
                      return (
                        <li key={trx.id} className="flex items-center gap-2 text-xs font-medium">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${bulletColor} shadow-[0_0_8px_currentColor] opacity-80`}></span> 
                          <span>{formatSchedule(trx.borrow_date, trx.est_return_date)}</span>
                          {trx.status === 'pending' && <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[10px] font-bold border border-yellow-500/30">Menunggu ACC</span>}
                          {trx.status === 'approved' && <span className="ml-1 px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded text-[10px] font-bold border border-green-500/30">Disetujui</span>}
                          {trx.status === 'borrowed' && <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded text-[10px] font-bold border border-red-500/30">Sedang Dipakai</span>}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-xs opacity-80 italic">Belum ada antrean. Jadwal sepenuhnya kosong!</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" name="borrower_name" value={formData.borrower_name} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>NIM / NIP <span className="text-red-500">*</span></label>
                  <input type="text" name="identity_no" value={formData.identity_no} onChange={handleChange} required className={inputClass} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Program Studi</label>
                  <input type="text" name="study_program" value={formData.study_program} onChange={handleChange} className={inputClass} placeholder="Contoh: Teknik Informatika" />
                </div>
                <div>
                  <label className={labelClass}>Kelas / Angkatan</label>
                  <input type="text" name="class" value={formData.class} onChange={handleChange} className={inputClass} placeholder="Contoh: IF-6 / 2022" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nomor WA <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Keperluan <span className="text-red-500">*</span></label>
                  <input type="text" name="purpose" value={formData.purpose} onChange={handleChange} required className={inputClass} />
                </div>
              </div>

              <div className={`p-5 rounded-xl border space-y-4 relative ${isDark ? 'bg-[#1e1f23]/30 border-white/10' : 'bg-gray-50/50 border-gray-200'}`}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className={labelClass}>Waktu Pengambilan <span className="text-red-500">*</span></label>
                    <DatePicker
                      selected={formData.start_date}
                      onChange={(date) => setFormData({ ...formData, start_date: date, est_return_date: null })}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      timeCaption="Waktu"
                      dateFormat="d MMMM yyyy, HH:mm"
                      locale="id"
                      minDate={new Date()}
                      maxDate={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)}
                      filterTime={filterAvailableTimes}
                      dayClassName={getDayClassName} 
                      className={inputClass}
                      placeholderText="Pilih tanggal & jam ambil"
                      portalId="datepicker-portal"
                      required
                    />
                  </div>
                  <div className="relative">
                    <label className={labelClass}>Waktu Pengembalian <span className="text-red-500">*</span></label>
                    <DatePicker
                      selected={formData.est_return_date}
                      onChange={(date) => setFormData({ ...formData, est_return_date: date })}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      timeCaption="Waktu"
                      dateFormat="d MMMM yyyy, HH:mm"
                      locale="id"
                      minDate={formData.start_date || new Date()}
                      maxDate={getMaxReturnDate()}
                      filterTime={filterAvailableTimes}
                      dayClassName={getDayClassName}
                      className={inputClass}
                      placeholderText="Pilih tanggal & jam kembali"
                      disabled={!formData.start_date}
                      portalId="datepicker-portal"
                      required
                    />
                  </div>
                </div>
                <div className={`text-xs space-y-1.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  <p className="flex items-center gap-1.5"><Icon name="schedule" className="text-[14px] text-blue-500" /> Wajib di jam operasional: 08:00 - 16:00 WIB.</p>
                  <p className="flex items-center gap-1.5"><Icon name="event_upcoming" className="text-[14px] text-primary" /> Tanggal <strong>Berwarna</strong> berarti ada jadwal terisi. Cek dropdown jam untuk sisa slot.</p>
                </div>
              </div>

              {/* ✅ FST INTEGRATION: Input Dokumen KTP & Surat Permohonan */}
              {(item?.category_type === 'Ruangan' || item?.require_letter) && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Upload KTP (JPG/PNG) <span className="text-red-500">*</span></label>
                    <div className={`mt-1 flex justify-center px-4 pt-4 pb-5 border-2 border-dashed rounded-3xl ${isDark ? 'border-white/20 hover:border-primary/50 bg-[#1e1f23]/50' : 'border-gray-300 hover:border-primary/50 bg-gray-50'} transition-colors duration-300`}>
                      <div className="space-y-1 text-center w-full">
                        {formData.id_photo ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20">
                              <Icon name="check_circle" className="text-sm" />
                              <span className="text-xs font-medium">{formData.id_photo instanceof File ? formData.id_photo.name : 'KTP_Terlampir'}</span>
                            </div>
                            <button type="button" onClick={() => setFormData({ ...formData, id_photo: '' })} className="text-xs px-3 py-1 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition">Hapus</button>
                          </div>
                        ) : (
                          <>
                            <Icon name="badge" className={`mx-auto h-10 w-10 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                            <div className="flex text-sm text-gray-600 justify-center mt-1">
                              <label className="relative cursor-pointer rounded-xl font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                                <span>Pilih File KTP</span>
                                <input type="file" accept="image/jpeg, image/png, image/jpg" className="sr-only" required onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file && file.size <= 5*1024*1024) {
                                    setFormData({...formData, id_photo: file});
                                  } else { toast.error('Maks 5MB dan harus format gambar'); e.target.value=''; }
                                }} />
                              </label>
                            </div>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>JPG/PNG (Maks 5MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Upload Surat PDF <span className="text-red-500">*</span></label>
                    <div className={`mt-0 flex justify-center px-4 pt-4 pb-5 border-2 border-dashed rounded-3xl ${isDark ? 'border-white/20 hover:border-primary/50 bg-[#1e1f23]/50' : 'border-gray-300 hover:border-primary/50 bg-gray-50'} transition-colors duration-300`}>
                      <div className="space-y-1 text-center w-full">
                        {formData.attachment ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                              <Icon name="picture_as_pdf" className="text-sm" />
                              <span className="text-xs font-medium">{formData.attachment instanceof File ? formData.attachment.name : 'Surat_Terlampir.pdf'}</span>
                            </div>
                            <button type="button" onClick={() => setFormData({ ...formData, attachment: '' })} className="text-xs px-3 py-1 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition">Hapus</button>
                          </div>
                        ) : (
                          <>
                            <Icon name="upload_file" className={`mx-auto h-10 w-10 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                            <div className="flex text-sm text-gray-600 justify-center mt-1">
                              <label className="relative cursor-pointer rounded-xl font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                                <span>Pilih File PDF</span>
                                <input type="file" accept=".pdf" className="sr-only" required onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file && file.size <= 5*1024*1024) {
                                    setFormData({...formData, attachment: file});
                                  } else { toast.error('Maks 5MB dan harus format PDF'); e.target.value=''; }
                                }} />
                              </label>
                            </div>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Hanya PDF (Maks 5MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Catatan Tambahan (Opsional)</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className={`${inputClass} resize-none`} placeholder="Contoh: Butuh kabel power tambahan..." />
              </div>

              <div className="pt-2 border-t border-white/10 mt-6 pt-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    required 
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 cursor-pointer" 
                  />
                  <span className={`text-sm leading-relaxed select-none ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    {item?.category_type === 'Ruangan'
                      ? "Saya setuju dengan Syarat & Ketentuan peminjaman ruangan, termasuk mematuhi batas jam operasional (maksimal pukul 21.00 WIB) dan DILARANG KERAS menempelkan spanduk fisik pada layar Videotron."
                      : "Saya setuju dengan Syarat & Ketentuan peminjaman inventaris dan bersedia menjaga barang dengan baik."}
                  </span>
                </label>
              </div>

              {/* BANNER WAJIB KTP FISIK */}
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mt-4 mb-2 text-sm font-semibold text-center shadow-sm">
                ⚠️ PERHATIAN: KTP fisik asli WAJIB diserahkan kepada Admin sebagai jaminan saat pengambilan barang atau kunci ruangan.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-medium text-sm transition bg-white/5 hover:bg-white/10 text-white">
                  Batal
                </button>
                <button type="submit" disabled={submitting || !isAgreed} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:brightness-110 transition disabled:opacity-50">
                  {submitting ? 'Memproses...' : 'Booking Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} {/* ✅ INI PENUTUP LOGIKA TIKET vs FORM */}
    </div>
  )
}

export default BookingModal