import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import ToolGrid from './components/ToolGrid'
import ToolWorkspace from './components/ToolWorkspace'
import HistoryPanel from './components/HistoryPanel'
import { useAppStore } from './store/useAppStore'
import { AnimatePresence, motion } from 'framer-motion'

function App() {
  const { activeTool, darkMode } = useAppStore()
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className={`app-shell min-h-screen relative overflow-hidden ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {darkMode ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/80 via-slate-50 to-cyan-100/50" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-200/30 to-cyan-200/20 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* Header */}
      <Header onHistoryClick={() => setShowHistory(!showHistory)} />

      {/* Main Content */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {!activeTool ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Hero />
              <ToolGrid />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ToolWorkspace />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <HistoryPanel onClose={() => setShowHistory(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
