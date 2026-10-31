import { emptyQuantities, isMovementKind, ITEM_TYPES, type Quantities } from '@/lib/items'
import type { MovementRecord, PropertyRecord, StockCount, Totals } from '@/lib/types'

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Risposta incompleta dal database')
  }
  return value as Record<string, unknown>
}

function embedded(value: unknown): Record<string, unknown> {
  return asRecord(Array.isArray(value) ? value[0] : value)
}

function requiredString(row: Record<string, unknown>, key: string): string {
  const value = row[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Risposta incompleta dal database')
  }
  return value
}

function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function quantitiesOf(row: Record<string, unknown>): Quantities {
  const quantities = emptyQuantities()
  for (const item of ITEM_TYPES) {
    const value = row[item.key]
    const quantity = typeof value === 'number' ? value : Number(value)
    quantities[item.key] = Number.isFinite(quantity) ? quantity : 0
  }
  return quantities
}

export function emptyTotals(): Totals {
  return { ...emptyQuantities(), totale: 0 }
}

export function parseTotals(value: unknown): Totals {
  const row = asRecord(Array.isArray(value) ? value[0] : value)
  const quantities = quantitiesOf(row)
  const totale = Number(row.totale)
  return { ...quantities, totale: Number.isFinite(totale) ? totale : 0 }
}

export function parseMovement(value: unknown): MovementRecord {
  const row = asRecord(value)
  const property = embedded(row.properties)
  const client = embedded(property.clients)
  const kind = String(row.kind)
  if (!isMovementKind(kind)) throw new Error('Tipo movimento sconosciuto')
  return {
    id: requiredString(row, 'id'),
    propertyId: requiredString(row, 'property_id'),
    propertyName: requiredString(property, 'name'),
    clientId: requiredString(property, 'client_id'),
    clientName: requiredString(client, 'name'),
    kind,
    date: String(row.movement_date).slice(0, 10),
    notes: optionalText(row.notes),
    quantities: quantitiesOf(row),
  }
}

export function parseStockCount(value: unknown): StockCount {
  const row = asRecord(value)
  return {
    propertyId: requiredString(row, 'property_id'),
    date: String(row.movement_date).slice(0, 10),
    notes: optionalText(row.notes),
    quantities: quantitiesOf(row),
  }
}

export function parseProperty(value: unknown): PropertyRecord {
  const row = asRecord(value)
  return {
    id: requiredString(row, 'id'),
    name: requiredString(row, 'name'),
    address: optionalText(row.address),
    notes: optionalText(row.notes),
  }
}
