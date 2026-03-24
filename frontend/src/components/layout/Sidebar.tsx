import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  GitBranch,
  Target,
  Bell,
  BarChart3,
  Search,
  X,
  Radio,
  Activity,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { Component } from '../../types'

interface SidebarProps {
  selectedStage: number | null
  onSelectStage: (stage: number | null) => void
  selectedSensor: string | null
  onSelectSensor: (sensorId: string | null) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearchFocus: (componentId: string) => void
  components: Component[]
  failureCount: number
  rootCauseCount: number
  notificationCount: number
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

const SENSOR_OPTIONS = [
  { id: 'Temp_Sensor_A', label: 'Sensor A', color: '#EF4444' },
  { id: 'Temp_Sensor_B', label: 'Sensor B', color: '#F59E0B' },
  { id: 'Temp_Sensor_C', label: 'Sensor C', color: '#06B6D4' },
]

export function Sidebar({
  selectedStage,
  onSelectStage,
  selectedSensor,
  onSelectSensor,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  components,
  failureCount,
  rootCauseCount,
  notificationCount,
}: SidebarProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length === 0) return []
    const q = searchQuery.toLowerCase().trim()
    return components
      .filter((c) => {
        const name = c.ComponentID.toLowerCase().replace(/_/g, ' ')
        const id = c.ComponentID.toLowerCase()
        return name.includes(q) || id.includes(q)
      })
      .slice(0, 8)
  }, [searchQuery, components])

  const showSearchDropdown = searchFocused && searchResults.length > 0

  return (
    <aside className="w-[280px] min-w-[280px] border-r border-border-subtle bg-bg-secondary flex flex-col overflow-y-auto">
      <motion.div
        className="p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative mb-4">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
              searchFocused
                ? 'border-accent-blue/50 bg-bg-card'
                : 'border-border-subtle bg-bg-card/50'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                // Delay to allow click on dropdown
                setTimeout(() => setSearchFocused(false), 200)
              }}
              className="bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none w-full"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          <AnimatePresence>
            {showSearchDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-card border border-border-subtle rounded-lg shadow-xl overflow-hidden"
              >
                {searchResults.map((comp) => (
                  <button
                    key={comp.ComponentID}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      onSearchFocus(comp.ComponentID)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-bg-elevated transition-colors flex items-center gap-2"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        comp.Status === 'failed'
                          ? 'bg-status-critical'
                          : comp.Status === 'passed'
                            ? 'bg-status-healthy'
                            : 'bg-status-unknown'
                      }`}
                    />
                    <span
                      className="text-text-primary truncate"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {comp.ComponentID.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-text-tertiary ml-auto flex-shrink-0">
                      {comp.Team.replace('Team', '').replace('_', '')}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analysis Stages header */}
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
              <div key={stage.id}>
                <motion.button
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

                {/* Sensor focus buttons — only in Stage 2 */}
                <AnimatePresence>
                  {stage.id === 2 && isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pr-2 pt-2 pb-1">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Radio className="w-3 h-3 text-text-tertiary" />
                          <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                            Focus Chain
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => onSelectSensor(null)}
                            className={`text-left px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 ${
                              selectedSensor === null
                                ? 'bg-bg-elevated text-text-primary border border-border-subtle'
                                : 'text-text-secondary hover:bg-bg-elevated/50'
                            }`}
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            All Chains
                          </button>
                          {SENSOR_OPTIONS.map((sensor) => (
                            <button
                              key={sensor.id}
                              onClick={() => onSelectSensor(sensor.id)}
                              className={`text-left px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 flex items-center gap-2 ${
                                selectedSensor === sensor.id
                                  ? 'bg-bg-elevated text-text-primary border border-border-subtle'
                                  : 'text-text-secondary hover:bg-bg-elevated/50'
                              }`}
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: sensor.color }}
                              />
                              {sensor.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* KPIs section */}
      <div className="p-4 border-t border-border-subtle">
        <h2
          className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-3"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          KPIs
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-bg-card border border-border-subtle">
            <AlertTriangle className="w-4 h-4 text-status-critical flex-shrink-0" />
            <span
              className="text-sm text-text-secondary"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="text-status-critical font-semibold">
                {failureCount}
              </span>{' '}
              Failures
            </span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-bg-card border border-border-subtle">
            <Activity className="w-4 h-4 text-status-root-cause flex-shrink-0" />
            <span
              className="text-sm text-text-secondary"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="text-status-root-cause font-semibold">
                {rootCauseCount}
              </span>{' '}
              Root Causes
            </span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-bg-card border border-border-subtle">
            <Bell className="w-4 h-4 text-accent-cyan flex-shrink-0" />
            <span
              className="text-sm text-text-secondary"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="text-accent-cyan font-semibold">
                {notificationCount}
              </span>{' '}
              Notified
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
