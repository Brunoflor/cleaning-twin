import type { SupabaseClient } from '@supabase/supabase-js'
import type { Filters } from '@/lib/filters'
import type { MovementKind } from '@/lib/items'
import {
  asArray,
  asRecord,
  emptyTotals,
  parseMovement,
  parseProperty,
  parseStockCount,
  parseTotals,
} from '@/lib/rows'
import type {
  ClientOption,
  ClientRecord,
  MovementRecord,
  PropertyOption,
  StockCard,
  StockCount,
  Totals,
} from '@/lib/types'

const MOVEMENT_COLUMNS = `
  id, property_id, kind, movement_date, notes,
  lenzuolo_matrimoniale, lenzuolo_singolo, federa,
  telo_doccia, telo_viso, telo_ospite, scendibagno,
  properties!inner ( id, name, client_id, clients!inner ( id, name ) )
`

function fail(error: { message: string }): never {
  console.error(error)
  throw new Error('Non riesco a leggere i dati.')
}

export async function loadClientOptions(supabase: SupabaseClient): Promise<ClientOption[]> {
  const { data, error } = await supabase.from('clients').select('id, name').order('name')
  if (error) fail(error)
  return asArray(data).map((item) => {
    const row = asRecord(item)
    return { id: String(row.id), name: String(row.name) }
  })
}

export async function loadPropertyOptions(supabase: SupabaseClient): Promise<PropertyOption[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, address, client_id, clients!inner(name)')
    .order('name')
  if (error) fail(error)
  return asArray(data)
    .map((item) => {
      const row = asRecord(item)
      const client = asRecord(Array.isArray(row.clients) ? row.clients[0] : row.clients)
      return {
        id: String(row.id),
        clientId: String(row.client_id),
        clientName: String(client.name),
        name: String(row.name),
        address: typeof row.address === 'string' ? row.address : null,
      }
    })
    .sort((a, b) => a.clientName.localeCompare(b.clientName, 'it') || a.name.localeCompare(b.name, 'it'))
}

export async function loadClients(supabase: SupabaseClient): Promise<ClientRecord[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, phone, notes, properties(id, name, address, notes)')
    .order('name')
  if (error) fail(error)
  return asArray(data).map(parseClient)
}

export async function loadClient(supabase: SupabaseClient, id: string): Promise<ClientRecord | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, phone, notes, properties(id, name, address, notes)')
    .eq('id', id)
    .maybeSingle()
  if (error) fail(error)
  if (!data) return null
  return parseClient(data)
}

export async function loadClientByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<ClientRecord | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, phone, notes, properties(id, name, address, notes)')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (error) fail(error)
  if (!data) return null
  return parseClient(data)
}

function parseClient(value: unknown): ClientRecord {
  const row = asRecord(value)
  const properties = asArray(row.properties)
    .map(parseProperty)
    .sort((a, b) => a.name.localeCompare(b.name, 'it'))
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: typeof row.phone === 'string' ? row.phone : null,
    notes: typeof row.notes === 'string' ? row.notes : null,
    properties,
  }
}

export async function loadMovements(
  supabase: SupabaseClient,
  filters: Filters,
  limit = 201,
): Promise<{ rows: MovementRecord[]; truncated: boolean }> {
  let query = supabase
    .from('movements')
    .select(MOVEMENT_COLUMNS)
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.kind) query = query.eq('kind', filters.kind)
  if (filters.propertyId) query = query.eq('property_id', filters.propertyId)
  if (filters.clientId) query = query.eq('properties.client_id', filters.clientId)
  if (filters.from) query = query.gte('movement_date', filters.from)
  if (filters.to) query = query.lte('movement_date', filters.to)

  const { data, error } = await query
  if (error) fail(error)
  const rows = asArray(data).map(parseMovement)
  return { rows: rows.slice(0, Math.max(limit - 1, 0)), truncated: rows.length >= limit }
}

export async function loadMovement(
  supabase: SupabaseClient,
  id: string,
): Promise<MovementRecord | null> {
  const { data, error } = await supabase
    .from('movements')
    .select(MOVEMENT_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) fail(error)
  if (!data) return null
  return parseMovement(data)
}

export async function loadTotals(
  supabase: SupabaseClient,
  kind: MovementKind,
  filters: Filters,
): Promise<Totals> {
  const { data, error } = await supabase.rpc('movement_totals', {
    p_kind: kind,
    p_client_id: filters.clientId ?? null,
    p_property_id: filters.propertyId ?? null,
    p_from: filters.from ?? null,
    p_to: filters.to ?? null,
  })
  if (error) fail(error)
  if (!data || (Array.isArray(data) && data.length === 0)) return emptyTotals()
  return parseTotals(data)
}

export async function loadLatestStock(
  supabase: SupabaseClient,
  args: { clientId?: string; propertyId?: string; asOf?: string },
): Promise<StockCount[]> {
  const { data, error } = await supabase.rpc('latest_stock_as_of', {
    p_client_id: args.clientId ?? null,
    p_property_id: args.propertyId ?? null,
    p_as_of: args.asOf ?? null,
  })
  if (error) fail(error)
  return asArray(data).map(parseStockCount)
}

export function stockCards(
  properties: PropertyOption[],
  counts: StockCount[],
  filters: Pick<Filters, 'clientId' | 'propertyId'>,
): StockCard[] {
  return properties
    .filter((property) => !filters.clientId || property.clientId === filters.clientId)
    .filter((property) => !filters.propertyId || property.id === filters.propertyId)
    .map((property) => ({
      propertyId: property.id,
      propertyName: property.name,
      clientId: property.clientId,
      clientName: property.clientName,
      address: property.address,
      count: counts.find((count) => count.propertyId === property.id) ?? null,
    }))
}
