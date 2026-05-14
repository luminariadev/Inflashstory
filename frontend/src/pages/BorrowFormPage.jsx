import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'

const BorrowFormPage = () => {
  const [searchParams] = useSearchParams()
  const itemId = searchParams.get('item_id')
  const navigate = useNavigate()
  
  const [isDark, setIsDark] = useState(true)
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    borrower_name: '',
    identity_no: '',
    study_program: '',
    class: '',
    phone: '',
    email: '',
    purpose: '',
    est_return_date: '',
    notes: ''
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
      toast.error('QR Code tidak valid')
      navigate('/')
      return
    }
    
    fetchItem()
  }, [itemId, navigate])

  const fetchItem = async () => {
    try {
      const response = await API.get(`/items/${itemId}`)
      const itemData = response.data.data
      
      // Cek status barang - harus available
      if (itemData.status !== 'available') {
        toast.error(`Barang sedang ${itemData.status === 'borrowed' ? 'dipinjam' : 'tidak tersedia'}`)
        navigate('/')
        return
      }
      
      setItem(itemData)
    } catch (error) {
      toast.error('Gagal memuat data barang')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await API.post(`/borrow/${itemId}`, formData)
      
      if (response.data.status === 'success') {
        toast.success(`✅ Berhasil meminjam ${item?.name}!`)
        
        // Redirect ke halaman items setelah 1.5 detik
        setTimeout(() => {
          navigate('/items', { state: { refresh: Date.now() } })
        }, 1500)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal meminjam barang')
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

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

          <div>
            <label className={labelClass}>
              Estimasi Tanggal Pengembalian <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="est_return_date"
              value={formData.est_return_date}
              onChange={handleChange}
              required
              min={minDateStr}
              className={inputClass}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Minimal H+1 dari hari ini
            </p>
          </div>

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

          <div className="flex gap-3 pt-4">
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
    </main>
  )
}

export default BorrowFormPage