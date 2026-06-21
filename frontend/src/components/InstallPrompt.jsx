import { useState, useEffect } from 'react'
import Icon from './Icon'

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(!document.body.classList.contains('light-theme'))
    }
    checkTheme()

    // Pantau perubahan theme real-time
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      observer.disconnect()
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowPrompt(false)
      return
    }
    
    setShowPrompt(false)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User menginstal Inflashtory')
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  const darkBg = 'bg-[#1e1f23] border-white/10 shadow-black/50'
  const lightBg = 'bg-white border-gray-200 shadow-gray-200/70'

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-[9999] animate-fade-in-up">
      <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 sm:gap-4 ${isDark ? darkBg : lightBg}`}>
        
        <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
          <Icon name="app_shortcut" className="text-xl sm:text-2xl" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>Install Inflashtory</h4>
          <p className={`text-[10px] sm:text-xs mt-0.5 leading-tight truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Akses cepat & hemat kuota
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button 
            onClick={() => setShowPrompt(false)}
            className={`text-xs font-semibold px-2 py-2 transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Batal
          </button>
          <button 
            onClick={handleInstall}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-primary/30 transition"
          >
            Install
          </button>
        </div>

      </div>
    </div>
  )
}

export default InstallPrompt