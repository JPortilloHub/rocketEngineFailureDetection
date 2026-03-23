import { memo } from 'react'
import { BaseEdge, getStraightPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'

function AnimatedEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const isActive = (data?.isActive as boolean) || false
  const isStage1Active = (data?.isStage1Active as boolean) || false
  const sensorColor = (data?.sensorColor as string) || '#3B82F6'
  const dimmed = (data?.dimmed as boolean) || false

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  const active = isActive || isStage1Active

  if (active) {
    return (
      <>
        <BaseEdge
          id={`${id}-bg`}
          path={edgePath}
          style={{
            stroke: sensorColor,
            strokeWidth: 2.5,
            opacity: 0.3,
          }}
        />
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            stroke: sensorColor,
            strokeWidth: 2,
            strokeDasharray: '6 4',
            animation: 'dashFlow 1s linear infinite',
          }}
        />
      </>
    )
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: dimmed ? '#1E293B' : '#334155',
        strokeWidth: dimmed ? 0.5 : 1,
        opacity: dimmed ? 0.3 : 0.6,
      }}
    />
  )
}

export const AnimatedEdge = memo(AnimatedEdgeInner)
