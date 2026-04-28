import { useState, useEffect } from 'react'
import API from '../api'

function ItemList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await API.get('/items')
      setItems(response.data.data)
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'borrowed': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Daftar Barang Inventaris</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
            <p className="text-gray-600 mb-2">Kode: {item.code}</p>
            <p className="text-gray-600 mb-2">Lokasi: {item.location || '-'}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
              {item.status}
            </span>
            <button 
              onClick={() => window.open(`http://localhost:8080/api/items/${item.id}/qr`, '_blank')}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            >
              📱 Lihat QR Code
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ItemList