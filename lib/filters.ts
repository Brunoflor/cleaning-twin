import { kindFromQuery, kindToQuery, type MovementKind } from '@/lib/items'
import { isUuid, parseISODate } from '@/lib/validation'

export type Filters = {
  clientId?: string
  propertyId?: string
  from?: string
  to?: string
  kind?: MovementKind
}

type SearchInput = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function parseFilters(input: SearchInput): Filters {
  const clientId = first(input.cliente)
  const propertyId = first(input.struttura)
  const from = first(input.dal)
  const to = first(input.al)
  const kind = kindFromQuery(first(input.tipo))
  return {
    clientId: clientId && isUuid(clientId) ? clientId : undefined,
    propertyId: propertyId && isUuid(propertyId) ? propertyId : undefined,
    from: from && parseISODate(from) ? from : undefined,
    to: to && parseISODate(to) ? to : undefined,
    kind,
  }
}

export function rangeIsBackwards(filters: Filters): boolean {
  return Boolean(filters.from && filters.to && filters.from > filters.to)
}

export function reconcileFilters(
  filters: Filters,
  properties: { id: string; clientId: string }[],
): Filters {
  if (!filters.propertyId) return filters
  const property = properties.find((item) => item.id === filters.propertyId)
  if (!property) return { ...filters, propertyId: undefined }
  if (filters.clientId && property.clientId !== filters.clientId) {
    return { ...filters, propertyId: undefined }
  }
  return filters
}

export function filtersToQuery(pathname: string, filters: Filters): string {
  const params = new URLSearchParams()
  if (filters.clientId) params.set('cliente', filters.clientId)
  if (filters.propertyId) params.set('struttura', filters.propertyId)
  if (filters.from) params.set('dal', filters.from)
  if (filters.to) params.set('al', filters.to)
  if (filters.kind) params.set('tipo', kindToQuery(filters.kind))
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
