import { History, Moon, Sun, Zap } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

interface HeaderProps {
  onHistoryClick: () => void
}

export default function Header({ onHistoryClick }: HeaderProps) {
  const { darkMode, toggleDarkMode, setActiveTool } = useAppStore()

  return (
    <header className="relative z-20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setActiveTool(null)}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl blur-lg opacity-50" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-white">Nebula</span>
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">PDF</span>
          </span>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onHistoryClick}
            className="p-2.5 rounded-xl glass hover:bg-white/10 transition-all group"
            title="History"
          >
            <History className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
          </button>
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl glass hover:bg-white/10 transition-all group"
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
