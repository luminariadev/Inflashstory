const statusConfig = {
  available: {
    label: 'Tersedia',
    bgDark: 'bg-tertiary-container',
    bgLight: 'bg-green-100',
    textDark: 'text-white',
    textLight: 'text-green-800',
    icon: 'check_circle'
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

const StatusBadge = ({ status, isDark = true }) => {
  const config = statusConfig[status] || statusConfig.available
  const bgClass = isDark ? config.bgDark : config.bgLight
  const textClass = isDark ? config.textDark : config.textLight

  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${bgClass} ${textClass}`}>
      {config.label}
    </span>
  )
}

export default StatusBadge