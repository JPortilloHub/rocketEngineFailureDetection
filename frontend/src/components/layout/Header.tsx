import { motion } from 'framer-motion'
import { Hexagon } from 'lucide-react'

interface HeaderProps {
  failureCount: number
  rootCauseCount: number
  notificationCount: number
}

export function Header({}: HeaderProps) {
  return (
    <header className="border-b border-border-subtle bg-bg-secondary px-6 py-3 flex items-center">
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
    </header>
  )
}
