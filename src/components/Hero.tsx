import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap, FileText, Clock } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative z-10 px-6 py-12 md:py-20">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-slate-300">Fast browser-based PDF toolkit</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
        >
          Every PDF tool you need.{' '}
          <span className="gradient-text">Completely free.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto"
        >
          Merge, split, compress, convert, sign, and annotate PDFs in a few clicks.
          Your files stay local in your browser session.
        </motion.p>

        {/* Feature Pills */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {[
            { icon: Zap, text: 'Lightning Fast' },
            { icon: Shield, text: 'Private Local Processing' },
            { icon: FileText, text: 'Reliable Exports' },
            { icon: Clock, text: 'Auto-save History' },
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-slate-300">
              <feature.icon className="w-4 h-4 text-violet-400" />
              {feature.text}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 hover:from-violet-600 hover:via-purple-600 hover:to-cyan-600 transition-all font-semibold text-lg overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}
