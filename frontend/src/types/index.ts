export interface Component {
  ComponentID: string
  SymptomCode: string
  IsObservable: string
  Status: string
  RelatedSymptom: string
  Team: string
}

export interface ComponentLink {
  Parent: string
  Component: string
}

export interface Employee {
  Name: string
  Surname: string
  Role: string
  Team: string
}

export interface DirectFailure {
  SensorId: string
  AffectedId: string
}

export interface FailureChainStep {
  SensorId: string
  From: string
  To: string
  Step: number
}

export interface Hotspot {
  ComponentId: string
  Count: number
}

export interface Notification {
  ComponentId: string
  Name: string
  Surname: string
  Team: string
}

export interface ApiResponse<T> {
  data: T[]
}
