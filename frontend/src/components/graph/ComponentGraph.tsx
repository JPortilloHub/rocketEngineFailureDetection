import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Node, Edge, ReactFlowInstance } from '@xyflow/react'
import { Maximize, Crosshair, AlertTriangle } from 'lucide-react'
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

function QuickNavButtons({
  rootCauseIds,
  failedSensorIds,
}: {
  rootCauseIds: string[]
  failedSensorIds: string[]
}) {
  const { fitView } = useReactFlow()

  const handleFitAll = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 })
  }, [fitView])

  const handleFocusRootCauses = useCallback(() => {
    if (rootCauseIds.length === 0) return
    fitView({
      nodes: rootCauseIds.map((id) => ({ id })),
      padding: 0.5,
      duration: 400,
    })
  }, [fitView, rootCauseIds])

  const handleFocusFailedSensors = useCallback(() => {
    if (failedSensorIds.length === 0) return
    fitView({
      nodes: failedSensorIds.map((id) => ({ id })),
      padding: 0.5,
      duration: 400,
    })
  }, [fitView, failedSensorIds])

  return (
    <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
      <button
        onClick={handleFitAll}
        className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border-subtle rounded-lg text-xs text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all duration-200 shadow-lg"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
        title="Fit all nodes"
      >
        <Maximize className="w-3 h-3" />
        Fit All
      </button>
      <button
        onClick={handleFocusRootCauses}
        className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border-subtle rounded-lg text-xs text-text-secondary hover:bg-bg-elevated hover:text-status-root-cause transition-all duration-200 shadow-lg"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
        title="Focus on root cause components"
      >
        <Crosshair className="w-3 h-3" />
        Root Causes
      </button>
      <button
        onClick={handleFocusFailedSensors}
        className="flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border-subtle rounded-lg text-xs text-text-secondary hover:bg-bg-elevated hover:text-status-critical transition-all duration-200 shadow-lg"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
        title="Focus on failed sensors"
      >
        <AlertTriangle className="w-3 h-3" />
        Failed Sensors
      </button>
    </div>
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
    return '#6B7280'
  }, [])

  return (
    <div className="w-full h-full relative">
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
        <Controls
          className="!bg-bg-card !border-border-subtle !rounded-lg !shadow-lg [&>button]:!bg-bg-card [&>button]:!border-border-subtle [&>button]:!text-text-secondary [&>button:hover]:!bg-bg-elevated"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(10, 14, 26, 0.8)"
          className="!bg-bg-card !border-border-subtle !rounded-lg"
          pannable
          zoomable
        />
        <QuickNavButtons
          rootCauseIds={rootCauseIds}
          failedSensorIds={failedSensorIds}
        />
      </ReactFlow>
    </div>
  )
}
