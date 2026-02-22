import { motion } from 'framer-motion'
import { 
  FilesIcon, Scissors, Minimize2, FileEdit, Image, FolderInput, 
  Edit3, Lock, PenTool, ScanLine 
} from 'lucide-react'
import { useAppStore, TOOL_CONFIG } from '../store/useAppStore'
import type { PDFTool } from '../types'

const toolIcons: Record<PDFTool, React.ElementType> = {
  merge: FilesIcon,
  split: Scissors,
  compress: Minimize2,
  convert: FileEdit,
  'pdf-to-jpg': Image,
  organize: FolderInput,
  edit: Edit3,
  protect: Lock,
  sign: PenTool,
  ocr: ScanLine,
}

const tools: PDFTool[] = ['merge', 'split', 'compress', 'convert', 'pdf-to-jpg', 'organize', 'edit', 'sign', 'ocr']

export default function ToolGrid() {
  const setActiveTool = useAppStore(s => s.setActiveTool)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <section className="relative z-10 px-6 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {tools.map((tool) => {
            const config = TOOL_CONFIG[tool]
            const Icon = toolIcons[tool]
            
            return (
              <motion.button
                key={tool}
                variants={itemVariants}
                onClick={() => setActiveTool(tool)}
                className="tool-card group relative p-6 rounded-2xl glass glass-hover text-left overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className="tool-icon relative w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center group-hover:from-white/20 group-hover:to-white/10 transition-all">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                {/* Text */}
                <h3 className="font-semibold text-white mb-1">{config.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-2">{config.description}</p>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                  style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }} 
                />
              </motion.button>
            )
          })}
        </motion.div>

        {/* Categories */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          {['Basic Tools', 'Converters', 'Advanced', 'Security'].map((cat) => (
            <div key={cat} className="px-4 py-2 rounded-full glass text-sm text-slate-400">
              {cat}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
