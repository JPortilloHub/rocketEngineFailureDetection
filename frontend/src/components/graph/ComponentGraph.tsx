import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Node, Edge } from '@xyflow/react'
import { ComponentNode } from './ComponentNode'
import { AnimatedEdge } from './AnimatedEdge'

interface ComponentGraphProps {
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (componentId: string) => void
}

export function ComponentGraph({
  nodes,
  edges,
  onNodeClick,
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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
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
      </ReactFlow>
    </div>
  )
}
