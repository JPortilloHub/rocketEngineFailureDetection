import { useState, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { type ReactFlowInstance } from '@xyflow/react'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { BottomPanel } from './components/layout/BottomPanel'
import { ComponentGraph } from './components/graph/ComponentGraph'
import { useDigitalTwin } from './hooks/useDigitalTwin'
import { useGraphLayout } from './hooks/useGraphLayout'

function App() {
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [_selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  const data = useDigitalTwin()

  const { nodes, edges } = useGraphLayout(
    data.components,
    data.links,
    data.failedSensors,
    data.propagation,
    data.hotspots,
    data.rootCauses,
    selectedStage,
    selectedSensor,
    searchQuery
  )

  const handleStageSelect = useCallback((stage: number | null) => {
    setSelectedStage(stage)
    // Clear sensor focus when leaving Stage 2
    if (stage !== 2) {
      setSelectedSensor(null)
    }
  }, [])

  const handleSensorSelect = useCallback((sensorId: string | null) => {
    setSelectedSensor(sensorId)
    // Auto-fit after sensor selection
    setTimeout(() => {
      reactFlowInstance.current?.fitView({ padding: 0.3, duration: 400 })
    }, 50)
  }, [])

  // Compute which nodes belong to the currently focused sensor chain
  const sensorChainNodeIds = useMemo(() => {
    if (!selectedSensor || selectedStage !== 2) return new Set<string>()
    const ids = new Set<string>()
    ids.add(selectedSensor)
    for (const step of data.propagation) {
      if (step.SensorId === selectedSensor) {
        ids.add(step.From)
        ids.add(step.To)
      }
    }
    return ids
  }, [selectedSensor, selectedStage, data.propagation])

  const handleSearchFocus = useCallback((componentId: string) => {
    setSearchQuery('')
    // Only clear sensor focus if the component is NOT in the active chain
    if (selectedSensor && !sensorChainNodeIds.has(componentId)) {
      setSelectedSensor(null)
    }
    // Delay fitView until after React re-renders with the node visible
    setTimeout(() => {
      reactFlowInstance.current?.fitView({
        nodes: [{ id: componentId }],
        padding: 1.5,
        duration: 500,
      })
    }, 100)
  }, [selectedSensor, sensorChainNodeIds])

  const handleReactFlowInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance
  }, [])

  if (data.loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
          <p
            className="text-text-secondary text-sm"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Initializing Digital Twin...
          </p>
        </motion.div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-status-critical text-lg font-medium mb-2">
            Connection Error
          </p>
          <p className="text-text-secondary text-sm max-w-md">
            {data.error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary text-text-primary overflow-hidden">
      <Header
        failureCount={data.failedSensors.length}
        rootCauseCount={data.rootCauses.length}
        notificationCount={data.notifications.length}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedStage={selectedStage}
          onSelectStage={handleStageSelect}
          selectedSensor={selectedSensor}
          onSelectSensor={handleSensorSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchFocus={handleSearchFocus}
          components={data.components}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <motion.div
            className="flex-1 min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <ComponentGraph
              nodes={nodes}
              edges={edges}
              onNodeClick={setSelectedComponent}
              onInit={handleReactFlowInit}
              rootCauseIds={data.rootCauses.map((r) => r.ComponentId)}
              failedSensorIds={data.failedSensors.map((f) => f.SensorId)}
            />
          </motion.div>

          <BottomPanel
            selectedStage={selectedStage}
            failedSensors={data.failedSensors}
            propagation={data.propagation}
            hotspots={data.hotspots}
            rootCauses={data.rootCauses}
            notifications={data.notifications}
          />
        </div>
      </div>
    </div>
  )
}

export default App
