import Icon from './Icon'

const BorrowModal = ({ isOpen, onClose, item, isDark = true }) => {
  if (!isOpen) return null

  const handleContactAdmin = () => {
    const adminPhone = '6281234567890'
    const message = encodeURIComponent(`Halo admin, saya ingin meminjam barang ${item.name} (${item.code || `INV-${item.id}`}). Apakah barang tersedia?`)
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank')
  }

  const modalClass = isDark ? 'glass' : 'glass-light'
  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-200' : 'text-gray-600'
  const mutedClass = isDark ? 'text-slate-300' : 'text-gray-500'
  const buttonClass = isDark 
    ? 'glass text-white glass-hover' 
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={`${modalClass} max-w-md w-full p-6 rounded-2xl ambient-shadow space-y-5 animate-zoom-in`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className={`text-2xl font-bold ${titleClass}`}>Langkah Pinjam</h3>
            <p className="text-primary text-xs font-bold tracking-wider">PROSEDUR RESMI</p>
          </div>
          <button onClick={onClose} className={`material-symbols-outlined ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition`}>
            close
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-sm">1</div>
            <p className={`text-sm ${textClass}`}>
              Silakan <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>datang langsung ke Jurusan</span> untuk melakukan pengambilan fisik barang.
            </p>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-sm">2</div>
            <div className="space-y-1">
              <p className={`text-sm ${textClass}`}>Lokasi Pengambilan:</p>
              <p className={`flex items-center gap-1 text-sm ${mutedClass}`}>
                <Icon name="meeting_room" className="text-sm" />
                {item.location || 'Gedung C, Ruang Lab Multimedia, Lantai 2'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <button onClick={onClose} className={`py-3 rounded-xl font-medium text-sm transition-all ${buttonClass}`}>
            TUTUP
          </button>
          <button 
            onClick={handleContactAdmin}
            className="bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:brightness-110 transition"
          >
            <Icon name="chat" className="text-sm" />
            HUBUNGI ADMIN
          </button>
        </div>
      </div>
    </div>
  )
}

export default BorrowModal