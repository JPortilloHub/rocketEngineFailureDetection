import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import type {
  Component,
  ComponentLink,
  DirectFailure,
  FailureChainStep,
  Hotspot,
} from '../types'

const NODE_WIDTH = 200
const NODE_HEIGHT = 60
const HORIZONTAL_GAP = 60
const VERTICAL_GAP = 100

const SENSOR_COLORS: Record<string, string> = {
  Temp_Sensor_A: '#EF4444',
  Temp_Sensor_B: '#F59E0B',
  Temp_Sensor_C: '#06B6D4',
}

export interface GraphNodeData {
  label: string
  status: string
  team: string
  isObservable: boolean
  isFailed: boolean
  isRootCause: boolean
  hotspotCount: number
  searchMatch: boolean
  [key: string]: unknown
}

export function useGraphLayout(
  components: Component[],
  links: ComponentLink[],
  failedSensors: DirectFailure[],
  propagation: FailureChainStep[],
  hotspots: Hotspot[],
  rootCauses: Hotspot[],
  selectedStage: number | null,
  selectedSensor: string | null,
  searchQuery: string
) {
  return useMemo(() => {
    if (components.length === 0 || links.length === 0) {
      return { nodes: [] as Node[], edges: [] as Edge[] }
    }

    const failedIds = new Set(failedSensors.map((f) => f.SensorId))
    const rootCauseIds = new Set(rootCauses.map((r) => r.ComponentId))
    const hotspotMap = new Map(hotspots.map((h) => [h.ComponentId, h.Count]))

    // --- Single-chain focus: compute which nodes/edges belong to selected sensor ---
    const sensorChainNodes = new Set<string>()
    const sensorChainEdges = new Set<string>()
    if (selectedSensor && selectedStage === 2) {
      for (const step of propagation) {
        if (step.SensorId === selectedSensor) {
          sensorChainNodes.add(step.From)
          sensorChainNodes.add(step.To)
          sensorChainEdges.add(`${step.To}->${step.From}`)
        }
      }
      // Also add the sensor node itself
      sensorChainNodes.add(selectedSensor)
    }
    const isSensorFocused = selectedSensor !== null && selectedStage === 2

    // --- Search matching ---
    const normalizedSearch = searchQuery.toLowerCase().trim()
    const hasSearch = normalizedSearch.length > 0
    const searchMatchIds = new Set<string>()
    if (hasSearch) {
      for (const comp of components) {
        const name = comp.ComponentID.toLowerCase().replace(/_/g, ' ')
        const id = comp.ComponentID.toLowerCase()
        if (name.includes(normalizedSearch) || id.includes(normalizedSearch)) {
          searchMatchIds.add(comp.ComponentID)
        }
      }
    }

    // Build adjacency: parent -> children
    const childrenOf = new Map<string, string[]>()
    const parentOf = new Map<string, string[]>()
    for (const link of links) {
      if (!childrenOf.has(link.Parent)) childrenOf.set(link.Parent, [])
      childrenOf.get(link.Parent)!.push(link.Component)
      if (!parentOf.has(link.Component)) parentOf.set(link.Component, [])
      parentOf.get(link.Component)!.push(link.Parent)
    }

    // Find all component IDs
    const allIds = new Set(components.map((c) => c.ComponentID))

    // Find roots (no parents)
    const roots: string[] = []
    for (const id of allIds) {
      if (!parentOf.has(id)) {
        roots.push(id)
      }
    }

    // BFS to assign layers (depth from root)
    const layerMap = new Map<string, number>()
    const queue: { id: string; depth: number }[] = roots.map((id) => ({
      id,
      depth: 0,
    }))
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (visited.has(id)) {
        if (depth < (layerMap.get(id) ?? Infinity)) {
          layerMap.set(id, depth)
        }
        continue
      }
      visited.add(id)
      layerMap.set(id, depth)

      const children = childrenOf.get(id) || []
      for (const child of children) {
        if (!visited.has(child)) {
          queue.push({ id: child, depth: depth + 1 })
        }
      }
    }

    // For any components not reached by BFS, assign a default layer
    for (const comp of components) {
      if (!layerMap.has(comp.ComponentID)) {
        layerMap.set(comp.ComponentID, 5)
      }
    }

    // Group by layer
    const layers = new Map<number, string[]>()
    for (const [id, layer] of layerMap) {
      if (!layers.has(layer)) layers.set(layer, [])
      layers.get(layer)!.push(id)
    }

    // Sort layers and position nodes
    const sortedLayers = Array.from(layers.keys()).sort((a, b) => a - b)
    const maxLayerWidth = Math.max(
      ...sortedLayers.map((l) => layers.get(l)!.length)
    )
    const totalWidth = maxLayerWidth * (NODE_WIDTH + HORIZONTAL_GAP)

    const compMap = new Map(components.map((c) => [c.ComponentID, c]))

    // Determine which edges are in the active propagation chains
    const activePropEdges = new Set<string>()
    const activeNodes = new Set<string>()
    if (selectedStage === 1) {
      for (const f of failedSensors) {
        activeNodes.add(f.SensorId)
        activeNodes.add(f.AffectedId)
        activePropEdges.add(`${f.AffectedId}->${f.SensorId}`)
      }
    } else if (selectedStage === 2) {
      for (const step of propagation) {
        // If sensor focused, only add that sensor's chain
        if (isSensorFocused && step.SensorId !== selectedSensor) continue
        activeNodes.add(step.From)
        activeNodes.add(step.To)
        activePropEdges.add(`${step.To}->${step.From}`)
      }
    } else if (selectedStage === 3) {
      for (const h of hotspots) {
        activeNodes.add(h.ComponentId)
      }
    } else if (selectedStage === 4) {
      for (const rc of rootCauses) {
        activeNodes.add(rc.ComponentId)
      }
    }

    // Build propagation sensor mapping for edge coloring
    const edgeSensorMap = new Map<string, string>()
    for (const step of propagation) {
      const edgeKey = `${step.To}->${step.From}`
      edgeSensorMap.set(edgeKey, step.SensorId)
    }

    // Create React Flow nodes
    const nodes: Node[] = []
    for (const layerIdx of sortedLayers) {
      const layerNodes = layers.get(layerIdx)!
      const layerWidth = layerNodes.length * (NODE_WIDTH + HORIZONTAL_GAP)
      const startX = (totalWidth - layerWidth) / 2

      for (let i = 0; i < layerNodes.length; i++) {
        const id = layerNodes[i]
        const comp = compMap.get(id)
        if (!comp) continue

        // In sensor focus mode, hide nodes not in the chain
        if (isSensorFocused && !sensorChainNodes.has(id)) {
          continue
        }

        const isFailed = failedIds.has(id)
        const isRoot = rootCauseIds.has(id)
        const hCount = hotspotMap.get(id) ?? 0
        const isSearchMatch = hasSearch && searchMatchIds.has(id)

        let dimmed = false
        if (hasSearch) {
          dimmed = !searchMatchIds.has(id)
        } else if (selectedStage !== null) {
          dimmed = !activeNodes.has(id)
        }

        nodes.push({
          id,
          type: 'componentNode',
          position: {
            x: startX + i * (NODE_WIDTH + HORIZONTAL_GAP),
            y: layerIdx * (NODE_HEIGHT + VERTICAL_GAP),
          },
          data: {
            label: id.replace(/_/g, ' '),
            status: comp.Status,
            team: comp.Team,
            isObservable: comp.IsObservable === 'yes',
            isFailed,
            isRootCause: isRoot,
            hotspotCount: hCount,
            selectedStage,
            dimmed,
            isHighlighted: !dimmed,
            searchMatch: isSearchMatch,
          } satisfies GraphNodeData,
        })
      }
    }

    // Create React Flow edges
    const edges: Edge[] = []
    for (const link of links) {
      const edgeKey = `${link.Parent}->${link.Component}`

      // In sensor focus mode, hide edges not in the chain
      if (isSensorFocused && !sensorChainEdges.has(edgeKey)) {
        continue
      }

      const isActive = activePropEdges.has(edgeKey)
      const sensorId = edgeSensorMap.get(edgeKey)
      const sensorColor = sensorId ? SENSOR_COLORS[sensorId] : undefined

      edges.push({
        id: edgeKey,
        source: link.Parent,
        target: link.Component,
        type: 'animatedEdge',
        data: {
          isActive: selectedStage === 2 ? isActive : false,
          isStage1Active: selectedStage === 1 ? activePropEdges.has(edgeKey) : false,
          sensorColor: sensorColor || '#3B82F6',
          dimmed:
            hasSearch
              ? true
              : selectedStage !== null &&
                !activePropEdges.has(edgeKey) &&
                (selectedStage === 1 || selectedStage === 2),
        },
      })
    }

    return { nodes, edges }
  }, [
    components,
    links,
    failedSensors,
    propagation,
    hotspots,
    rootCauses,
    selectedStage,
    selectedSensor,
    searchQuery,
  ])
}
