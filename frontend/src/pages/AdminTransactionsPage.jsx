import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'
import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { id } from 'date-fns/locale'
registerLocale('id', id)

const AdminTransactionsPage = () => {
  const [isDark, setIsDark] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReturnModal, setShowReturnModal] = useState(null)
  const [showAttachmentModal, setShowAttachmentModal] = useState(null) 
  const [confirmModal, setConfirmModal] = useState(null) 
  const [rejectReason, setRejectReason] = useState('') // ✅ STATE BARU: Alasan penolakan
  const [returnNotes, setReturnNotes] = useState('') // ✅ STATE BARU: Catatan pas barang dibalikin
  
  // ✅ STATE BARU: Modal Input Peminjaman Manual
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({
    item_id: '',
    borrower_name: '',
    identity_no: '',
    phone: '',
    purpose: '',
    type: 'ots',
    borrow_date: null,
    est_return_date: null
  })
  const [items, setItems] = useState([])
  const [searchItem, setSearchItem] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [txTypeFilter, setTxTypeFilter] = useState('all') 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false) 

  // ✅ STATE BARU: Konfigurasi Sorting ala Excel
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  // ✅ FUNGSI BARU: Nangkep klik dari judul kolom tabel
  const handleSort = (key) => {
    let direction = 'asc' // Default pas diklik pertama kali
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc' // Klik kedua jadi turun
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null // Klik ketiga balik ke default database
      key = null
    }
    
    setSortConfig({ key, direction })
  }

  const isNeedReminder = (estDate) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const returnDate = new Date(estDate)
    returnDate.setHours(0, 0, 0, 0)
    const diffDays = (returnDate - today) / (1000 * 60 * 60 * 24)
    return diffDays <= 1
  }

  // ✅ FUNGSI PENDETEKSI BOOKING/OTS (Udah di-Fix biar badge-nya PASTI MUNCUL)
  const getTransactionType = (trx) => {
    if (!trx.borrow_date || !trx.created_at) return 'ots'
    const borrowTime = new Date(trx.borrow_date).getTime()
    const createdTime = new Date(trx.created_at).getTime()
    
    // Kita kasih toleransi 5 menit. 
    // Kalau jadwal ambilnya LEBIH dari 5 menit dari waktu form dikirim, fix itu Booking!
    const diffMinutes = (borrowTime - createdTime) / (1000 * 60)
    return diffMinutes > 5 || diffMinutes < -5 ? 'booking' : 'ots'
  }

  // ✅ FILTER GABUNGAN: Status + Tipe Jalur
  const filteredTransactions = transactions.filter(trx => {
    // 1. Cek Status (Lebih dinamis dan mencakup Ditolak/Dikembalikan)
    let statusMatch = true
    if (activeTab !== 'all') {
      if (activeTab === 'reminder') {
        statusMatch = trx.status === 'borrowed' && isNeedReminder(trx.est_return_date)
      } else {
        statusMatch = trx.status === activeTab
      }
    }

    // 2. Cek Jalur Transaksi (Pemisah Booking vs OTS)
    let typeMatch = true
    const trxType = getTransactionType(trx)
    if (txTypeFilter === 'booking') typeMatch = trxType === 'booking'
    if (txTypeFilter === 'ots') typeMatch = trxType === 'ots'

    return statusMatch && typeMatch
  })

  // ✅ LOGIKA BARU: Terapkan Pengurutan (Sorting) ke Data yang Udah di-Filter
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortConfig.key) return 0 // Kalau null, biarin urutan asli database

    let aValue, bValue
    
    // Tarik value berdasarkan kolom yang mau di-sort
    if (sortConfig.key === 'borrower') {
      aValue = (a.borrower?.name || '').toLowerCase()
      bValue = (b.borrower?.name || '').toLowerCase()
    } else if (sortConfig.key === 'borrow_date') {
      aValue = new Date(a.borrow_date).getTime()
      bValue = new Date(b.borrow_date).getTime()
    } else if (sortConfig.key === 'est_return_date') {
      aValue = new Date(a.est_return_date).getTime()
      bValue = new Date(b.est_return_date).getTime()
    }

    // Logic perbandingan
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.body.classList.contains('light-theme'))
    }
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    
    const token = localStorage.getItem('adminToken')
    if (token !== 'admin-secret-key') {
      window.location.href = '/admin/login'
    } else {
      fetchTransactions()
    }
    
    return () => observer.disconnect()
  }, [])

  // ✅ FETCH ITEMS SAAT MODAL MANUAL DIBUKA
  useEffect(() => {
    if (showManualModal && items.length === 0) {
      API.get('/items').then(res => {
        setItems(res.data.data.filter(i => i.status === 'available'))
      }).catch(err => {
        toast.error('Gagal memuat daftar barang')
      })
    }
  }, [showManualModal, items.length])

  // ✅ LOGIKA SAKTI ANTI BENTROK JAM & HIGHLIGHT WARNA KHUSUS ADMIN
  const getLocalDate = (dateString) => {
    if (!dateString) return new Date()
    return new Date(dateString)
  }

  // Ambil antrean aktif khusus untuk barang yang sedang dipilih di form manual
  const activeBookings = transactions.filter(trx => 
    trx.item?.id === parseInt(manualForm.item_id) && 
    ['pending', 'approved', 'borrowed'].includes(trx.status)
  )

  const isTimeConflicting = (timeCheck) => {
    const selectedItem = items.find(i => i.id.toString() === manualForm.item_id)
    const overlapCount = activeBookings.filter(trx => {
      const start = getLocalDate(trx.borrow_date)
      const end = getLocalDate(trx.est_return_date)
      return timeCheck >= start && timeCheck < end
    }).length
    return overlapCount >= (selectedItem?.total_stock || 1)
  }

  const getMaxReturnDate = () => {
    // Kalau Booking: Maks 7 hari dari tgl ambil
    // Kalau OTS: Maks 7 hari dari hari ini
    const maxDays = 7
    let baseDate = new Date()
    
    if (manualForm.type === 'booking' && manualForm.borrow_date) {
      baseDate = manualForm.borrow_date
    }

    const defaultMax = new Date(baseDate.getTime() + maxDays * 24 * 60 * 60 * 1000)
    
    // Cek tembok bentrok stok
    if (!manualForm.borrow_date && manualForm.type === 'booking') return defaultMax

    const start = manualForm.type === 'ots' ? new Date().getTime() : manualForm.borrow_date.getTime()
    const selectedItem = items.find(i => i.id.toString() === manualForm.item_id)
    const totalStock = selectedItem?.total_stock || 1

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

  const filterAvailableTimes = (time) => {
    const selectedDate = new Date(time)
    const hours = selectedDate.getHours()
    
    if (hours < 8 || hours >= 16) return false
    if (isTimeConflicting(selectedDate)) return false

    const startObj = manualForm.type === 'ots' ? new Date() : manualForm.borrow_date
    if (startObj) {
      const start = startObj.getTime()
      const checkTime = selectedDate.getTime()
      const selectedItem = items.find(i => i.id.toString() === manualForm.item_id)
      const totalStock = selectedItem?.total_stock || 1
      
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

  const fetchTransactions = async () => {
    try {
      const response = await API.get('/admin/transactions', {
        headers: { 'X-Admin-Token': 'admin-secret-key' }
      })
      setTransactions(response.data.data)
    } catch (error) {
      toast.error('Gagal memuat data transaksi')
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (transactionId) => {
    try {
      // ✅ Bikin teks dinamis: Kalau admin ngosongin, otomatis diisi teks default positif
      const finalNotes = returnNotes.trim() ? returnNotes : 'Barang dikembalikan dalam kondisi lengkap dan baik.'

      await API.post(`/admin/return/${transactionId}`, { notes: finalNotes }, {
        headers: { 'X-Admin-Token': 'admin-secret-key' }
      })
      toast.success('Barang berhasil dikembalikan')
      setShowReturnModal(null)
      setReturnNotes('') // Reset state biar ga nyangkut ke transaksi lain
      fetchTransactions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengembalikan barang')
    }
  }

  // ✅ FUNGSI BARU: Submit Manual Borrow
  const handleManualSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...manualForm,
        item_id: parseInt(manualForm.item_id)
      }

      // Validasi durasi & format tanggal
      if (payload.type === 'ots') {
        if (!payload.est_return_date) {
          toast.error('Estimasi kembali wajib diisi!')
          return
        }
        payload.borrow_date = new Date().toISOString()
      } else {
        if (!payload.borrow_date || !payload.est_return_date) {
          toast.error('Tanggal Peminjaman & Kembali wajib diisi untuk Booking!')
          return
        }
        payload.borrow_date = new Date(payload.borrow_date).toISOString()
      }

      // Validasi Durasi 7 Hari Maksimal
      const borrowDateObj = new Date(payload.borrow_date)
      const returnDateObj = new Date(payload.est_return_date)
      const diffTime = Math.abs(returnDateObj - borrowDateObj)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays > 7) {
        toast.error('Durasi maksimal peminjaman adalah 7 hari!')
        return
      }

      payload.est_return_date = returnDateObj.toISOString()

      await API.post('/admin/borrow/manual', payload, {
        headers: { 'X-Admin-Token': 'admin-secret-key' }
      })
      toast.success('Peminjaman manual berhasil dicatat!')
      setShowManualModal(false)
      setManualForm({ item_id: '', borrower_name: '', identity_no: '', phone: '', purpose: '', type: 'ots', borrow_date: null, est_return_date: null })
      fetchTransactions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mencatat peminjaman manual')
    }
  }

  // ✅ FIX FINAL: Fungsi WA yang Pinter Ngebedain "Jadwal Ambil" vs "Jadwal Balikin"
  const handleWhatsApp = (trx) => {
    let phone = trx.borrower?.phone || ''
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let message = ""

    if (trx.status === 'approved') {
      // 📦 LOGIKA 1: PENGINGAT AMBIL BARANG (BOOKING)
      const pickupDate = new Date(trx.borrow_date)
      pickupDate.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((pickupDate - today) / (1000 * 60 * 60 * 24))
      const pickupTimeStr = new Date(trx.borrow_date).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})

      if (diffDays < 0) {
        message = `Halo ${trx.borrower?.name},\n\nSistem Inventaris Jurusan mendeteksi Anda telah MELEWATI jadwal pengambilan barang *${trx.item?.name}* pada tanggal ${pickupDate.toLocaleDateString('id-ID')}.\n\nBooking Anda berpotensi dibatalkan (hangus). Harap segera konfirmasi ke Admin/TU.`
      } else if (diffDays === 0) {
        message = `Halo ${trx.borrower?.name},\n\nIni pengingat bahwa HARI INI adalah jadwal pengambilan barang *${trx.item?.name}* Anda.\n\nHarap datang ke lab/ruang jurusan jam ${pickupTimeStr} WIB. Sesuai aturan, telat ambil lebih dari 2 jam bisa membuat booking hangus lho. Ditunggu ya!`
      } else if (diffDays === 1) {
        message = `Halo ${trx.borrower?.name},\n\nSistem Inventaris Jurusan mengingatkan bahwa BESOK adalah jadwal Anda mengambil barang *${trx.item?.name}*.\n\nPersiapkan diri dan jangan lupa datang jam ${pickupTimeStr} WIB. Terima kasih!`
      } else {
        message = `Halo ${trx.borrower?.name},\n\nIni pengingat jadwal booking barang *${trx.item?.name}*. Jadwal pengambilan Anda adalah ${pickupDate.toLocaleDateString('id-ID')} jam ${pickupTimeStr} WIB.`
      }

    } else {
      // 🔄 LOGIKA 2: PENGINGAT BALIKIN BARANG (SEDANG DIPINJAM)
      const returnDate = new Date(trx.est_return_date)
      returnDate.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24))
      const returnTimeStr = new Date(trx.est_return_date).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})

      if (diffDays < 0) {
        message = `Halo ${trx.borrower?.name},\n\nSistem Inventaris Jurusan memberitahukan bahwa barang *${trx.item?.name}* yang Anda pinjam SUDAH MELEWATI batas waktu (terlambat ${Math.abs(diffDays)} hari).\n\nSegera kembalikan agar tidak kena argometer denda dan menghambat peminjam lain. Terima kasih.`
      } else if (diffDays === 0) {
        message = `Halo ${trx.borrower?.name},\n\nSistem Inventaris mengingatkan bahwa HARI INI batas waktu pengembalian *${trx.item?.name}*.\n\nMohon dikembalikan ke jurusan maksimal jam ${returnTimeStr} WIB ya.`
      } else if (diffDays === 1) {
        message = `Halo ${trx.borrower?.name},\n\nSistem Inventaris mengingatkan bahwa BESOK adalah jadwal pengembalian *${trx.item?.name}* Anda.\n\nPastikan barang aman dan kembali jam ${returnTimeStr} WIB. Terima kasih!`
      } else {
        message = `Halo ${trx.borrower?.name},\n\nPengingat dari Sistem Inventaris: Batas pengembalian *${trx.item?.name}* Anda adalah ${returnDate.toLocaleDateString('id-ID')} jam ${returnTimeStr} WIB.`
      }
    }

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  // Fungsi Buat Buka Modal Validasi
  const handleApproveClick = (trx, action) => {
    setConfirmModal({ trx, action })
  }

  // Fungsi Eksekusi Validasi (Jalan pas tombol "Ya" di modal di-klik)
  const executeApprove = async () => {
    if (!confirmModal) return;
    const { trx, action } = confirmModal;

    // ✅ CEGAT ADMIN AROGAN: Wajib isi alasan kalau nolak!
    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('Alasan penolakan wajib diisi!')
      return
    }

    try {
      await API.post(`/admin/transactions/${trx.id}/approve`, { 
        action: action,
        notes: rejectReason,
        trx_type: getTransactionType(trx) // ✅ TAMBAHIN INI: Teriak ke Golang ini OTS apa Booking!
      }, {
        headers: { 'X-Admin-Token': 'admin-secret-key' }
      })
      
      // ✅ FIX TOAST ALERT: Pisah teks kondisi biar gak typo "ditolak" pas Serahkan Barang
      let successMessage = 'Transaksi berhasil diproses!'
      if (action === 'approve') successMessage = 'Transaksi berhasil diterima!'
      if (action === 'reject') successMessage = '❌ Transaksi berhasil ditolak!'
      if (action === 'handover') successMessage = '📦 Barang fisik berhasil diserahkan!'
      
      toast.success(successMessage)

      // ✅ AUTO-WA JIKA DITOLAK
      if (action === 'reject') {
        let phone = trx.borrower?.phone || ''
        if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1)
        }
        
        const message = `Halo ${trx.borrower?.name},\n\nMohon maaf, pengajuan peminjaman barang *${trx.item?.name}* Anda DITOLAK oleh Admin.\n\n*Alasan Penolakan:*\n${rejectReason}\n\nSilakan perbaiki persyaratan atau ajukan ulang melalui web Inventaris. Terima kasih.`
        
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank') 
      }

      // ✅ AUTO-WA JIKA DITERIMA (ACC)
      if (action === 'approve') {
        let phone = trx.borrower?.phone || ''
        if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1)
        }
        
        // Deteksi ini jalur Booking atau OTS pakai fungsi yang udah ada
        const trxType = getTransactionType(trx)
        const pickupDate = formatDateTime(trx.borrow_date)
        let message = ""

        if (trxType === 'booking') {
          message = `Halo ${trx.borrower?.name},\n\nKabar baik! Pengajuan Web Booking untuk barang *${trx.item?.name}* Anda telah *DISETUJUI* oleh Admin. 🎉\n\n🗓️ *Jadwal Ambil:* ${pickupDate}\n\nHarap datang tepat waktu sesuai jadwal ya. Tunjukkan pesan WA ini ke Admin saat mengambil barang fisik. Terima kasih!`
        } else {
          message = `Halo ${trx.borrower?.name},\n\nPeminjaman *${trx.item?.name}* (Scan OTS) Anda hari ini telah *DISETUJUI* oleh Admin. ✅\n\nSilakan langsung terima barang fisiknya di ruang Admin. Pastikan menjaga barang dengan baik dan kembalikan tepat waktu ya!`
        }
        
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank')
      }

      setConfirmModal(null)
      fetchTransactions()
    } catch (error) {
      toast.error('Gagal memproses validasi')
    }
  }

  // ✅ FITUR SAKTI: EXPORT TO EXCEL (CSV)
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor!')
      return
    }

    // 1. Siapin Header Kolom Excel
    const headers = ['ID Transaksi', 'Jalur', 'Nama Peminjam', 'NIM/NIP', 'Barang', 'Tanggal Pinjam', 'Tgl Kembali (Est)', 'Status']

    // 2. Mapping Data Transaksi ke format baris
    const csvData = filteredTransactions.map(trx => {
      return [
        `TRX-${trx.id}`,
        `"${getTransactionType(trx).toUpperCase()}"`,
        `"${trx.borrower?.name || '-'}"`,
        `"${trx.borrower?.identity_no || '-'}"`,
        `"${trx.item?.name || '-'}"`,
        `"${new Date(trx.borrow_date).toLocaleString('id-ID')}"`,
        `"${new Date(trx.est_return_date).toLocaleString('id-ID')}"`,
        `"${getStatusText(trx.status)}"`
      ].join(',')
    })

    // 3. Gabungin Header dan Data pakai enter (\n)
    const csvString = [headers.join(','), ...csvData].join('\n')

    // 4. Bikin file virtual dan trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Laporan_Peminjaman_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Laporan berhasil diunduh!')
  }

  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const cardClass = isDark ? 'glass-card' : 'bg-white rounded-xl shadow-md border border-gray-200 p-4'
  
  const tableWrapperClass = isDark ? '' : 'border border-gray-200 rounded-xl overflow-hidden bg-white'
  const theadClass = isDark 
    ? 'border-b border-white/10' 
    : 'bg-gray-50 border-b border-gray-200'
  const thClass = `pb-3 pt-3 text-sm font-semibold px-4 ${titleClass}`
  const tdClass = `py-3 text-sm px-4`
  const inputClass = isDark 
    ? 'bg-[#1e1f23] border border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 w-full outline-none transition' 
    : 'bg-gray-50 border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 w-full outline-none transition'

  const statusBadgeClass = (status) => {
    if (status === 'borrowed') return 'bg-blue-500/20 text-blue-600'
    if (status === 'returned') return 'bg-green-500/20 text-green-600'
    if (status === 'pending') return 'bg-orange-500/20 text-orange-600'
    if (status === 'approved') return 'bg-purple-500/20 text-purple-600' // ✅ WARNA BARU (Ungu)
    if (status === 'rejected') return 'bg-red-500/20 text-red-600'
    return 'bg-gray-500/20 text-gray-600'
  }

  // ✅ HELPER TEXT STATUS BIAR RAPI
  const getStatusText = (status) => {
    if (status === 'borrowed') return 'Dipinjam'
    if (status === 'pending') return 'Menunggu'
    if (status === 'approved') return 'Siap Diambil'
    if (status === 'rejected') return 'Ditolak'
    return 'Dikembalikan'
  }

  // ✅ HELPER BARU: Format Tanggal + Jam Detail (Anti Buta Waktu)
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', ':') + ' WIB'
  }

  // ✅ HELPER BARU: Cek Kadaluwarsa dengan Toleransi Waktu (Booking vs OTS)
  const checkIsExpired = (trx) => {
    const now = new Date().getTime()
    const borrowDate = new Date(trx.borrow_date).getTime()
    const trxType = getTransactionType(trx)

    if (trxType === 'ots') {
      // OTS: Dikasih batas tunggu 30 Menit buat Admin nge-ACC
      const expiryTime = borrowDate + (30 * 60 * 1000)
      return now > expiryTime
    } else {
      // BOOKING: Dikasih toleransi telat 2 Jam (Sinkron sama Cron Job Golang!)
      const expiryTime = borrowDate + (2 * 60 * 60 * 1000)
      return now > expiryTime
    }
  }

  // ✅ DATA CUSTOM DROPDOWN: Pake icon asli biar profesional (bukan emoji)
  const statusOptions = [
    { value: 'all', label: 'Semua Status', icon: 'list_alt', color: isDark ? 'text-slate-400' : 'text-gray-500' },
    { value: 'pending', label: 'Menunggu ACC', icon: 'hourglass_empty', color: 'text-orange-500' },
    { value: 'approved', label: 'Siap Diambil', icon: 'inventory_2', color: 'text-purple-500' },
    { value: 'borrowed', label: 'Sedang Dipinjam', icon: 'sync_alt', color: 'text-blue-500' },
    { value: 'reminder', label: 'Diingatkan (Besok)', icon: 'notifications_active', color: 'text-yellow-500' },
    { value: 'returned', label: 'Dikembalikan', icon: 'check_circle', color: 'text-green-500' },
    { value: 'rejected', label: 'Ditolak / Hangus', icon: 'cancel', color: 'text-red-500' }
  ]
  
  // Cari option mana yang lagi aktif sekarang
  const currentOption = statusOptions.find(opt => opt.value === activeTab) || statusOptions[0]

  // ✅ CEK BARANG YANG DIPILIH BUTUH JAMINAN ATAU ENGGAK
  const selectedItem = items.find(i => i.id.toString() === manualForm.item_id)
  const isRequireJaminan = selectedItem && (
    (selectedItem.required_id && selectedItem.required_id !== 'none') || 
    selectedItem.require_letter
  )

  return (
    <div className="pb-12 space-y-6">
      {/* ✅ INJEKSI CSS SUPER SAKTI UNTUK MENGHITAMKAN DATEPICKER */}
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
      
      {/* ✅ HEADER BARU: SEKARANG ADA TOMBOL EXPORT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${titleClass}`}>Transaksi Peminjaman</h1>
          <p className={`text-sm mt-1 ${textClass}`}>Kelola dan pantau semua transaksi peminjaman</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowManualModal(true)} 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 hover:brightness-110 transition-all shadow-lg shadow-blue-600/30 w-full sm:w-auto"
          >
            <Icon name="add_circle" className="text-base" />
            Input Peminjaman
          </button>
          <button 
            onClick={handleExportCSV} 
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 hover:brightness-110 transition-all shadow-lg shadow-green-600/30 w-full sm:w-auto"
          >
            <Icon name="download" className="text-base" />
            Export ke Excel
          </button>
        </div>
      </div>

      {/* ✅ CONTAINER BARU BUAT BUNGKUS DUA FILTER SEKALIGUS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/5 pb-4">
        
        {/* ✅ FILTER STATUS BARU: CUSTOM DROPDOWN UI/UX (Mewah & Estetik) */}
        <div className="relative w-full lg:w-56 shrink-0">
          
          {/* Tombol Pemicu Dropdown */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center justify-between pl-4 pr-3 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border ${
              isDark 
                ? 'bg-surface-container-high border-white/10 text-white hover:bg-white/5' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon name={currentOption.icon} className={`text-[18px] ${currentOption.color}`} />
              <span>{currentOption.label}</span>
            </div>
            <Icon 
              name="expand_more" 
              className={`text-base transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'} ${isDark ? 'text-slate-400' : 'text-gray-400'}`} 
            />
          </button>

          {/* Isi Menu Dropdown */}
          {isDropdownOpen && (
            <>
              {/* Overlay gaib biar kalau klik di luar area, dropdownnya nutup */}
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
              
              <div className={`absolute left-0 right-0 mt-2 z-50 rounded-xl border shadow-2xl overflow-hidden animate-zoom-in ${
                isDark ? 'bg-surface-container-high border-white/10' : 'bg-white border-gray-200'
              }`}>
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setActiveTab(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all text-left border-b last:border-b-0 ${
                      isDark ? 'border-white/5' : 'border-gray-100'
                    } ${
                      activeTab === option.value
                        ? isDark ? 'bg-primary/20 text-white' : 'bg-primary/10 text-primary'
                        : isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon name={option.icon} className={`text-[18px] ${option.color}`} />
                    <span className="flex-1">{option.label}</span>
                    
                    {/* Munculin icon ceklis buat menu yang lagi dipilih */}
                    {activeTab === option.value && (
                      <Icon name="check" className={`text-base ${isDark ? 'text-primary' : 'text-primary'}`} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ✅ FILTER JALUR: PEMISAH BOOKING VS OTS! */}
        <div className={`flex items-center p-1 rounded-xl w-full lg:w-auto shrink-0 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-200 border border-gray-300'}`}>
          <button onClick={() => setTxTypeFilter('all')} className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${txTypeFilter === 'all' ? 'bg-slate-700 text-white shadow' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Semua Jalur</button>
          <button onClick={() => setTxTypeFilter('booking')} className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${txTypeFilter === 'booking' ? 'bg-purple-500 text-white shadow' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <Icon name="event_available" className="text-[14px]" /> Web Booking
          </button>
          <button onClick={() => setTxTypeFilter('ots')} className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${txTypeFilter === 'ots' ? 'bg-teal-500 text-white shadow' : isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <Icon name="qr_code_scanner" className="text-[14px]" /> Scan OTS
          </button>
        </div>
        
      </div>

      {loading ? (
        <div className={`text-center py-10 ${textClass}`}>Memuat data...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className={`text-center py-10 ${textClass}`}>Tidak ada transaksi pada kategori ini</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <div className={tableWrapperClass}>
              <table className="w-full min-w-[800px]">
                <thead className={theadClass}>
                  <tr className="text-left">
                    <th className={thClass}>ID</th>
                    <th className={thClass}>Barang</th>
                    
                    {/* ✅ KOLOM BISA DI-SORT: PEMINJAM */}
                    <th className={`${thClass} cursor-pointer hover:bg-white/5 transition group select-none`} onClick={() => handleSort('borrower')} title="Klik untuk mengurutkan">
                      <div className="flex items-center gap-1">
                        Peminjam
                        <Icon name={sortConfig.key === 'borrower' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className={`text-base transition-all ${sortConfig.key === 'borrower' ? 'text-primary' : 'opacity-30 group-hover:opacity-100'}`} />
                      </div>
                    </th>

                    {/* ✅ KOLOM BISA DI-SORT: TANGGAL PINJAM */}
                    <th className={`${thClass} cursor-pointer hover:bg-white/5 transition group select-none`} onClick={() => handleSort('borrow_date')} title="Klik untuk mengurutkan">
                      <div className="flex items-center gap-1">
                        Tgl Pinjam
                        <Icon name={sortConfig.key === 'borrow_date' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className={`text-base transition-all ${sortConfig.key === 'borrow_date' ? 'text-primary' : 'opacity-30 group-hover:opacity-100'}`} />
                      </div>
                    </th>

                    {/* ✅ KOLOM BISA DI-SORT: ESTIMASI KEMBALI */}
                    <th className={`${thClass} cursor-pointer hover:bg-white/5 transition group select-none`} onClick={() => handleSort('est_return_date')} title="Klik untuk mengurutkan">
                      <div className="flex items-center gap-1">
                        Estimasi
                        <Icon name={sortConfig.key === 'est_return_date' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className={`text-base transition-all ${sortConfig.key === 'est_return_date' ? 'text-primary' : 'opacity-30 group-hover:opacity-100'}`} />
                      </div>
                    </th>

                    <th className={thClass}>Status</th>
                    <th className={thClass}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((trx) => (
                    <tr key={trx.id} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'} hover:bg-white/5 transition`}>
                      <td className={`${tdClass} ${textClass}`}>#{trx.id}</td>
                      
                      {/* ✅ FIX DATA HILANG: Keperluan ditaruh di bawah nama barang */}
                      <td className={tdClass}>
                        <p className={`${titleClass} font-bold`}>{trx.item?.name || '-'}</p>
                        <p className={`text-[11px] mt-1 max-w-[180px] line-clamp-2 leading-tight ${isDark ? 'text-slate-400' : 'text-gray-500'}`} title={trx.purpose}>
                          📝 {trx.purpose || 'Tidak ada keperluan spesifik'}
                        </p>
                      </td>

                      <td className={`${tdClass} ${textClass}`}>{trx.borrower?.name || '-'}</td>
                      <td className={`${tdClass} ${textClass}`}>{formatDateTime(trx.borrow_date)}</td>
                      <td className={`${tdClass} ${textClass}`}>{formatDateTime(trx.est_return_date)}</td>
                      
                      {/* ✅ FIX DATA HILANG: Alasan tolak / catatan balikin ditaruh di bawah badge status */}
                      <td className={tdClass}>
                        <div className="flex flex-col items-start gap-1.5">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full ${statusBadgeClass(trx.status)} font-bold tracking-wide`}>
                            {getStatusText(trx.status)}
                          </span>
                          {trx.notes && (
                            <p className={`text-[10px] max-w-[150px] line-clamp-2 leading-tight ${trx.status === 'rejected' ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-gray-500'}`} title={trx.notes}>
                              {trx.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex gap-2 items-center">
                          
                          {trx.status === 'pending' && (
                            <>
                              {/* ✅ ANTI GHOST APPROVAL: Pake helper baru yang ada toleransi waktunya */}
                              {checkIsExpired(trx) ? (
                                <button disabled className="bg-gray-500/50 cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition" title="Waktu tunggu habis">Kadaluwarsa</button>
                              ) : (
                                <button onClick={() => handleApproveClick(trx, 'approve')} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:brightness-110 transition shadow-lg shadow-green-500/20">Terima</button>
                              )}
                              <button onClick={() => { handleApproveClick(trx, 'reject'); setRejectReason(''); }} className="bg-red-500/20 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-500/30 transition">Tolak</button>
                            </>
                          )}

                          {/* ✅ TOMBOL KHUSUS "SERAHKAN" BUAT BOOKING YG UDAH DI-ACC */}
                          {trx.status === 'approved' && (
                            <>
                              {/* Tambahan: Tombol WA khusus Pengingat Ambil */}
                              <button onClick={() => handleWhatsApp(trx)} className="bg-[#25D366] text-white px-2 py-1.5 rounded-lg text-sm font-medium hover:brightness-110 transition flex items-center justify-center shadow-lg shadow-[#25D366]/20" title="Ingatkan via WA">
                                <Icon name="chat" className="text-base" />
                              </button>
                              <button onClick={() => handleApproveClick(trx, 'handover')} className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:brightness-110 transition shadow-lg shadow-purple-500/20">Serahkan</button>
                              <button onClick={() => handleApproveClick(trx, 'reject')} className="bg-red-500/20 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-500/30 transition">Hangus</button>
                            </>
                          )}

                          {trx.status === 'borrowed' && (
                            <>
                              <button onClick={() => handleWhatsApp(trx)} className="bg-[#25D366] text-white px-2 py-1.5 rounded-lg text-sm font-medium hover:brightness-110 transition flex items-center justify-center shadow-lg shadow-[#25D366]/20" title="Kirim Pesan WA">
                                <Icon name="chat" className="text-base" />
                              </button>
                              <button onClick={() => setShowReturnModal(trx)} className="bg-blue-500/20 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition">Kembalikan</button>
                            </>
                          )}
                          
                          {/* ✅ FIX KTP BOCOR: Cuma munculin tombol KTP/KTM kalau item-nya emang butuh! */}
                          {(trx.attachment || (trx.item?.required_id && trx.item.required_id !== 'none' && (trx.borrower?.ktp_photo || trx.borrower?.ktm_photo))) && (
                            <button onClick={() => setShowAttachmentModal(trx)} className="bg-blue-500/20 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition" title="Lihat Lampiran">
                              <Icon name="attachment" className="text-base" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
            {sortedTransactions.map((trx) => (
              <div key={trx.id} className={cardClass}>
                
                {/* ✅ FIX MOBILE: Header Card + Status + Catatan Tolak */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/5">
                  <div>
                    <p className={`text-xs ${textClass}`}>ID Transaksi</p>
                    <p className={`font-semibold ${titleClass}`}>#{trx.id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 text-right">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full ${statusBadgeClass(trx.status)} font-bold tracking-wide`}>
                      {getStatusText(trx.status)}
                    </span>
                    {trx.notes && (
                      <p className={`text-[10px] max-w-[150px] line-clamp-2 leading-tight ${trx.status === 'rejected' ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-gray-500'}`} title={trx.notes}>
                        {trx.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* ✅ FIX MOBILE: Isi Data Card + Keperluan + Jam Detail */}
                <div className="space-y-3">
                  <div>
                    <p className={`text-xs ${textClass} mb-0.5`}>Barang</p>
                    <p className={`text-sm font-bold ${titleClass}`}>{trx.item?.name || '-'}</p>
                    {trx.purpose && (
                      <p className={`text-[11px] mt-0.5 leading-tight ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        📝 {trx.purpose}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs ${textClass} mb-0.5`}>Peminjam</p>
                      <p className={`text-sm font-medium ${titleClass}`}>{trx.borrower?.name || '-'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${textClass} mb-0.5`}>Jalur</p>
                      <p className={`text-xs font-bold ${getTransactionType(trx) === 'booking' ? 'text-purple-500' : 'text-teal-500'}`}>
                        {getTransactionType(trx) === 'booking' ? 'Web Booking' : 'Scan OTS'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${textClass} mb-0.5`}>Tgl Pinjam</p>
                      <p className={`text-[11px] font-medium ${titleClass}`}>{formatDateTime(trx.borrow_date)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${textClass} mb-0.5`}>Estimasi</p>
                      <p className={`text-[11px] font-medium ${titleClass}`}>{formatDateTime(trx.est_return_date)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  {/* Aksi Mobile Tambahan: Tombol WA Terpisah Di Atas */}
                {(trx.status === 'borrowed' || trx.status === 'approved') && (
                  <button onClick={() => handleWhatsApp(trx)} className="w-full mt-4 mb-2 bg-[#25D366] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-[#25D366]/20">
                    <Icon name="chat" className="text-base" /> 
                    {trx.status === 'approved' ? 'Ingatkan Ambil via WA' : 'Chat WhatsApp Peminjam'}
                  </button>
                )}
                <div className={`flex gap-2 ${trx.status !== 'borrowed' ? 'mt-4' : ''}`}>
                  {trx.status === 'borrowed' && (
                    <button onClick={() => setShowReturnModal(trx)} className="flex-1 bg-blue-500/20 text-blue-600 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition">
                      Kembalikan
                    </button>
                  )}
                  {(trx.borrower?.ktp_photo || trx.borrower?.ktm_photo || trx.attachment) && (
                    <button onClick={() => setShowAttachmentModal(trx)} className="flex-1 bg-blue-500/20 text-blue-600 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition flex items-center justify-center gap-2">
                      <Icon name="attachment" className="text-base" /> Lampiran
                    </button>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        </>
      )}

      {/* ✅ MODAL INPUT PEMINJAMAN MANUAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setShowManualModal(false)}>
          <div className={`${cardClass} max-w-md w-full p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className={`text-xl font-bold ${titleClass}`}>Input Peminjaman Manual</h3>
              <button onClick={() => setShowManualModal(false)} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>Pilih Barang</label>
                <div className="space-y-2">
                  <input type="text" placeholder="Cari nama atau kode barang..." value={searchItem} onChange={(e) => setSearchItem(e.target.value)} className={`w-full p-2.5 rounded-xl border outline-none text-sm ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                  <select required value={manualForm.item_id} onChange={(e) => setManualForm({...manualForm, item_id: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none text-sm ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                    <option value="" disabled>-- Pilih Barang Tersedia --</option>
                    {items.filter(i => i.name.toLowerCase().includes(searchItem.toLowerCase()) || i.code.toLowerCase().includes(searchItem.toLowerCase())).map(item => (
                      <option key={item.id} value={item.id}>[{item.code}] {item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ WARNING DINAMIS JIKA BARANG BUTUH JAMINAN */}
              {isRequireJaminan && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs font-medium leading-relaxed">
                  <span className="font-bold block mb-0.5">⚠️ PERHATIAN: Barang ini mewajibkan jaminan!</span>
                  Tahan fisik {selectedItem.required_id !== 'none' ? selectedItem.required_id.toUpperCase() : ''}{selectedItem.required_id !== 'none' && selectedItem.require_letter ? ' dan ' : ''}{selectedItem.require_letter ? 'Surat Izin' : ''} peminjam sebagai bukti sebelum menyerahkan barang.
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>Nama Peminjam</label>
                <input type="text" required placeholder="Nama Lengkap" value={manualForm.borrower_name} onChange={(e) => setManualForm({...manualForm, borrower_name: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none text-sm ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>NIM/NIP</label>
                  <input type="text" required placeholder="Nomor Induk" value={manualForm.identity_no} onChange={(e) => setManualForm({...manualForm, identity_no: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none text-sm ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>WhatsApp</label>
                  <input type="text" required placeholder="08..." value={manualForm.phone} onChange={(e) => setManualForm({...manualForm, phone: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none text-sm ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                </div>
              </div>
              {/* ✅ JENIS TRANSAKSI */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>Jenis Transaksi</label>
                <div className="flex gap-4 mt-2">
                  <label className={`flex items-center gap-2 text-sm cursor-pointer ${titleClass}`}>
                    <input type="radio" name="type" value="ots" checked={manualForm.type === 'ots'} onChange={(e) => setManualForm({...manualForm, type: e.target.value})} className="cursor-pointer" />
                    OTS (Pinjam Langsung)
                  </label>
                  <label className={`flex items-center gap-2 text-sm cursor-pointer ${titleClass}`}>
                    <input type="radio" name="type" value="booking" checked={manualForm.type === 'booking'} onChange={(e) => setManualForm({...manualForm, type: e.target.value})} className="cursor-pointer" />
                    Booking (Reservasi)
                  </label>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>Keperluan</label>
                <input type="text" required placeholder="Keperluan pinjam" value={manualForm.purpose} onChange={(e) => setManualForm({...manualForm, purpose: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none text-sm ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
              </div>
              
              {/* ✅ TANGGAL PINJAM & KEMBALI DINAMIS PAKAI DATEPICKER SAKTI */}
              {manualForm.type === 'booking' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>Tgl & Jam Pinjam <span className="text-red-500">*</span></label>
                    <DatePicker
                      selected={manualForm.borrow_date}
                      onChange={(date) => setManualForm({ ...manualForm, borrow_date: date, est_return_date: null })}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      timeCaption="Waktu"
                      dateFormat="d MMMM yyyy, HH:mm"
                      locale="id"
                      minDate={new Date()}
                      maxDate={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)} // Booking max 14 hari
                      filterTime={filterAvailableTimes}
                      dayClassName={getDayClassName} 
                      className={inputClass}
                      placeholderText="Pilih tgl & jam"
                      portalId="datepicker-portal"
                      required
                    />
                  </div>
                  <div className="relative">
                    <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>Estimasi Kembali <span className="text-red-500">*</span></label>
                    <DatePicker
                      selected={manualForm.est_return_date}
                      onChange={(date) => setManualForm({ ...manualForm, est_return_date: date })}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      timeCaption="Waktu"
                      dateFormat="d MMMM yyyy, HH:mm"
                      locale="id"
                      minDate={manualForm.borrow_date || new Date()}
                      maxDate={getMaxReturnDate()} // Dinamis berdasar stok & durasi 7 hari
                      filterTime={filterAvailableTimes}
                      dayClassName={getDayClassName}
                      className={inputClass}
                      placeholderText="Pilih tgl & jam"
                      disabled={!manualForm.borrow_date || !manualForm.item_id}
                      portalId="datepicker-portal"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>Tgl & Jam Pinjam <span className="text-red-500">*</span></label>
                    <DatePicker
                      selected={new Date()}
                      onChange={() => { }}
                      showTimeSelect
                      timeFormat="HH:mm"
                      dateFormat="d MMMM yyyy, HH:mm"
                      locale="id"
                      className={`${inputClass} opacity-70 cursor-not-allowed`}
                      disabled
                    />
                  </div>
                  <div className="relative">
                    <label className={`block text-xs font-semibold mb-1 ${titleClass}`}>Estimasi Kembali <span className="text-red-500">*</span></label>
                    <DatePicker
                      selected={manualForm.est_return_date}
                      onChange={(date) => setManualForm({ ...manualForm, est_return_date: date })}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      timeCaption="Waktu"
                      dateFormat="d MMMM yyyy, HH:mm"
                      locale="id"
                      minDate={new Date()}
                      maxDate={getMaxReturnDate()} // Maks 7 hari dari hari ini
                      filterTime={filterAvailableTimes}
                      dayClassName={getDayClassName}
                      className={inputClass}
                      placeholderText="Pilih tgl & jam"
                      disabled={!manualForm.item_id}
                      portalId="datepicker-portal"
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className={`text-[11px] space-y-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <p className="flex items-center gap-1.5"><Icon name="schedule" className="text-[14px] text-blue-500" /> Wajib di jam operasional: 08:00 - 16:00 WIB.</p>
                <p className="flex items-center gap-1.5"><Icon name="event_upcoming" className="text-[14px] text-orange-500" /> Tanggal <strong className="text-orange-500 bg-orange-500/10 px-1 rounded">Berwarna</strong> berarti ada jadwal terisi. Cek ketersediaan jam.</p>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-3 mt-4 rounded-xl font-bold text-sm hover:brightness-110 transition shadow-lg shadow-blue-600/20">
                Simpan Peminjaman
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Return */}
      {showReturnModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => { setShowReturnModal(null); setReturnNotes(''); }}>
          <div className={`${cardClass} max-w-md w-full p-6 rounded-2xl space-y-4`} onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center">
              <h3 className={`text-xl font-bold ${titleClass}`}>Konfirmasi Pengembalian</h3>
              <button onClick={() => { setShowReturnModal(null); setReturnNotes(''); }} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            
            <p className={textClass}>
              Yakin ingin mengembalikan barang <span className="font-semibold">{showReturnModal.item?.name}</span> dari <span className="font-semibold">{showReturnModal.borrower?.name}</span>?
            </p>

            {/* ✅ FORM CATATAN PENGEMBALIAN (Opsional) */}
            <div className="space-y-2 mt-4">
              <label className={`text-sm font-semibold ${titleClass}`}>Catatan Admin <span className="text-gray-500 font-normal">(Opsional)</span></label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Misal: Tas tripod sedikit kotor, ada denda telat, atau barang rusak..."
                className={`w-full p-3 rounded-xl border outline-none text-sm transition-all ${isDark ? 'bg-black/20 border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                rows="2"
              ></textarea>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button onClick={() => { setShowReturnModal(null); setReturnNotes(''); }} className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Batal
              </button>
              <button onClick={() => handleReturn(showReturnModal.id)} className="flex-1 bg-blue-500 hover:brightness-110 shadow-lg shadow-blue-500/20 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition">
                <Icon name="check_circle" className="text-base" /> Ya, Kembalikan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Lampiran Jaminan & Surat */}
      {showAttachmentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setShowAttachmentModal(null)}>
          <div className={`${cardClass} max-w-lg w-full p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className={`text-xl font-bold ${titleClass}`}>Lampiran Transaksi</h3>
              <button onClick={() => setShowAttachmentModal(null)} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Cek Foto KTP / KTM */}
              {(showAttachmentModal.borrower?.ktp_photo || showAttachmentModal.borrower?.ktm_photo) && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${titleClass}`}>
                    Foto Jaminan ({showAttachmentModal.borrower?.ktp_photo ? 'KTP' : 'KTM'})
                  </p>
                  <img 
                    src={showAttachmentModal.borrower?.ktp_photo || showAttachmentModal.borrower?.ktm_photo} 
                    alt="Foto Jaminan" 
                    className="w-full rounded-xl border border-gray-500/30 shadow-md object-contain max-h-60 bg-gray-100 dark:bg-black/20"
                  />
                </div>
              )}

              {/* Cek File PDF Surat */}
              {showAttachmentModal.attachment && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${titleClass}`}>Surat Izin Peminjaman</p>
                  <a 
                    href={showAttachmentModal.attachment} 
                    download={`Surat_Peminjaman_${showAttachmentModal.transaction_code}.pdf`}
                    className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition text-blue-600 dark:text-blue-400"
                  >
                    <Icon name="picture_as_pdf" className="text-3xl" />
                    <div>
                      <p className="font-medium text-sm">Unduh Surat PDF</p>
                      <p className="text-xs opacity-80">Klik untuk menyimpan file ke perangkat</p>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Terima/Tolak */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmModal(null)}>
          <div className={`${cardClass} max-w-md w-full p-6 rounded-2xl space-y-4`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              {/* ✅ FIX JUDUL MODAL */}
              <h3 className={`text-xl font-bold ${titleClass}`}>
                Konfirmasi {confirmModal.action === 'approve' ? 'Penerimaan' : confirmModal.action === 'handover' ? 'Penyerahan' : 'Penolakan'}
              </h3>
              <button onClick={() => setConfirmModal(null)} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            
            <p className={textClass}>
              Yakin ingin <span className={`font-bold ${confirmModal.action === 'approve' ? 'text-green-500' : confirmModal.action === 'handover' ? 'text-purple-500' : 'text-red-500'}`}>
                {confirmModal.action === 'approve' ? 'MENGIZINKAN' : confirmModal.action === 'handover' ? 'MENYERAHKAN' : 'MENOLAK'}
              </span> peminjaman barang <span className={`font-semibold ${titleClass}`}>{confirmModal.trx.item?.name}</span> oleh <span className={`font-semibold ${titleClass}`}>{confirmModal.trx.borrower?.name}</span>?
            </p>

            {/* ✅ FORM ALASAN TOLAK WAJIB ISI (Audit Trail) */}
            {confirmModal.action === 'reject' && (
              <div className="space-y-2 mt-4 animate-fade-in">
                <label className={`text-sm font-semibold ${titleClass}`}>Alasan Penolakan <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Misal: Foto KTM buram, alat sedang diservis..."
                  className={`w-full p-3 rounded-xl border outline-none text-sm transition-all ${isDark ? 'bg-black/20 border-white/10 text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500'}`}
                  rows="3"
                ></textarea>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setConfirmModal(null)} className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Batal
              </button>
              
              {/* ✅ FIX WARNA & TEKS TOMBOL BERDASARKAN ACTION */}
              <button onClick={executeApprove} className={`flex-1 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                confirmModal.action === 'approve' ? 'bg-green-500 hover:brightness-110 shadow-green-500/20' : 
                confirmModal.action === 'handover' ? 'bg-purple-500 hover:brightness-110 shadow-purple-500/20' : 
                'bg-red-500 hover:brightness-110 shadow-red-500/20'
              }`}>
                <Icon name={confirmModal.action === 'approve' ? 'check_circle' : confirmModal.action === 'handover' ? 'front_hand' : 'cancel'} className="text-base" />
                Ya, {confirmModal.action === 'approve' ? 'Terima' : confirmModal.action === 'handover' ? 'Serahkan' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTransactionsPage