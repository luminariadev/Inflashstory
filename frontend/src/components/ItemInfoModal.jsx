import Icon from './Icon'

// ✅ TAMBAHIN PROPS activeBookings
const ItemInfoModal = ({ isOpen, onClose, item, activeBookings = [], isDark = true }) => {
  if (!isOpen) return null

  // ✅ HELPER BUAT FORMAT JADWAL
  const formatSchedule = (startStr, endStr) => {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const dateOpt = { day: 'numeric', month: 'short' }
    const timeOpt = { hour: '2-digit', minute: '2-digit' }
    
    if (start.toDateString() === end.toDateString()) {
      return `${start.toLocaleDateString('id-ID', dateOpt)} (${start.toLocaleTimeString('id-ID', timeOpt)} - ${end.toLocaleTimeString('id-ID', timeOpt)} WIB)`
    }
    return `${start.toLocaleDateString('id-ID', dateOpt)} ${start.toLocaleTimeString('id-ID', timeOpt)} s/d ${end.toLocaleDateString('id-ID', dateOpt)} ${end.toLocaleTimeString('id-ID', timeOpt)}`
  }

  const modalClass = isDark ? 'glass' : 'glass-light'
  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const labelClass = isDark ? 'text-slate-400' : 'text-gray-500'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={`${modalClass} max-w-md w-full p-6 rounded-2xl ambient-shadow space-y-4 animate-zoom-in`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className={`text-xl font-bold ${titleClass}`}>{item.name}</h3>
            <p className="text-primary text-xs font-bold tracking-wider">DETAIL BARANG</p>
          </div>
          <button onClick={onClose} className={`material-symbols-outlined ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition`}>
            close
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <Icon name="inventory_2" className="text-primary text-xl" />
            <div>
              <p className={`text-xs ${labelClass}`}>Kode Barang</p>
              <p className={`font-medium ${titleClass}`}>{item.code || `INV-${item.id}`}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Icon name="category" className="text-tertiary text-xl" />
            <div>
              <p className={`text-xs ${labelClass}`}>Kategori</p>
              <p className={`font-medium ${titleClass}`}>{item.category || 'Umum'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Icon name="location_on" className="text-secondary text-xl" />
            <div>
              <p className={`text-xs ${labelClass}`}>Lokasi</p>
              <p className={`font-medium ${titleClass}`}>{item.location || 'Ruang Jurusan'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Icon name="description" className="text-primary-container text-xl" />
            <div>
              <p className={`text-xs ${labelClass}`}>Deskripsi</p>
              <p className={`text-sm ${textClass}`}>{item.description || 'Tidak ada deskripsi'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Icon name="build" className="text-tertiary text-xl" />
            <div>
              <p className={`text-xs ${labelClass}`}>Kondisi</p>
              <p className={`font-medium capitalize ${titleClass}`}>{item.condition || 'Baik'}</p>
            </div>
          </div>
        </div>

        {/* ✅ BADGE PERSYARATAN (KTP/SURAT) + ATURAN MAIN DI MODAL INFO */}
        {((item.required_id && item.required_id !== 'none') || item.require_letter) && (
          <div className={`p-3 rounded-xl border flex gap-3 items-start text-sm font-medium leading-relaxed bg-red-500/10 border-red-500/20 text-red-500 mt-4`}>
            <Icon name="admin_panel_settings" className="text-xl shrink-0" />
            <div>
              <p className="font-bold mb-1">Syarat Peminjaman Wajib:</p>
              <p className="text-xs">
                Upload {item.required_id !== 'none' ? item.required_id.toUpperCase() : ''}{(item.required_id !== 'none' && item.require_letter) ? ' & ' : ''}{item.require_letter ? 'Surat Izin' : ''} (via Web) / Bawa & Titipkan Fisiknya (Jika Peminjaman Manual ke Admin).
              </p>
            </div>
          </div>
        )}

        {/* ✅ BOX JADWAL & EDUKASI STOK (MUNCUL JIKA ADA ANTREAN) */}
        {activeBookings.length > 0 && (
          <div className="space-y-3 mt-4">
            
            {/* Box List Jadwal */}
            <div className={`p-4 rounded-xl border flex gap-3 items-start ${isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
              <Icon name="event_upcoming" className="text-xl shrink-0 mt-0.5" />
              <div className="text-sm w-full">
                <p className="font-bold mb-2">Jadwal Ter-Booking Mendatang:</p>
                <ul className="space-y-2">
                  {activeBookings.map((trx, idx) => {
                    const bulletColors = ['bg-orange-500', 'bg-cyan-500', 'bg-rose-500']
                    const bulletColor = bulletColors[idx % 3]

                    return (
                      <li key={trx.id} className="flex flex-wrap items-center gap-2 text-xs font-medium leading-relaxed">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${bulletColor} shadow-[0_0_8px_currentColor] opacity-80`}></span> 
                        <span>{formatSchedule(trx.borrow_date, trx.est_return_date)}</span>
                        
                        {/* ✅ FIX BADGE STATUS BERWARNA */}
                        {trx.status === 'pending' && <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[10px] font-bold border border-yellow-500/30">Menunggu ACC</span>}
                        {trx.status === 'approved' && <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-500 rounded text-[10px] font-bold border border-purple-500/30">Disetujui</span>}
                        {trx.status === 'borrowed' && <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded text-[10px] font-bold border border-red-500/30">Sedang Dipakai</span>}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {/* ✅ BOX EDUKASI: Biar User Gak Panik Liat Stok 0 */}
            <div className={`p-3 rounded-xl border flex gap-2 items-start text-[11px] font-medium leading-relaxed ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <Icon name="info" className="text-base shrink-0" />
              <p>
                <strong>Info Stok:</strong> Kamu tetap bisa klik tombol <span className="italic">Booking / Scan OTS</span> walaupun stok saat ini habis (0). Selama jadwal yang kamu pilih tidak bertabrakan dengan jadwal di atas, sistem akan mengizinkan peminjaman!
              </p>
            </div>

          </div>
        )}  

        <button 
          onClick={onClose}
          className={`w-full mt-4 py-3 rounded-xl font-medium text-sm transition-all ${
            isDark 
              ? 'glass text-white glass-hover' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          TUTUP
        </button>
      </div>
    </div>
  )
}

export default ItemInfoModal