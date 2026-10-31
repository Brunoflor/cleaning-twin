import type { MovementKind, Quantities } from '@/lib/items'

export type SessionUser = {
  id: string
  email: string
  fullName: string | null
}

export type PropertyRecord = {
  id: string
  name: string
  address: string | null
  notes: string | null
}

export type ClientRecord = {
  id: string
  name: string
  email: string
  phone: string | null
  notes: string | null
  properties: PropertyRecord[]
}

export type ClientOption = {
  id: string
  name: string
}

export type PropertyOption = {
  id: string
  clientId: string
  clientName: string
  name: string
  address: string | null
}

export type MovementRecord = {
  id: string
  propertyId: string
  propertyName: string
  clientId: string
  clientName: string
  kind: MovementKind
  date: string
  notes: string | null
  quantities: Quantities
}

export type Totals = Quantities & { totale: number }

export type StockCount = {
  propertyId: string
  date: string
  notes: string | null
  quantities: Quantities
}

export type StockCard = {
  propertyId: string
  propertyName: string
  clientId: string
  clientName: string
  address: string | null
  count: StockCount | null
}
