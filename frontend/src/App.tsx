import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { BottomPanel } from './components/layout/BottomPanel'
import { ComponentGraph } from './components/graph/ComponentGraph'
import { useDigitalTwin } from './hooks/useDigitalTwin'
import { useGraphLayout } from './hooks/useGraphLayout'

function App() {
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [_selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  )

  const data = useDigitalTwin()

  const { nodes, edges } = useGraphLayout(
    data.components,
    data.links,
    data.failedSensors,
    data.propagation,
    data.hotspots,
    data.rootCauses,
    selectedStage
  )

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
          onSelectStage={setSelectedStage}
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
