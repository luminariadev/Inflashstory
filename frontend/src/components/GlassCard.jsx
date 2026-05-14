const GlassCard = ({ children, className = "", onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass rounded-xl p-lg transition-all duration-300 ${onClick ? 'glass-hover cursor-pointer active:scale-95' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export default GlassCard