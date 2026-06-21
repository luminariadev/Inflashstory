import { useState, useEffect } from 'react' // ✅ TAMBAHIN useEffect
import StatusBadge from './StatusBadge'
import Icon from './Icon'
import BorrowModal from './BorrowModal'
import BookingModal from './BookingModal'
import ItemInfoModal from './ItemInfoModal'
import API from '../api' // ✅ TAMBAHIN IMPORT API

const ItemCard = ({ item, index, isDark = true }) => {
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  
  // ✅ STATE BARU: Buat nyimpen data bookingan diem-diem
  const [activeBookings, setActiveBookings] = useState([])

  // ✅ FETCH BOOKING DI BACKGROUND (Cuma jalan buat barang yg Available)
  useEffect(() => {
    if (item.status === 'available') {
      API.get(`/items/${item.id}/bookings`)
        .then(res => setActiveBookings(res.data.data || []))
        .catch(() => {}) 
    }
  }, [item.id, item.status])

  // ✅ FIX UX: PENGHITUNG SISA STOK (VERSI HARI INI)
  let availableStock = item.total_stock || 1
  if (activeBookings.length > 0) {
    const todayString = new Date().toDateString()
    const now = new Date().getTime()
    
    const currentActive = activeBookings.filter(trx => {
      const start = new Date(trx.borrow_date)
      const end = new Date(trx.est_return_date).getTime()
      
      // Ngurangin stok visual katalog KALAU:
      // 1. Jadwal bookingnya mulai HARI INI (biar yang booking tenang angkanya ngurang)
      // 2. ATAU emang lagi dipinjem dari kemaren dan belum dibalikin (rentang aktif)
      return start.toDateString() === todayString || (now >= start.getTime() && now <= end)
    }).length
    
    availableStock = Math.max(0, availableStock - currentActive)
  }

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
  const isBorrowedOrMaintenance = item.status === 'borrowed' || item.status === 'maintenance' || item.status === 'damaged' || item.status === 'lost' || item.status === 'reserved' // ✅ TAMBAHIN RESERVED DI SINI

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
            {/* ✅ JIKA TERSEDIA TAPI ADA BOOKING, LABEL BERUBAH! */}
            <StatusBadge 
              status={item.status} 
              customLabel={item.status === 'available' && activeBookings.length > 0 ? 'Ada Antrean' : undefined}
              isDark={isDark} 
            />
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

          {/* ✅ BADGE PERSYARATAN (KTP/SURAT) + ATURAN MAIN */}
          {((item.required_id && item.required_id !== 'none') || item.require_letter) && (
            <div className={`text-[10px] mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 leading-relaxed`}>
              <div className="font-bold flex items-center gap-1 mb-0.5">
                <Icon name="admin_panel_settings" className="text-[12px]"/> 
                Syarat Wajib:
              </div>
              <span>Upload {item.required_id !== 'none' ? item.required_id.toUpperCase() : ''}{(item.required_id !== 'none' && item.require_letter) ? ' & ' : ''}{item.require_letter ? 'Surat Izin' : ''} (via Web) / Bawa & Titipkan Fisiknya (Jika Peminjaman Manual ke Admin)</span>
            </div>
          )}
          
          
          {/* ✅ TAMPILAN SISA STOK DENGAN TRIGGER PSIKOLOGIS UX */}
          {availableStock > 0 ? (
            <div className="flex items-center gap-1.5 text-sm font-bold text-green-500">
              <Icon name="inventory_2" className="text-sm" />
              <span> Sisa Stok: {availableStock} / {item.total_stock || 1} Unit</span>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 mt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-500">
                <Icon name="inventory_2" className="text-sm" />
                <span>Stok Habis (0)</span>
              </div>
              <button
                onClick={() => setShowInfoModal(true)}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md animate-pulse hover:animate-none transition-all ${
                  isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white shadow-md'
                }`}
              >
                <Icon name="event_search" className="text-[12px]" />
                Cek Jadwal Kosong
              </button>
            </div>
          )}
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
              {item.status === 'reserved' && '⏳ Sedang Diproses (Menunggu ACC)'} {/* ✅ TAMBAHIN TEKS INI */}
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
        activeBookings={activeBookings} // ✅ OPER DATA JADWAL KE MODAL INFO
      />
    </>
  )
}

export default ItemCard