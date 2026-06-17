import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Pastikan dark theme aktif di awal (tanpa class dark, karena body sudah dark default)
// Hapus class dark dari html karena body sudah dark default
const htmlElement = document.documentElement
htmlElement.classList.remove('dark') // Hapus class dark karena kita pakai body default

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)