import { motion } from 'framer-motion'
import { Hexagon, MessageCircle } from 'lucide-react'

interface HeaderProps {
  failureCount: number
  rootCauseCount: number
  notificationCount: number
  onOpenChat: () => void
}

export function Header({
  onOpenChat,
}: HeaderProps) {
  return (
    <header className="border-b border-border-subtle bg-bg-secondary px-6 py-3 flex items-center justify-between">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Hexagon className="w-7 h-7 text-accent-cyan" strokeWidth={1.5} />
        <div>
          <h1
            className="text-lg font-semibold tracking-tight text-text-primary"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            SSME Failure Detection System
          </h1>
          <p className="text-xs text-text-tertiary -mt-0.5">
            Powered by Prometheux
          </p>
        </div>
      </motion.div>

      <motion.button
        onClick={onOpenChat}
        className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/30 hover:bg-accent-blue/20 hover:border-accent-blue/50 transition-all duration-200 group"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="w-7 h-7 rounded-full bg-accent-blue flex items-center justify-center shadow-sm shadow-accent-blue/25 group-hover:shadow-accent-blue/40 transition-shadow">
          <MessageCircle className="w-3.5 h-3.5 text-white" />
        </div>
        <span
          className="text-sm text-text-secondary group-hover:text-text-primary transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Ask Prometheux Assistant
        </span>
      </motion.button>
    </header>
  )
}
