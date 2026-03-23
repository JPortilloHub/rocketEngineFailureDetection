import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, HelpCircle, Crosshair } from 'lucide-react'
import type { NodeProps } from '@xyflow/react'

function ComponentNodeInner({ data }: NodeProps) {
  const {
    label,
    status,
    isFailed,
    isRootCause,
    hotspotCount,
    selectedStage,
    dimmed,
    isObservable,
  } = data as {
    label: string
    status: string
    team: string
    isObservable: boolean
    isFailed: boolean
    isRootCause: boolean
    hotspotCount: number
    selectedStage: number | null
    dimmed: boolean
    isHighlighted: boolean
  }

  const showHotspot = selectedStage === 3 && hotspotCount > 0

  let borderColor = 'border-border-subtle'
  let glowClass = ''
  let statusIcon = <HelpCircle className="w-3.5 h-3.5 text-status-unknown" />

  if (isFailed) {
    borderColor = 'border-status-critical'
    glowClass = 'shadow-[0_0_15px_rgba(239,68,68,0.4)]'
    statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-status-critical" />
  } else if (isRootCause && (selectedStage === 3 || selectedStage === 4)) {
    borderColor = 'border-status-root-cause'
    glowClass = 'shadow-[0_0_20px_rgba(168,85,247,0.5)]'
    statusIcon = <Crosshair className="w-3.5 h-3.5 text-status-root-cause" />
  } else if (status === 'passed') {
    borderColor = 'border-status-healthy'
    statusIcon = <CheckCircle className="w-3.5 h-3.5 text-status-healthy" />
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-bg-elevated !border-border-subtle !w-2 !h-2"
      />
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.15 }}
        className={`relative px-4 py-2.5 rounded-lg border bg-bg-card transition-all duration-200 ${borderColor} ${glowClass} ${
          dimmed ? 'opacity-25' : 'opacity-100'
        }`}
        style={{ minWidth: 160 }}
      >
        <div className="flex items-center gap-2">
          {statusIcon}
          <span
            className="text-xs font-medium text-text-primary truncate"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {label}
          </span>
        </div>

        {isObservable && (
          <div className="mt-1">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Sensor
            </span>
          </div>
        )}

        {showHotspot && (
          <div className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-status-root-cause text-white text-[10px] font-bold shadow-lg">
            {hotspotCount}
          </div>
        )}

        {isFailed && (
          <div className="absolute inset-0 rounded-lg animate-pulse border border-status-critical/30 pointer-events-none" />
        )}
      </motion.div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-bg-elevated !border-border-subtle !w-2 !h-2"
      />
    </>
  )
}

export const ComponentNode = memo(ComponentNodeInner)
