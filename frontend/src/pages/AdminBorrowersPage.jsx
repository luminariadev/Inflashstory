import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import API from '../api'
import toast from 'react-hot-toast'

const AdminBorrowersPage = () => {
  const [isDark, setIsDark] = useState(true)
  const [borrowers, setBorrowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
      fetchBorrowers()
    }
    
    return () => observer.disconnect()
  }, [])

  const fetchBorrowers = async () => {
    try {
      const url = search ? `/admin/borrowers?search=${search}` : '/admin/borrowers'
      const response = await API.get(url, { headers: { 'X-Admin-Token': 'admin-secret-key' } })
      setBorrowers(response.data.data)
    } catch (error) {
      toast.error('Gagal memuat data peminjam')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBorrowers()
  }, [search])

  const titleClass = isDark ? 'text-white' : 'text-gray-800'
  const textClass = isDark ? 'text-slate-300' : 'text-gray-600'
  const cardClass = isDark ? 'glass-card' : 'bg-white rounded-xl shadow-md border border-gray-200 p-4'
  const inputClass = isDark 
    ? 'bg-surface-container-high border-white/10 text-white placeholder:text-slate-400 focus:ring-1 focus:ring-primary' 
    : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:ring-1 focus:ring-primary'
  
  const tableWrapperClass = isDark ? '' : 'border border-gray-200 rounded-xl overflow-hidden bg-white'
  const theadClass = isDark 
    ? 'border-b border-white/10' 
    : 'bg-gray-50 border-b border-gray-200'
  const thClass = `pb-3 pt-3 text-sm font-semibold px-4 ${titleClass}`
  const tdClass = `py-3 text-sm px-4`

  return (
    <div className="pb-12 space-y-6">
      <div>
        <h1 className={`text-2xl lg:text-3xl font-bold ${titleClass}`}>Data Peminjam</h1>
        <p className={`text-sm mt-1 ${textClass}`}>Kelola dan telusuri data peminjam barang</p>
      </div>

      <div className="relative max-w-md">
        <Icon name="search" className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
        <input type="text" placeholder="Cari berdasarkan nama, NIM, atau no HP..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition ${inputClass}`} />
      </div>

      {loading ? (
        <div className={`text-center py-10 ${textClass}`}>Memuat data...</div>
      ) : borrowers.length === 0 ? (
        <div className={`text-center py-10 ${textClass}`}>Tidak ada data peminjam</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <div className={tableWrapperClass}>
              <table className="w-full min-w-[800px]">
                <thead className={theadClass}>
                  <tr className="text-left">
                    <th className={thClass}>ID</th>
                    <th className={thClass}>Nama</th>
                    <th className={thClass}>NIM/NIP</th>
                    <th className={thClass}>Prodi</th>
                    <th className={thClass}>No HP</th>
                    <th className={thClass}>Email</th>
                    <th className={thClass}>Terdaftar</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowers.map((borrower) => (
                    <tr key={borrower.id} className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'} hover:bg-white/5 transition`}>
                      <td className={`${tdClass} ${textClass}`}>#{borrower.id}</td>
                      <td className={`${tdClass} ${titleClass} font-medium`}>{borrower.name}</td>
                      <td className={`${tdClass} ${textClass}`}>{borrower.identity_no || '-'}</td>
                      <td className={`${tdClass} ${textClass}`}>{borrower.study_program || '-'}</td>
                      <td className={`${tdClass} ${textClass}`}>{borrower.phone || '-'}</td>
                      <td className={`${tdClass} ${textClass}`}>{borrower.email || '-'}</td>
                      <td className={`${tdClass} ${textClass}`}>{new Date(borrower.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
            {borrowers.map((borrower) => (
              <div key={borrower.id} className={cardClass}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className={`text-xs ${textClass}`}>ID Peminjam</p>
                    <p className={`font-semibold ${titleClass}`}>#{borrower.id}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Nama</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{borrower.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>NIM/NIP</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{borrower.identity_no || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Prodi</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{borrower.study_program || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>No HP</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{borrower.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Email</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{borrower.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${textClass}`}>Terdaftar</span>
                    <span className={`text-sm font-medium ${titleClass}`}>{new Date(borrower.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminBorrowersPage