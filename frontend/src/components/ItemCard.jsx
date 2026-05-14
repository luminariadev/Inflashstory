import { useState } from 'react'
import StatusBadge from './StatusBadge'
import Icon from './Icon'
import BorrowModal from './BorrowModal'
import BookingModal from './BookingModal'
import ItemInfoModal from './ItemInfoModal'

const ItemCard = ({ item, index, isDark = true }) => {
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const imageUrl = item.image_url || `https://picsum.photos/seed/${item.id}/400/300`

  const cardClass = isDark ? 'glass-card' : 'glass-card-light'
  const textTitleClass = isDark ? 'text-white' : 'text-gray-800'
  const textSecondaryClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const textMutedClass = isDark ? 'text-primary/80' : 'text-primary/70'
  const buttonSecondaryClass = isDark 
    ? 'glass text-white glass-hover' 
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'

  // Cek apakah barang bisa dipinjam (hanya status 'available')
  const isAvailable = item.status === 'available'
  const isBorrowedOrMaintenance = item.status === 'borrowed' || item.status === 'maintenance' || item.status === 'damaged' || item.status === 'lost'

  return (
    <>
      <div className={`${cardClass} flex flex-col gap-4`}>
        {/* Image */}
        <div className="aspect-video w-full rounded-lg overflow-hidden relative">
          <img 
            className="w-full h-full object-cover" 
            src={imageUrl} 
            alt={item.name}
            loading="lazy"
          />
          <div className="absolute top-3 right-3">
            <StatusBadge status={item.status} isDark={isDark} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 px-1">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`font-semibold text-base line-clamp-2 ${textTitleClass}`}>
              {item.name}
            </h4>
            <button 
              onClick={() => setShowInfoModal(true)}
              className="shrink-0"
            >
              <Icon name="info" className={`text-base ${isDark ? 'text-primary hover:text-primary/80' : 'text-primary/70 hover:text-primary'} cursor-pointer transition`} />
            </button>
          </div>
          <p className={`text-xs font-medium ${textMutedClass}`}>
            {item.code || `INV-${item.id}`}
          </p>
          <div className={`flex items-center gap-1 text-sm ${textSecondaryClass}`}>
            <Icon name="location_on" className="text-sm" />
            <span>{item.location || 'Ruang Jurusan'}</span>
          </div>
        </div>

        {/* Actions - Hanya tampilkan jika status 'available' */}
        {isAvailable ? (
          <div className="flex gap-3 pt-2 border-t border-white/10 mt-2">
            <button 
              onClick={() => setShowBorrowModal(true)}
              className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
            >
              <Icon name="qr_code_scanner" className="text-base" />
              PINJAM
            </button>
            <button 
              onClick={() => setShowBookingModal(true)}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${buttonSecondaryClass}`}
            >
              <Icon name="event_available" className="text-base" />
              BOOKING
            </button>
          </div>
        ) : isBorrowedOrMaintenance ? (
          <div className="pt-2 border-t border-white/10 mt-2">
            <div className={`text-center py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
              {item.status === 'borrowed' && '🔒 Sedang Dipinjam'}
              {item.status === 'maintenance' && '🔧 Dalam Perawatan'}
              {item.status === 'damaged' && '⚠️ Barang Rusak'}
              {item.status === 'lost' && '❌ Barang Hilang'}
            </div>
          </div>
        ) : null}
      </div>

      <BorrowModal 
        isOpen={showBorrowModal} 
        onClose={() => setShowBorrowModal(false)} 
        item={item}
        isDark={isDark}
      />
      <BookingModal 
        isOpen={showBookingModal} 
        onClose={() => setShowBookingModal(false)} 
        item={item}
        isDark={isDark}
      />
      <ItemInfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
        item={item}
        isDark={isDark}
      />
    </>
  )
}

export default ItemCard