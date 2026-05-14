import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'

const AdminItemsPage = () => {
  const [isDark, setIsDark] = useState(true)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    name: '', code: '', category: '', location: '', description: '', status: 'available', condition: 'good', image_url: ''
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
      fetchItems()
    }
    
    return () => observer.disconnect()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await API.get('/items')
      setItems(response.data.data)
    } catch (error) {
      toast.error('Gagal memuat data barang')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let imageUrl = formData.image_url
    if (selectedImage) {
      imageUrl = imagePreview
    }
    
    const submitData = { ...formData, image_url: imageUrl }
    
    try {
      if (editingItem) {
        await API.put(`/admin/items/${editingItem.id}`, submitData, { headers: { 'X-Admin-Token': 'admin-secret-key' } })
        toast.success('Barang berhasil diupdate')
      } else {
        await API.post('/admin/items', submitData, { headers: { 'X-Admin-Token': 'admin-secret-key' } })
        toast.success('Barang berhasil ditambahkan')
      }
      setShowModal(false)
      setEditingItem(null)
      setSelectedImage(null)
      setImagePreview(null)
      setFormData({ name: '', code: '', category: '', location: '', description: '', status: 'available', condition: 'good', image_url: '' })
      fetchItems()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan data')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus barang ini?')) {
      try {
        await API.delete(`/admin/items/${id}`, { headers: { 'X-Admin-Token': 'admin-secret-key' } })
        toast.success('Barang berhasil dihapus')
        fetchItems()
      } catch (error) {
        toast.error(error.response?.data?.message || 'Gagal menghapus barang')
      }
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.patch(`/admin/items/${id}/status`, { status: newStatus }, { headers: { 'X-Admin-Token': 'admin-secret-key' } })
      toast.success('Status berhasil diubah')
      fetchItems()
    } catch (error) {
      toast.error('Gagal mengubah status')
    }
  }

  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const inputClass = isDark 
    ? 'bg-surface-container-high border-white/10 text-white placeholder:text-slate-400 focus:ring-1 focus:ring-primary' 
    : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:ring-1 focus:ring-primary'
  const cardClass = isDark ? 'glass-card' : 'bg-white rounded-xl shadow-md border border-gray-200 p-4'
  
  // Perbaikan header tabel light mode
  const tableWrapperClass = isDark ? '' : 'border border-gray-200 rounded-xl overflow-hidden bg-white'
  const theadClass = isDark 
    ? 'border-b border-white/10' 
    : 'bg-gray-50 border-b border-gray-200'
  const thClass = `pb-3 pt-3 text-sm font-semibold px-4 ${titleClass}`
  const tdClass = `py-3 text-sm px-4`

  const statusOptions = [
    { value: 'available', label: 'Tersedia', class: 'bg-green-500/20 text-green-600' },
    { value: 'borrowed', label: 'Dipinjam', class: 'bg-blue-500/20 text-blue-600' },
    { value: 'damaged', label: 'Rusak', class: 'bg-red-500/20 text-red-600' },
    { value: 'maintenance', label: 'Perawatan', class: 'bg-yellow-500/20 text-yellow-600' },
    { value: 'lost', label: 'Hilang', class: 'bg-gray-500/20 text-gray-600' },
  ]

  return (
    <div className="pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${titleClass}`}>Manajemen Barang</h1>
          <p className={`text-sm mt-1 ${textClass}`}>Tambah, edit, atau hapus barang inventaris</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setFormData({ name: '', code: '', category: '', location: '', description: '', status: 'available', condition: 'good', image_url: '' }); setSelectedImage(null); setImagePreview(null); setShowModal(true) }}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
        >
          <Icon name="add" className="text-base" />
          Tambah Barang
        </button>
      </div>

      {/* Loading & Empty State */}
      {loading ? (
        <div className={`text-center py-10 ${textClass}`}>Memuat data...</div>
      ) : items.length === 0 ? (
        <div className={`text-center py-10 ${textClass}`}>Tidak ada data</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <div className={tableWrapperClass}>
              <table className="w-full min-w-[800px]">
                <thead className={theadClass}>
                  <tr className="text-left">
                    <th className={thClass}>Foto</th>
                    <th className={thClass}>Nama</th>
                    <th className={thClass}>Kode</th>
                    <th className={thClass}>Kategori</th>
                    <th className={thClass}>Lokasi</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const statusStyle = statusOptions.find(s => s.value === item.status) || statusOptions[0]
                    return (
                      <tr key={item.id} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'} hover:bg-white/5 transition`}>
                        <td className={tdClass}>
                          <img 
                            src={item.image_url || `https://picsum.photos/seed/${item.id}/40/40`} 
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        </td>
                        <td className={`${tdClass} ${titleClass} font-medium`}>{item.name}</td>
                        <td className={`${tdClass} ${textClass}`}>{item.code || `INV-${item.id}`}</td>
                        <td className={`${tdClass} ${textClass}`}>{item.category || '-'}</td>
                        <td className={`${tdClass} ${textClass}`}>{item.location || '-'}</td>
                        <td className={tdClass}>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full ${statusStyle.class} bg-transparent border border-current/20 focus:outline-none cursor-pointer`}
                          >
                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                         </td>
                        <td className={tdClass}>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingItem(item); setFormData({ name: item.name, code: item.code || '', category: item.category || '', location: item.location || '', description: item.description || '', status: item.status, condition: item.condition || 'good', image_url: item.image_url || '' }); setSelectedImage(null); setImagePreview(null); setShowModal(true) }} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                              <Icon name="edit" className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                              <Icon name="delete" className="text-base text-red-500" />
                            </button>
                            <button onClick={() => window.open(`http://localhost:8080/api/items/${item.id}/qr`, '_blank')} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                              <Icon name="qr_code" className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                            </button>
                          </div>
                         </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - sama seperti sebelumnya */}
          <div className="space-y-4 md:hidden">
            {items.map((item) => {
              const statusStyle = statusOptions.find(s => s.value === item.status) || statusOptions[0]
              return (
                <div key={item.id} className={`${cardClass} space-y-3`}>
                  <div className="flex gap-3">
                    <img 
                      src={item.image_url || `https://picsum.photos/seed/${item.id}/60/60`} 
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`font-semibold text-base ${titleClass}`}>{item.name}</h3>
                          <p className={`text-xs mt-0.5 ${textClass}`}>{item.code || `INV-${item.id}`}</p>
                        </div>
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full ${statusStyle.class} bg-transparent border border-current/20 focus:outline-none cursor-pointer`}
                        >
                          {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-3 text-sm rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`text-xs ${textClass}`}>Kategori</p>
                      <p className={`text-sm font-medium ${titleClass}`}>{item.category || '-'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${textClass}`}>Lokasi</p>
                      <p className={`text-sm font-medium ${titleClass}`}>{item.location || '-'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${textClass}`}>Kondisi</p>
                      <p className={`text-sm font-medium capitalize ${titleClass}`}>{item.condition || 'Baik'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${textClass}`}>Deskripsi</p>
                      <p className={`text-sm ${titleClass} line-clamp-1`}>{item.description || '-'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { setEditingItem(item); setFormData({ name: item.name, code: item.code || '', category: item.category || '', location: item.location || '', description: item.description || '', status: item.status, condition: item.condition || 'good', image_url: item.image_url || '' }); setSelectedImage(null); setImagePreview(null); setShowModal(true) }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition ${isDark ? 'glass text-white' : 'bg-gray-100 text-gray-700'}`}>
                      <Icon name="edit" className="text-base" /> Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition ${isDark ? 'glass text-red-400' : 'bg-red-50 text-red-600'}`}>
                      <Icon name="delete" className="text-base" /> Hapus
                    </button>
                    <button onClick={() => window.open(`http://localhost:8080/api/items/${item.id}/qr`, '_blank')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition ${isDark ? 'glass text-white' : 'bg-gray-100 text-gray-700'}`}>
                      <Icon name="qr_code" className="text-base" /> QR
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal Form - same as before */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className={`${cardClass} max-w-lg w-full p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className={`text-xl font-bold ${titleClass}`}>{editingItem ? '✏️ Edit Barang' : '➕ Tambah Barang'}</h3>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Foto Barang</label>
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-xl overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center`}>
                    {imagePreview || formData.image_url ? (
                      <img src={imagePreview || formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="photo_camera" className={`text-3xl ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <label className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition ${isDark ? 'glass text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    <Icon name="upload" className="text-base inline mr-1" />
                    Pilih Foto
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Nama Barang *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full px-4 py-2 rounded-xl border outline-none transition ${inputClass}`} required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Kode Barang</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className={`w-full px-4 py-2 rounded-xl border outline-none transition ${inputClass}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Kategori</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={`w-full px-4 py-2 rounded-xl border outline-none transition ${inputClass}`} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Lokasi</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className={`w-full px-4 py-2 rounded-xl border outline-none transition ${inputClass}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Kondisi</label>
                  <select value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})} className={`w-full px-4 py-2 rounded-xl border outline-none transition ${inputClass}`}>
                    <option value="good">Baik</option>
                    <option value="fair">Cukup</option>
                    <option value="damaged">Rusak</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Deskripsi</label>
                <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={`w-full px-4 py-2 rounded-xl border outline-none transition ${inputClass}`} />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${isDark ? 'glass text-white' : 'bg-gray-100 text-gray-700'}`}>Batal</button>
                <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminItemsPage