// components/EmptyState.jsx
import GlassCard from './GlassCard'

const EmptyState = ({ icon, title, message, action }) => {
  return (
    <div className="py-16 px-4">
      <GlassCard className="p-6 sm:p-8 text-center max-w-md mx-auto">
        <div className="text-5xl sm:text-6xl mb-4">{icon || '📭'}</div>
        <h3
          className="text-lg sm:text-xl font-semibold text-gray-800 mb-2"
        >
          {title || 'Tidak ada data'}
        </h3>
        <p className="text-sm sm:text-base text-gray-500 mb-6">
          {message || 'Belum ada barang dengan status ini'}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            className="
              px-5 py-2.5 sm:px-6 sm:py-3
              bg-gradient-to-r from-blue-500 to-purple-600
              text-white rounded-2xl font-medium
              shadow-md hover:shadow-lg
              transition-all duration-200
            "
          >
            {action.label}
          </button>
        )}
      </GlassCard>
    </div>
  )
}

export default EmptyState