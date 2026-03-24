import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Node, Edge, ReactFlowInstance } from '@xyflow/react'
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Crosshair,
  AlertTriangle,
} from 'lucide-react'
import { ComponentNode } from './ComponentNode'
import { AnimatedEdge } from './AnimatedEdge'

interface ComponentGraphProps {
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (componentId: string) => void
  onInit: (instance: ReactFlowInstance) => void
  rootCauseIds: string[]
  failedSensorIds: string[]
}

const btnClass =
  'flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 text-xs text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all duration-200'
const monoFont = { fontFamily: "'JetBrains Mono', monospace" }

function ControlPanel({
  rootCauseIds,
  failedSensorIds,
}: {
  rootCauseIds: string[]
  failedSensorIds: string[]
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <Panel
      position="bottom-left"
      className="!m-3"
    >
      <div className="bg-bg-card border border-border-subtle rounded-lg shadow-lg overflow-hidden flex flex-col divide-y divide-border-subtle">
        <button
          onClick={() => zoomIn({ duration: 200 })}
          className={btnClass}
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span style={monoFont}>Zoom In</span>
        </button>
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className={btnClass}
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
          <span style={monoFont}>Zoom Out</span>
        </button>
        <button
          onClick={() => fitView({ padding: 0.2, duration: 400 })}
          className={btnClass}
          title="Fit all nodes in view"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span style={monoFont}>Fit All</span>
        </button>
        <button
          onClick={() => {
            if (rootCauseIds.length === 0) return
            fitView({
              nodes: rootCauseIds.map((id) => ({ id })),
              padding: 0.5,
              duration: 400,
            })
          }}
          className={`${btnClass} hover:!text-status-root-cause`}
          title="Focus on root cause components"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span style={monoFont}>Root Causes</span>
        </button>
        <button
          onClick={() => {
            if (failedSensorIds.length === 0) return
            fitView({
              nodes: failedSensorIds.map((id) => ({ id })),
              padding: 0.5,
              duration: 400,
            })
          }}
          className={`${btnClass} hover:!text-status-critical`}
          title="Focus on failed sensors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span style={monoFont}>Failed Sensors</span>
        </button>
      </div>
    </Panel>
  )
}

export function ComponentGraph({
  nodes,
  edges,
  onNodeClick,
  onInit,
  rootCauseIds,
  failedSensorIds,
}: ComponentGraphProps) {
  const nodeTypes = useMemo(
    () => ({
      componentNode: ComponentNode,
    }),
    []
  )

  const edgeTypes = useMemo(
    () => ({
      animatedEdge: AnimatedEdge,
    }),
    []
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node.id)
    },
    [onNodeClick]
  )

  const minimapNodeColor = useCallback((node: Node) => {
    const data = node.data as Record<string, unknown>
    if (data.isFailed) return '#EF4444'
    if (data.isRootCause) return '#A855F7'
    if (data.status === 'passed') return '#10B981'
    return '#94A3B8'
  }, [])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'animatedEdge',
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1E293B"
        />
        <ControlPanel
          rootCauseIds={rootCauseIds}
          failedSensorIds={failedSensorIds}
        />
        <MiniMap
          nodeColor={minimapNodeColor}
          nodeStrokeColor={() => '#1E293B'}
          nodeStrokeWidth={1}
          maskColor="rgba(10, 14, 26, 0.8)"
          className="!bg-bg-card !border-border-subtle !rounded-lg"
          style={{ width: 180, height: 120 }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}
