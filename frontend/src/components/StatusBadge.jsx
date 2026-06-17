const statusConfig = {
  available: {
    label: 'Tersedia',
    bgDark: 'bg-tertiary-container',
    bgLight: 'bg-green-100',
    textDark: 'text-white',
    textLight: 'text-green-800',
    icon: 'check_circle'
  },
  // ✅ TAMBAHIN BLOK RESERVED INI BROK
  reserved: {
    label: 'Menunggu ACC',
    bgDark: 'bg-orange-500/40',
    bgLight: 'bg-orange-100',
    textDark: 'text-white',
    textLight: 'text-orange-800',
    icon: 'hourglass_empty'
  },
  borrowed: {
    label: 'Dipinjam',
    bgDark: 'bg-secondary-container',
    bgLight: 'bg-blue-100',
    textDark: 'text-white',
    textLight: 'text-blue-800',
    icon: 'sync_alt'
  },
  damaged: {
    label: 'Rusak',
    bgDark: 'bg-error-container',
    bgLight: 'bg-red-100',
    textDark: 'text-white',
    textLight: 'text-red-800',
    icon: 'error'
  },
  maintenance: {
    label: 'Perawatan',
    bgDark: 'bg-surface-container-highest',
    bgLight: 'bg-yellow-100',
    textDark: 'text-white',
    textLight: 'text-yellow-800',
    icon: 'build'
  },
  lost: {
    label: 'Hilang',
    bgDark: 'bg-surface-container-highest',
    bgLight: 'bg-gray-200',
    textDark: 'text-white',
    textLight: 'text-gray-800',
    icon: 'search_off'
  }
}

const StatusBadge = ({ status, customLabel, isDark = true }) => {
  const config = statusConfig[status] || statusConfig.available
  const bgClass = isDark ? config.bgDark : config.bgLight
  const textClass = isDark ? config.textDark : config.textLight
  
  // ✅ Pake customLabel kalau ada, kalau nggak ada balik ke config bawaan
  const displayLabel = customLabel || config.label

  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${bgClass} ${textClass}`}>
      {displayLabel}
    </span>
  )
}

export default StatusBadge