import { motion } from 'framer-motion'
import { X, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { useAppStore, TOOL_CONFIG } from '../store/useAppStore'

interface HistoryPanelProps {
  onClose: () => void
}

export default function HistoryPanel({ onClose }: HistoryPanelProps) {
  const { history, clearHistory } = useAppStore()

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold">History</h2>
          <span className="px-2 py-0.5 rounded-full glass text-xs">{history.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full glass flex items-center justify-center">
              <Clock className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400">No history yet</p>
            <p className="text-sm text-slate-500 mt-1">Your processed files will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const config = TOOL_CONFIG[item.tool]
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl glass hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                      {item.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <XCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.fileName}</p>
                      <p className="text-sm text-slate-400">{config.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(item.timestamp)}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
