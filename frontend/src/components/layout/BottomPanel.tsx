import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  GitBranch,
  Target,
  Bell,
  Info,
  User,
} from 'lucide-react'
import type {
  DirectFailure,
  FailureChainStep,
  Hotspot,
  Notification,
} from '../../types'

interface BottomPanelProps {
  selectedStage: number | null
  failedSensors: DirectFailure[]
  propagation: FailureChainStep[]
  hotspots: Hotspot[]
  rootCauses: Hotspot[]
  notifications: Notification[]
}

const SENSOR_COLORS: Record<string, string> = {
  Temp_Sensor_A: '#EF4444',
  Temp_Sensor_B: '#F59E0B',
  Temp_Sensor_C: '#06B6D4',
}

export function BottomPanel({
  selectedStage,
  failedSensors,
  propagation,
  hotspots,
  rootCauses,
  notifications,
}: BottomPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  const rootCauseIds = new Set(rootCauses.map((r) => r.ComponentId))

  const stageLabel =
    selectedStage === 1
      ? 'Stage 1: Failure Detection'
      : selectedStage === 2
        ? 'Stage 2: Failure Propagation'
        : selectedStage === 3
          ? 'Stage 3: Root Cause Analysis'
          : selectedStage === 4
            ? 'Stage 4: Notifications'
            : 'System Overview'

  const stageIcon =
    selectedStage === 1 ? (
      <AlertTriangle className="w-4 h-4 text-status-critical" />
    ) : selectedStage === 2 ? (
      <GitBranch className="w-4 h-4 text-status-warning" />
    ) : selectedStage === 3 ? (
      <Target className="w-4 h-4 text-status-root-cause" />
    ) : selectedStage === 4 ? (
      <Bell className="w-4 h-4 text-accent-cyan" />
    ) : (
      <Info className="w-4 h-4 text-accent-blue" />
    )

  return (
    <div className="border-t border-border-subtle bg-bg-secondary">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-bg-elevated transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          {stageIcon}
          <span
            className="text-sm font-medium text-text-primary"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {stageLabel}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-text-tertiary" />
        ) : (
          <ChevronUp className="w-4 h-4 text-text-tertiary" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 max-h-[240px] overflow-y-auto">
              {selectedStage === null && <OverviewContent />}
              {selectedStage === 1 && (
                <Stage1Content failedSensors={failedSensors} />
              )}
              {selectedStage === 2 && (
                <Stage2Content propagation={propagation} />
              )}
              {selectedStage === 3 && (
                <Stage3Content
                  hotspots={hotspots}
                  rootCauseIds={rootCauseIds}
                />
              )}
              {selectedStage === 4 && (
                <Stage4Content notifications={notifications} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function OverviewContent() {
  return (
    <div className="text-sm text-text-secondary leading-relaxed space-y-2">
      <p>
        This Digital Twin models the Space Shuttle Main Engine (SSME) component
        network and detects failure propagation paths using recursive Vadalog
        reasoning on the Prometheux platform.
      </p>
      <p>
        Select an analysis stage from the sidebar to explore each phase of the
        failure detection pipeline. The graph visualizes 25 interconnected
        components across 5 teams, with 3 active failure chains detected from
        observable sensors.
      </p>
    </div>
  )
}

function Stage1Content({
  failedSensors,
}: {
  failedSensors: DirectFailure[]
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-text-tertiary text-left border-b border-border-subtle">
          <th className="pb-2 pr-4 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Failed Sensor
          </th>
          <th className="pb-2 pr-4 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Affected Component
          </th>
          <th className="pb-2 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {failedSensors.map((f) => (
          <tr
            key={f.SensorId}
            className="border-b border-border-subtle/50 hover:bg-bg-elevated/50 transition-colors"
          >
            <td className="py-2.5 pr-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SENSOR_COLORS[f.SensorId] || '#EF4444' }}
                />
                <span className="text-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {f.SensorId.replace(/_/g, ' ')}
                </span>
              </div>
            </td>
            <td className="py-2.5 pr-4 text-text-secondary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {f.AffectedId.replace(/_/g, ' ')}
            </td>
            <td className="py-2.5">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-status-critical/15 text-status-critical">
                FAILED
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Stage2Content({
  propagation,
}: {
  propagation: FailureChainStep[]
}) {
  const grouped = new Map<string, FailureChainStep[]>()
  for (const step of propagation) {
    if (!grouped.has(step.SensorId)) grouped.set(step.SensorId, [])
    grouped.get(step.SensorId)!.push(step)
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([sensorId, steps]) => (
        <div key={sensorId}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: SENSOR_COLORS[sensorId] || '#3B82F6' }}
            />
            <span className="text-sm font-medium text-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {sensorId.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-wrap ml-5">
            {steps
              .sort((a, b) => a.Step - b.Step)
              .map((step, idx) => (
                <span key={step.Step} className="flex items-center gap-1">
                  {idx === 0 && (
                    <span className="text-xs text-text-secondary px-1.5 py-0.5 rounded bg-bg-card" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {step.From.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span className="text-text-tertiary text-xs">&rarr;</span>
                  <span className="text-xs text-text-secondary px-1.5 py-0.5 rounded bg-bg-card" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {step.To.replace(/_/g, ' ')}
                  </span>
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Stage3Content({
  hotspots,
  rootCauseIds,
}: {
  hotspots: Hotspot[]
  rootCauseIds: Set<string>
}) {
  const sorted = [...hotspots].sort((a, b) => b.Count - a.Count)
  const maxCount = sorted[0]?.Count ?? 1

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-text-tertiary text-left border-b border-border-subtle">
          <th className="pb-2 pr-4 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Component
          </th>
          <th className="pb-2 pr-4 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Chains
          </th>
          <th className="pb-2 pr-4 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Impact
          </th>
          <th className="pb-2 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Classification
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((h) => {
          const isRoot = rootCauseIds.has(h.ComponentId)
          return (
            <tr
              key={h.ComponentId}
              className={`border-b border-border-subtle/50 transition-colors ${
                isRoot ? 'bg-status-root-cause/5' : 'hover:bg-bg-elevated/50'
              }`}
            >
              <td className="py-2.5 pr-4">
                <span
                  className={`${isRoot ? 'text-status-root-cause' : 'text-text-primary'}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {h.ComponentId.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="py-2.5 pr-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span className={isRoot ? 'text-status-root-cause font-semibold' : 'text-text-secondary'}>
                  {h.Count}
                </span>
                <span className="text-text-tertiary"> / 3</span>
              </td>
              <td className="py-2.5 pr-4 w-32">
                <div className="w-full bg-bg-card rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      isRoot ? 'bg-status-root-cause' : 'bg-accent-blue'
                    }`}
                    style={{ width: `${(h.Count / maxCount) * 100}%` }}
                  />
                </div>
              </td>
              <td className="py-2.5">
                {isRoot ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-status-root-cause/15 text-status-root-cause">
                    ROOT CAUSE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-status-warning/15 text-status-warning">
                    AFFECTED
                  </span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Stage4Content({
  notifications,
}: {
  notifications: Notification[]
}) {
  // Group by team leader
  const grouped = new Map<string, Notification[]>()
  for (const n of notifications) {
    const key = `${n.Name} ${n.Surname}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(n)
  }

  return (
    <div className="space-y-3">
      {Array.from(grouped.entries()).map(([leader, notifs]) => {
        const first = notifs[0]
        return (
          <div
            key={leader}
            className="flex items-start gap-4 p-3 rounded-lg bg-bg-card border border-border-subtle"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-cyan/15 text-accent-cyan shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-text-primary">
                  {leader}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan">
                  {first.Team.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-text-tertiary mb-2">
                Notified as responsible Team Leader for{' '}
                {notifs.length} root cause component{notifs.length > 1 ? 's' : ''}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {notifs.map((n) => (
                  <span
                    key={n.ComponentId}
                    className="text-xs px-2 py-0.5 rounded bg-status-root-cause/10 text-status-root-cause border border-status-root-cause/20"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {n.ComponentId.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
