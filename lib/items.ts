export const ITEM_TYPES = [
  { key: 'lenzuolo_matrimoniale', label: 'Lenzuolo matrimoniale' },
  { key: 'lenzuolo_singolo', label: 'Lenzuolo singolo' },
  { key: 'federa', label: 'Federa' },
  { key: 'telo_doccia', label: 'Telo doccia' },
  { key: 'telo_viso', label: 'Telo viso' },
  { key: 'telo_ospite', label: 'Telo ospite' },
  { key: 'scendibagno', label: 'Scendibagno' },
] as const

export type ItemKey = (typeof ITEM_TYPES)[number]['key']

export type Quantities = Record<ItemKey, number>

export const EMPTY_QUANTITIES: Quantities = {
  lenzuolo_matrimoniale: 0,
  lenzuolo_singolo: 0,
  federa: 0,
  telo_doccia: 0,
  telo_viso: 0,
  telo_ospite: 0,
  scendibagno: 0,
}

export const MOVEMENT_KINDS = ['delivery', 'pickup', 'stock_count'] as const

export type MovementKind = (typeof MOVEMENT_KINDS)[number]

export const KIND_META: Record<
  MovementKind,
  { label: string; short: string; query: string; description: string }
> = {
  delivery: {
    label: 'Consegna pulito',
    short: 'Consegna',
    query: 'consegna',
    description: 'Biancheria pulita portata in struttura',
  },
  pickup: {
    label: 'Ritiro sporco',
    short: 'Ritiro',
    query: 'ritiro',
    description: 'Biancheria sporca ritirata dalla struttura',
  },
  stock_count: {
    label: 'Giacenza cliente',
    short: 'Giacenza',
    query: 'giacenza',
    description: 'Conteggio manuale della biancheria in struttura',
  },
}

export function emptyQuantities(): Quantities {
  return { ...EMPTY_QUANTITIES }
}

export function totalPieces(quantities: Quantities): number {
  return ITEM_TYPES.reduce((sum, item) => sum + quantities[item.key], 0)
}

export function isMovementKind(value: string | undefined): value is MovementKind {
  return MOVEMENT_KINDS.some((kind) => kind === value)
}

export function kindFromQuery(value: string | undefined): MovementKind | undefined {
  return MOVEMENT_KINDS.find((kind) => KIND_META[kind].query === value)
}

export function kindToQuery(kind: MovementKind): string {
  return KIND_META[kind].query
}
