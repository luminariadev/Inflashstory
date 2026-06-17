import { useEffect, useState, useCallback } from 'react'
import Icon from '../components/Icon'
import ItemCard from '../components/ItemCard'
import API from '../api'

const ItemListPage = () => {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.body.classList.contains('light-theme'))
    }
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  const filters = [
    { value: 'all', label: 'SEMUA', icon: 'inventory_2' },
    { value: 'available', label: 'TERSEDIA', icon: 'check_circle' },
    { value: 'reserved', label: 'MENUNGGU ACC', icon: 'hourglass_empty' }, // ✅ TAMBAHIN INI
    { value: 'borrowed', label: 'DIPINJAM', icon: 'sync_alt' },
    { value: 'damaged', label: 'RUSAK', icon: 'error' },
    { value: 'maintenance', label: 'PERAWATAN', icon: 'build' },
  ]

  // ✅ PASTIKAN LU NAMBAHIN IMPORT INI DI PALING ATAS FILE BARENG IMPORT REACT:
  // import toast from 'react-hot-toast'

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const response = await API.get('/items')
      setItems(response.data.data)
    } catch (error) {
      console.error('Error fetching items:', error)
      
      // ✅ LOGIKA PWA OFFLINE: Kasih tau user kalau error ini karena ga ada internet
      if (!navigator.onLine) {
        import('react-hot-toast').then(({ default: toast }) => {
           toast.error("Kamu sedang offline! Gagal mengambil data terbaru.", { 
             id: 'offline-toast', // ✅ FIX DOBEL: Kunci unik biar notif nggak spam/numpuk!
             icon: '📶', 
             duration: 4000 
           })
        })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    let result = [...items]
    
    if (activeFilter !== 'all') {
      result = result.filter(item => item.status === activeFilter)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.code && item.code.toLowerCase().includes(query))
      )
    }
    
    setFilteredItems(result)
  }, [items, activeFilter, searchQuery])

  const cardClass = isDark ? 'glass-card' : 'glass-card-light'
  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const inputClass = isDark 
    ? 'bg-surface-container-high border-white/10 text-white placeholder:text-slate-400 focus:ring-1 focus:ring-primary' 
    : 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:ring-1 focus:ring-primary'

  return (
    <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-6 flex-1">
      <section className="space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className={`text-3xl font-bold ${titleClass}`}>Daftar Barang Inventaris</h2>
            <p className={`text-sm ${textClass}`}>Kelola dan telusuri seluruh aset kampus dengan mudah.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Icon name="search" className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Cari barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl pl-11 pr-4 py-3 outline-none transition ${inputClass}`}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`text-xs font-bold tracking-wide px-4 py-2 rounded-full transition-all ${
                activeFilter === filter.value
                  ? 'bg-primary text-white'
                  : isDark 
                    ? 'glass text-white/80 glass-hover' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className={`animate-pulse ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Memuat data...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={`${cardClass} p-12 text-center`}>
            <Icon name="inventory_2" className={`text-5xl mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Tidak ada barang ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} isDark={isDark} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default ItemListPage