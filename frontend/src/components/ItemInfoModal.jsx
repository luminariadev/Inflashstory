import Icon from './Icon'

const ItemInfoModal = ({ isOpen, onClose, item, isDark = true }) => {
  if (!isOpen) return null

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