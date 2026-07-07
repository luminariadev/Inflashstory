import Icon from './Icon'

const Footer = ({ isDark = true }) => {
  return (
    <footer className={`w-full mt-auto ${
      isDark 
        ? 'bg-[#0f172a]/90 backdrop-blur-md border-t border-white/10' 
        : 'bg-white border-t border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <img src="/assets/images/saintek.png" alt="FST" className="h-6 w-auto" />
            <img src="/assets/images/uin.png" alt="UNJ" className="h-6 w-auto" />
            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
              Fstorage - FST
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className={`text-xs transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
              Privacy Policy
            </a>
            <a href="#" className={`text-xs transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
              Terms of Service
            </a>
            <a href="#" className={`text-xs transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
              Contact Support
            </a>
          </div>
          
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            © 2024 Fstorage - Fakultas Sains dan Teknologi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer