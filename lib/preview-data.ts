import { emptyQuantities, ITEM_TYPES, totalPieces, type MovementKind, type Quantities } from '@/lib/items'
import { emptyTotals } from '@/lib/rows'
import type { ClientRecord, MovementRecord, PropertyOption, StockCard, Totals } from '@/lib/types'

const hotel = '10000000-0000-4000-8000-000000000001'
const bb = '10000000-0000-4000-8000-000000000002'
const mare = '20000000-0000-4000-8000-000000000001'
const dipendenze = '20000000-0000-4000-8000-000000000002'
const piano = '20000000-0000-4000-8000-000000000003'

function pieces(partial: Partial<Quantities>): Quantities {
  return { ...emptyQuantities(), ...partial }
}

export const previewClients: ClientRecord[] = [
  {
    id: hotel,
    name: 'Hotel Vesuvio',
    email: 'maria@hotel-vesuvio.example',
    phone: '+39 081 000 0001',
    notes: 'Referente: Maria Esposito',
    properties: [
      { id: mare, name: 'Camere vista mare', address: 'Via Partenope 45, Napoli', notes: null },
      { id: dipendenze, name: 'Dipendenze', address: 'Via Partenope 47, Napoli', notes: null },
    ],
  },
  {
    id: bb,
    name: 'B&B Spaccanapoli',
    email: 'luca@spaccanapoli.example',
    phone: '+39 081 000 0002',
    notes: 'Check-in nel pomeriggio',
    properties: [{ id: piano, name: 'Piano nobile', address: 'Via dei Tribunali 12, Napoli', notes: null }],
  },
]

export const previewProperties: PropertyOption[] = previewClients.flatMap((client) =>
  client.properties.map((property) => ({
    id: property.id,
    clientId: client.id,
    clientName: client.name,
    name: property.name,
    address: property.address,
  })),
)

function movement(
  id: string,
  propertyId: string,
  kind: MovementKind,
  date: string,
  quantities: Partial<Quantities>,
  notes: string | null = null,
): MovementRecord {
  const property = previewProperties.find((item) => item.id === propertyId)
  if (!property) throw new Error(propertyId)
  return {
    id,
    propertyId,
    propertyName: property.name,
    clientId: property.clientId,
    clientName: property.clientName,
    kind,
    date,
    notes,
    quantities: pieces(quantities),
  }
}

export const previewMovements: MovementRecord[] = [
  movement('30000000-0000-4000-8000-000000000004', mare, 'stock_count', '2026-10-31', {
    lenzuolo_matrimoniale: 40,
    lenzuolo_singolo: 16,
    federa: 90,
    telo_doccia: 48,
    telo_viso: 50,
    telo_ospite: 24,
    scendibagno: 22,
  }),
  movement('30000000-0000-4000-8000-000000000008', piano, 'pickup', '2026-10-30', {
    lenzuolo_matrimoniale: 5,
    lenzuolo_singolo: 2,
    federa: 14,
    telo_doccia: 7,
    telo_viso: 8,
    telo_ospite: 4,
    scendibagno: 4,
  }),
  movement(
    '30000000-0000-4000-8000-000000000003',
    mare,
    'pickup',
    '2026-10-29',
    {
      lenzuolo_matrimoniale: 28,
      lenzuolo_singolo: 10,
      federa: 76,
      telo_doccia: 38,
      telo_viso: 36,
      telo_ospite: 18,
      scendibagno: 20,
    },
    'Manca una federa segnalata dal piano',
  ),
  movement('30000000-0000-4000-8000-000000000002', mare, 'delivery', '2026-10-28', {
    lenzuolo_matrimoniale: 30,
    lenzuolo_singolo: 10,
    federa: 80,
    telo_doccia: 40,
    telo_viso: 40,
    telo_ospite: 20,
    scendibagno: 20,
  }),
  movement('30000000-0000-4000-8000-000000000005', dipendenze, 'delivery', '2026-10-28', {
    lenzuolo_matrimoniale: 8,
    lenzuolo_singolo: 4,
    federa: 20,
    telo_doccia: 12,
    telo_viso: 12,
    telo_ospite: 6,
    scendibagno: 6,
  }),
  movement('30000000-0000-4000-8000-000000000007', piano, 'delivery', '2026-10-27', {
    lenzuolo_matrimoniale: 6,
    lenzuolo_singolo: 2,
    federa: 16,
    telo_doccia: 8,
    telo_viso: 8,
    telo_ospite: 4,
    scendibagno: 4,
  }),
  movement(
    '30000000-0000-4000-8000-000000000006',
    dipendenze,
    'stock_count',
    '2026-10-20',
    { telo_doccia: 2, telo_viso: 2, scendibagno: 1 },
    'Struttura quasi vuota',
  ),
  movement(
    '30000000-0000-4000-8000-000000000001',
    mare,
    'stock_count',
    '2026-10-01',
    {
      lenzuolo_matrimoniale: 36,
      lenzuolo_singolo: 14,
      federa: 84,
      telo_doccia: 44,
      telo_viso: 46,
      telo_ospite: 22,
      scendibagno: 20,
    },
    'Conteggio di inizio mese',
  ),
]

export function previewTotals(kind: MovementKind): Totals {
  const totals = emptyTotals()
  for (const movement of previewMovements.filter((item) => item.kind === kind)) {
    for (const item of ITEM_TYPES) totals[item.key] += movement.quantities[item.key]
  }
  totals.totale = totalPieces(totals)
  return totals
}

export const previewStock: StockCard[] = previewProperties.map((property) => {
  const count = previewMovements.find(
    (movement) => movement.propertyId === property.id && movement.kind === 'stock_count',
  )
  return {
    propertyId: property.id,
    propertyName: property.name,
    clientId: property.clientId,
    clientName: property.clientName,
    address: property.address,
    count: count
      ? { propertyId: property.id, date: count.date, notes: count.notes, quantities: count.quantities }
      : null,
  }
})

export const previewHotel = previewClients[0]
