import { motion } from 'framer-motion'
import { AlertTriangle, Activity, Bell, Hexagon } from 'lucide-react'

interface HeaderProps {
  failureCount: number
  rootCauseCount: number
  notificationCount: number
}

export function Header({
  failureCount,
  rootCauseCount,
  notificationCount,
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
            Prometheux Digital Twin
          </h1>
          <p className="text-xs text-text-tertiary -mt-0.5">
            SSME Failure Detection System
          </p>
        </div>
      </motion.div>

      <div className="flex items-center gap-4">
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-card border border-border-subtle"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <AlertTriangle className="w-4 h-4 text-status-critical" />
          <span
            className="text-sm text-text-secondary"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span className="text-status-critical font-semibold">
              {failureCount}
            </span>{' '}
            Failures
          </span>
        </motion.div>

        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-card border border-border-subtle"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Activity className="w-4 h-4 text-status-root-cause" />
          <span
            className="text-sm text-text-secondary"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span className="text-status-root-cause font-semibold">
              {rootCauseCount}
            </span>{' '}
            Root Causes
          </span>
        </motion.div>

        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-card border border-border-subtle"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Bell className="w-4 h-4 text-accent-cyan" />
          <span
            className="text-sm text-text-secondary"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span className="text-accent-cyan font-semibold">
              {notificationCount}
            </span>{' '}
            Notified
          </span>
        </motion.div>
      </div>
    </header>
  )
}
