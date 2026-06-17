import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'

const CheckStatusPage = () => {
  const [isDark, setIsDark] = useState(true)
  const [nim, setNim] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  
  // ✅ STATE BARU BUAT UI/UX PRO
  const [itemQuery, setItemQuery] = useState('') // Buat nyari nama barang
  const [visibleCount, setVisibleCount] = useState(5) // Nampilin 5 item dulu

  useEffect(() => {
    const checkTheme = () => setIsDark(!document.body.classList.contains('light-theme'))
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!nim.trim()) {
      toast.error('Masukkan NIM terlebih dahulu!')
      return
    }

    setLoading(true)
    setHasSearched(true)
    setResult(null)
    
    // ✅ RESET FILTER & LOAD MORE
    setItemQuery('')
    setVisibleCount(5)

    try {
      const response = await API.get(`/transactions/status?nim=${nim}`)
      setResult(response.data.data)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mencari data')
    } finally {
      setLoading(false)
    }
  }

  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const cardClass = isDark 
    ? 'bg-[#1e1f23]/50 backdrop-blur-sm border border-white/10' 
    : 'bg-white shadow-xl border border-gray-200'
  const inputClass = isDark 
    ? 'bg-[#121215] border-white/10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary' 
    : 'bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary'

  const getStatusBadge = (status) => {
    if (status === 'pending') return <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/20">⏳ Menunggu ACC</span>
    if (status === 'approved') return <span className="bg-purple-500/20 text-purple-500 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/20">📦 Siap Diambil</span>
    if (status === 'borrowed') return <span className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">🔄 Sedang Dipinjam</span>
    if (status === 'returned') return <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">✅ Selesai (Dikembalikan)</span>
    if (status === 'rejected') return <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">❌ Ditolak / Batal</span>
    return <span className="bg-gray-500/20 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{status}</span>
  }

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 max-w-3xl mx-auto">
      
      {/* Header Form */}
      <div className="text-center mb-8">
        <div className={`p-4 rounded-full inline-flex items-center justify-center mb-4 ${isDark ? 'bg-[#1e1f23]/50 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <Icon name="search" className="text-4xl text-primary" />
        </div>
        <h1 className={`text-2xl sm:text-3xl font-bold ${titleClass}`}>Cek Status Peminjaman</h1>
        <p className={`text-sm mt-2 max-w-md mx-auto ${textClass}`}>
          Pantau status persetujuan barang yang kamu pinjam atau *booking* secara *real-time*.
        </p>
      </div>

      {/* Form Pencarian */}
      <form onSubmit={handleSearch} className={`p-2 sm:p-3 rounded-2xl flex flex-col sm:flex-row gap-3 shadow-lg mb-8 ${cardClass}`}>
        <div className="relative flex-1 flex items-center">
          <Icon name="badge" className={`absolute left-4 text-xl ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
          <input 
            type="text" 
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            placeholder="Masukkan NIM atau NIP kamu..."
            className={`w-full py-3.5 pl-12 pr-4 rounded-xl outline-none transition text-sm font-medium ${inputClass}`}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-primary text-white py-3.5 px-8 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></span>
          ) : (
            <>Cari Data <Icon name="arrow_forward" className="text-base" /></>
          )}
        </button>
      </form>

      {/* Hasil Pencarian */}
      {hasSearched && !loading && (
        <div className="space-y-6 animate-fade-in">
          {result ? (
            <>
              {/* Header Info Akun */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Icon name="account_circle" className="text-3xl text-primary" />
                  <div>
                    <p className={`text-xs ${textClass}`}>Riwayat Peminjaman atas nama:</p>
                    <h2 className={`text-lg font-bold ${titleClass}`}>{result.borrower_name}</h2>
                  </div>
                </div>

                {/* ✅ UI PRO 1: Kolom Cari Barang di Riwayat */}
                {result.transactions.length > 0 && (
                  <div className="relative w-full sm:w-64">
                    <Icon name="search" className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                    <input 
                      type="text" 
                      placeholder="Cari barang atau TRX..." 
                      value={itemQuery}
                      onChange={(e) => { setItemQuery(e.target.value); setVisibleCount(5); }} // Ketik baru = reset nampil 5
                      className={`w-full py-2 pl-9 pr-4 rounded-xl outline-none text-xs transition ${
                        isDark 
                          ? 'bg-[#121215]/80 border border-white/10 text-white focus:border-primary/50' 
                          : 'bg-gray-100 border border-gray-200 text-gray-800 focus:border-primary/50'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* ✅ LOGIKA PRO 2: Filter Data & Potong Array (Limit) */}
              {(() => {
                // 1. Filter dulu berdasarkan ketikan user
                const filteredTrx = result.transactions.filter(trx => 
                  (trx.item?.name || '').toLowerCase().includes(itemQuery.toLowerCase()) ||
                  (trx.transaction_code || `TRX-${trx.id}`).toLowerCase().includes(itemQuery.toLowerCase())
                )
                
                // 2. Potong array sesuai visibleCount (Load More)
                const visibleTrx = filteredTrx.slice(0, visibleCount)
                const hasMore = visibleCount < filteredTrx.length

                return (
                  <div className="space-y-4">
                    {filteredTrx.length > 0 ? (
                      <>
                        {/* Render Card Transaksi yang Dibatasi */}
                        {visibleTrx.map((trx) => (
                          <div key={trx.id} className={`p-5 rounded-2xl flex flex-col gap-4 transition-all hover:-translate-y-1 ${cardClass}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <img 
                                  src={trx.item?.image_url || `https://picsum.photos/seed/${trx.item?.id}/60/60`} 
                                  alt={trx.item?.name} 
                                  className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0"
                                />
                                <div>
                                  <p className="text-xs text-primary font-bold tracking-wider uppercase mb-1">
                                    {trx.transaction_code || `TRX-${trx.id}`}
                                  </p>
                                  <h3 className={`font-bold text-base line-clamp-1 ${titleClass}`}>{trx.item?.name}</h3>
                                  <div className={`text-xs mt-1 space-y-0.5 ${textClass}`}>
                                    <p className="flex items-center gap-1.5"><Icon name="event" className="text-[12px]" /> Diambil: {new Date(trx.borrow_date).toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}).replace('.', ':')} WIB</p>
                                    <p className="flex items-center gap-1.5"><Icon name="update" className="text-[12px]" /> Kembali: {new Date(trx.est_return_date).toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}).replace('.', ':')} WIB</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4 shrink-0">
                                {getStatusBadge(trx.status)}
                                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                  Dibuat: {new Date(trx.created_at).toLocaleDateString('id-ID')}
                                </p>
                              </div>
                            </div>

                            {/* Kotak Alasan / Catatan Admin */}
                            {trx.notes && (
                              <div className={`p-3 rounded-xl flex gap-3 items-start border ${
                                trx.status === 'rejected' 
                                  ? isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'
                                  : isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                              }`}>
                                <Icon name={trx.status === 'rejected' ? 'error' : 'info'} className="text-lg shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-bold mb-0.5">
                                    {trx.status === 'rejected' ? 'Alasan Penolakan:' : 'Catatan Admin:'}
                                  </p>
                                  <p className="text-xs leading-relaxed opacity-90">{trx.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* ✅ UI PRO 3: Tombol Load More kalau data masih sisa */}
                        {hasMore && (
                          <div className="pt-4 flex justify-center">
                            <button 
                              onClick={() => setVisibleCount(prev => prev + 5)}
                              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
                                isDark 
                                  ? 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                              }`}
                            >
                              <Icon name="expand_more" className="text-base" /> Tampilkan Lebih Banyak
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      // Kalau di-search tapi gak ada yang cocok
                      <div className={`text-center py-10 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                        <Icon name="manage_search" className={`text-4xl mb-2 opacity-50 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                        <p className={`text-sm ${textClass}`}>Tidak ada barang yang cocok dengan pencarian "{itemQuery}"</p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </>
          ) : (
            <div className={`text-center py-12 px-4 rounded-2xl ${cardClass}`}>
              <Icon name="search_off" className="text-5xl text-slate-500 mb-3 mx-auto opacity-50" />
              <h3 className={`text-lg font-bold mb-1 ${titleClass}`}>Data Tidak Ditemukan</h3>
              <p className={`text-sm ${textClass}`}>Pastikan NIM / NIP yang kamu masukkan sudah benar.</p>
            </div>
          )}
        </div>
      )}

    </main>
  )
}

export default CheckStatusPage