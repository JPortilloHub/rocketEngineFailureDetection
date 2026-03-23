import { motion } from 'framer-motion'
import { AlertTriangle, GitBranch, Target, Bell, BarChart3 } from 'lucide-react'
import type { ReactNode } from 'react'

interface SidebarProps {
  selectedStage: number | null
  onSelectStage: (stage: number | null) => void
}

interface StageInfo {
  id: number
  name: string
  description: string
  icon: ReactNode
}

const stages: StageInfo[] = [
  {
    id: 1,
    name: 'Failure Detection',
    description: 'Identify failed observable sensors',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    id: 2,
    name: 'Propagation',
    description: 'Trace failure chains through the network',
    icon: <GitBranch className="w-4 h-4" />,
  },
  {
    id: 3,
    name: 'Root Cause',
    description: 'Hotspot analysis and root cause ID',
    icon: <Target className="w-4 h-4" />,
  },
  {
    id: 4,
    name: 'Notifications',
    description: 'Alert responsible team leaders',
    icon: <Bell className="w-4 h-4" />,
  },
]

export function Sidebar({ selectedStage, onSelectStage }: SidebarProps) {
  return (
    <aside className="w-[280px] min-w-[280px] border-r border-border-subtle bg-bg-secondary flex flex-col overflow-y-auto">
      <motion.div
        className="p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-accent-cyan" />
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-text-tertiary"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Analysis Stages
          </h2>
        </div>

        <button
          onClick={() => onSelectStage(null)}
          className={`w-full text-left px-3 py-2 rounded-md mb-2 text-sm transition-all duration-200 ${
            selectedStage === null
              ? 'bg-accent-blue/15 border border-accent-blue/50 text-text-primary'
              : 'border border-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          Overview
        </button>

        <div className="flex flex-col gap-2">
          {stages.map((stage, idx) => {
            const isActive = selectedStage === stage.id
            return (
              <motion.button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-blue/15 border border-accent-blue/50'
                    : 'border border-transparent hover:bg-bg-elevated'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${
                      isActive
                        ? 'bg-accent-blue text-white'
                        : 'bg-bg-card text-text-tertiary'
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {stage.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`${
                          isActive ? 'text-accent-blue' : 'text-text-tertiary'
                        }`}
                      >
                        {stage.icon}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isActive ? 'text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {stage.name}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5 leading-snug">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      <div className="mt-auto p-4 border-t border-border-subtle">
        <div className="text-xs text-text-tertiary">
          <p style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Powered by Vadalog
          </p>
          <p className="mt-1 text-text-tertiary/60">Prometheux Platform</p>
        </div>
      </div>
    </aside>
  )
}
