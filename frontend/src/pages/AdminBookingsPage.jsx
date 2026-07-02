import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'

const AdminBookingsPage = () => {
  const [isDark, setIsDark] = useState(true)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  
  const [adminData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adminData') || '{}')
    } catch {
      return {}
    }
  })
  const isSuperAdmin = adminData?.role === 'Super_Admin'

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
      fetchBookings()
    }
    
    return () => observer.disconnect()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await API.get('/admin/bookings', {
        headers: { 'X-Admin-Token': 'admin-secret-key' }
      })
      setBookings(response.data.data)
    } catch (error) {
      toast.error('Gagal memuat data booking')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bookingId, status) => {
    try {
      await API.put(`/admin/bookings/${bookingId}/approve`, { status, notes: `Booking ${status} oleh admin` }, {
        headers: { 
          'X-Admin-Token': 'admin-secret-key',
          'X-Admin-Username': adminData.username || ''
        }
      })
      toast.success(`Booking ${status === 'approved' ? 'disetujui' : 'ditolak'}`)
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memproses booking')
    }
  }

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const filters = [
    { value: 'all', label: 'Semua' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ]

  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const cardClass = isDark ? 'glass-card' : 'bg-white rounded-xl shadow-md border border-gray-200 p-4'
  
  const tableWrapperClass = isDark ? '' : 'border border-gray-200 rounded-xl overflow-hidden bg-white'
  const theadClass = isDark 
    ? 'border-b border-white/10' 
    : 'bg-gray-50 border-b border-gray-200'
  const thClass = `pb-3 pt-3 text-sm font-semibold px-4 ${titleClass}`
  const tdClass = `py-3 text-sm px-4`

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', class: 'bg-yellow-500/20 text-yellow-600' },
      approved: { label: 'Disetujui', class: 'bg-green-500/20 text-green-600' },
      rejected: { label: 'Ditolak', class: 'bg-red-500/20 text-red-600' },
      expired: { label: 'Expired', class: 'bg-gray-500/20 text-gray-600' },
      cancelled: { label: 'Dibatalkan', class: 'bg-orange-500/20 text-orange-600' }
    }
    const s = statusMap[status] || statusMap.pending
    return <span className={`text-xs px-2 py-1 rounded-full ${s.class}`}>{s.label}</span>
  }

  return (
    <div className="pb-12 space-y-6">
      <div>
        <h1 className={`text-2xl lg:text-3xl font-bold ${titleClass}`}>Manajemen Booking</h1>
        <p className={`text-sm mt-1 ${textClass}`}>Kelola dan approve/reject booking barang</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={`text-xs font-medium px-4 py-2 rounded-full transition ${filter === f.value ? 'bg-primary text-white' : isDark ? 'bg-white/10 text-slate-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={`text-center py-10 ${textClass}`}>Memuat data...</div>
      ) : filteredBookings.length === 0 ? (
        <div className={`text-center py-10 ${textClass}`}>Tidak ada data booking</div>
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
                    <th className={thClass}>Peminjam</th>
                    <th className={thClass}>Tgl Booking</th>
                    <th className={thClass}>Expiry</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'} hover:bg-white/5 transition`}>
                      <td className={`${tdClass} ${textClass}`}>#{booking.id}</td>
                      <td className={`${tdClass} ${titleClass} font-medium`}>{booking.item?.name || '-'}</td>
                      <td className={`${tdClass} ${textClass}`}>
                        <p className={`${titleClass} font-medium`}>{booking.borrower?.name || '-'}</p>
                        <div className="flex flex-col gap-1 mt-1.5">
                          {booking.surat_url && (
                            <a href={`${API.defaults.baseURL.replace('/api', '')}${booking.surat_url}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 w-max">
                              <Icon name="description" className="text-[12px]" /> Lihat Surat Permohonan
                            </a>
                          )}
                          {booking.ktp_url && (
                            <a href={`${API.defaults.baseURL.replace('/api', '')}${booking.ktp_url}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 w-max">
                              <Icon name="badge" className="text-[12px]" /> Lihat KTP
                            </a>
                          )}
                        </div>
                      </td>
                      <td className={`${tdClass} ${textClass}`}>{new Date(booking.booking_date).toLocaleDateString()}</td>
                      <td className={`${tdClass} ${textClass}`}>{new Date(booking.expiry_date).toLocaleDateString()}</td>
                      <td className={tdClass}>{getStatusBadge(booking.status)}</td>
                      <td className={tdClass}>
                        {booking.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => isSuperAdmin && handleApprove(booking.id, 'approved')} 
                                disabled={!isSuperAdmin}
                                title={!isSuperAdmin ? "Hanya Super Admin yang dapat menyetujui" : ""}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${isSuperAdmin ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30 cursor-pointer' : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'}`}
                              >
                                Setujui
                              </button>
                              <button 
                                onClick={() => isSuperAdmin && handleApprove(booking.id, 'rejected')} 
                                disabled={!isSuperAdmin}
                                title={!isSuperAdmin ? "Hanya Super Admin yang dapat menolak" : ""}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${isSuperAdmin ? 'bg-red-500/20 text-red-600 hover:bg-red-500/30 cursor-pointer' : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'}`}
                              >
                                Tolak
                              </button>
                            </div>
                            {!isSuperAdmin && (
                              <p className="text-[10px] text-orange-500 leading-tight w-max max-w-[150px]">
                                Akses dibatasi. Hanya Super Admin yang dapat menyetujui dokumen ini.
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className={cardClass}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className={`text-xs ${textClass}`}>ID Booking</p>
                    <p className={`font-semibold ${titleClass}`}>#{booking.id}</p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Barang</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{booking.item?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className={`text-sm ${textClass}`}>Peminjam</span>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${titleClass}`}>{booking.borrower?.name || '-'}</span>
                      <div className="flex flex-col items-end gap-1 mt-1">
                        {booking.surat_url && (
                          <a href={`${API.defaults.baseURL.replace('/api', '')}${booking.surat_url}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 justify-end">
                            <Icon name="description" className="text-[12px]" /> Lihat Surat Permohonan
                          </a>
                        )}
                        {booking.ktp_url && (
                          <a href={`${API.defaults.baseURL.replace('/api', '')}${booking.ktp_url}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 justify-end">
                            <Icon name="badge" className="text-[12px]" /> Lihat KTP
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Tgl Booking</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{new Date(booking.booking_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Expiry</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{new Date(booking.expiry_date).toLocaleDateString()}</span>
                  </div>
                </div>
                {booking.status === 'pending' && (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => isSuperAdmin && handleApprove(booking.id, 'approved')} 
                        disabled={!isSuperAdmin}
                        title={!isSuperAdmin ? "Hanya Super Admin yang dapat menyetujui" : ""}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${isSuperAdmin ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30 cursor-pointer' : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'}`}
                      >
                        Setujui
                      </button>
                      <button 
                        onClick={() => isSuperAdmin && handleApprove(booking.id, 'rejected')} 
                        disabled={!isSuperAdmin}
                        title={!isSuperAdmin ? "Hanya Super Admin yang dapat menolak" : ""}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${isSuperAdmin ? 'bg-red-500/20 text-red-600 hover:bg-red-500/30 cursor-pointer' : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'}`}
                      >
                        Tolak
                      </button>
                    </div>
                    {!isSuperAdmin && (
                      <p className="text-[11px] text-orange-500 text-center italic mt-1">
                        * Akses dibatasi. Hanya Super Admin yang dapat menyetujui dokumen ini.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminBookingsPage