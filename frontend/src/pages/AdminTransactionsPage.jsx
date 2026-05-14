import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'

const AdminTransactionsPage = () => {
  const [isDark, setIsDark] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReturnModal, setShowReturnModal] = useState(null)

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
      fetchTransactions()
    }
    
    return () => observer.disconnect()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await API.get('/admin/transactions', {
        headers: { 'X-Admin-Token': 'admin-secret-key' }
      })
      setTransactions(response.data.data)
    } catch (error) {
      toast.error('Gagal memuat data transaksi')
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (transactionId) => {
    try {
      await API.post(`/admin/return/${transactionId}`, { notes: 'Dikembalikan oleh admin' }, {
        headers: { 'X-Admin-Token': 'admin-secret-key' }
      })
      toast.success('Barang berhasil dikembalikan')
      setShowReturnModal(null)
      fetchTransactions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengembalikan barang')
    }
  }

  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const cardClass = isDark ? 'glass-card' : 'bg-white rounded-xl shadow-md border border-gray-200 p-4'
  
  const tableWrapperClass = isDark ? '' : 'border border-gray-200 rounded-xl overflow-hidden bg-white'
  const theadClass = isDark 
    ? 'border-b border-white/10' 
    : 'bg-gray-50 border-b border-gray-200'
  const thClass = `pb-3 pt-3 text-sm font-semibold px-4 ${titleClass}`
  const tdClass = `py-3 text-sm px-4`

  const statusBadgeClass = (status) => {
    if (status === 'borrowed') return 'bg-blue-500/20 text-blue-600'
    if (status === 'returned') return 'bg-green-500/20 text-green-600'
    return 'bg-yellow-500/20 text-yellow-600'
  }

  return (
    <div className="pb-12 space-y-6">
      <div>
        <h1 className={`text-2xl lg:text-3xl font-bold ${titleClass}`}>Transaksi Peminjaman</h1>
        <p className={`text-sm mt-1 ${textClass}`}>Kelola dan pantau semua transaksi peminjaman</p>
      </div>

      {loading ? (
        <div className={`text-center py-10 ${textClass}`}>Memuat data...</div>
      ) : transactions.length === 0 ? (
        <div className={`text-center py-10 ${textClass}`}>Tidak ada transaksi</div>
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
                    <th className={thClass}>Tgl Pinjam</th>
                    <th className={thClass}>Estimasi</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx) => (
                    <tr key={trx.id} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'} hover:bg-white/5 transition`}>
                      <td className={`${tdClass} ${textClass}`}>#{trx.id}</td>
                      <td className={`${tdClass} ${titleClass} font-medium`}>{trx.item?.name || '-'}</td>
                      <td className={`${tdClass} ${textClass}`}>{trx.borrower?.name || '-'}</td>
                      <td className={`${tdClass} ${textClass}`}>{new Date(trx.borrow_date).toLocaleDateString()}</td>
                      <td className={`${tdClass} ${textClass}`}>{new Date(trx.est_return_date).toLocaleDateString()}</td>
                      <td className={tdClass}>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadgeClass(trx.status)}`}>
                          {trx.status === 'borrowed' ? 'Dipinjam' : 'Dikembalikan'}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {trx.status === 'borrowed' && (
                          <button onClick={() => setShowReturnModal(trx)} className="bg-green-500/20 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-500/30 transition">
                            Kembalikan
                          </button>
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
            {transactions.map((trx) => (
              <div key={trx.id} className={cardClass}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className={`text-xs ${textClass}`}>ID Transaksi</p>
                    <p className={`font-semibold ${titleClass}`}>#{trx.id}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusBadgeClass(trx.status)}`}>
                    {trx.status === 'borrowed' ? 'Dipinjam' : 'Dikembalikan'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Barang</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{trx.item?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Peminjam</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{trx.borrower?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Tgl Pinjam</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{new Date(trx.borrow_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Estimasi</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{new Date(trx.est_return_date).toLocaleDateString()}</span>
                  </div>
                </div>
                {trx.status === 'borrowed' && (
                  <button onClick={() => setShowReturnModal(trx)} className="w-full mt-4 bg-green-500/20 text-green-600 py-2.5 rounded-lg text-sm font-medium hover:bg-green-500/30 transition">
                    Kembalikan
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Return */}
      {showReturnModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowReturnModal(null)}>
          <div className={`${cardClass} max-w-md w-full p-6 rounded-2xl space-y-4`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className={`text-xl font-bold ${titleClass}`}>Konfirmasi Pengembalian</h3>
              <button onClick={() => setShowReturnModal(null)} className={`material-symbols-outlined ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>close</button>
            </div>
            <p className={textClass}>Yakin ingin mengembalikan barang <span className="font-semibold">{showReturnModal.item?.name}</span>?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowReturnModal(null)} className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>Batal</button>
              <button onClick={() => handleReturn(showReturnModal.id)} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold text-sm">Ya, Kembalikan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTransactionsPage