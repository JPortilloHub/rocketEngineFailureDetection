import { useState, useEffect } from 'react'
import { fetchJson } from '../lib/api'
import type {
  Component,
  ComponentLink,
  Employee,
  DirectFailure,
  FailureChainStep,
  Hotspot,
  Notification,
  ApiResponse,
} from '../types'

export interface DigitalTwinData {
  components: Component[]
  links: ComponentLink[]
  employees: Employee[]
  failedSensors: DirectFailure[]
  propagation: FailureChainStep[]
  hotspots: Hotspot[]
  rootCauses: Hotspot[]
  notifications: Notification[]
  loading: boolean
  error: string | null
}

export function useDigitalTwin(): DigitalTwinData {
  const [components, setComponents] = useState<Component[]>([])
  const [links, setLinks] = useState<ComponentLink[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [failedSensors, setFailedSensors] = useState<DirectFailure[]>([])
  const [propagation, setPropagation] = useState<FailureChainStep[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [rootCauses, setRootCauses] = useState<Hotspot[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true)
        setError(null)

        const [
          compRes,
          linksRes,
          empRes,
          failedRes,
          propRes,
          hotRes,
          rootRes,
          notifRes,
        ] = await Promise.all([
          fetchJson<ApiResponse<Component>>('/digital-twin/components'),
          fetchJson<ApiResponse<ComponentLink>>('/digital-twin/links'),
          fetchJson<ApiResponse<Employee>>('/digital-twin/employees'),
          fetchJson<ApiResponse<DirectFailure>>('/digital-twin/failed-sensors'),
          fetchJson<ApiResponse<FailureChainStep>>('/digital-twin/propagation'),
          fetchJson<ApiResponse<Hotspot>>('/digital-twin/hotspots'),
          fetchJson<ApiResponse<Hotspot>>('/digital-twin/root-cause'),
          fetchJson<ApiResponse<Notification>>('/digital-twin/notifications'),
        ])

        setComponents(compRes.data)
        setLinks(linksRes.data)
        setEmployees(empRes.data)
        setFailedSensors(failedRes.data)
        setPropagation(propRes.data)
        setHotspots(hotRes.data)
        setRootCauses(rootRes.data)
        setNotifications(notifRes.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  return {
    components,
    links,
    employees,
    failedSensors,
    propagation,
    hotspots,
    rootCauses,
    notifications,
    loading,
    error,
  }
}
