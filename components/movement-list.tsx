import Link from 'next/link'
import { formatDate, formatNumber } from '@/lib/format'
import { ITEM_TYPES, KIND_META, totalPieces } from '@/lib/items'
import type { MovementRecord } from '@/lib/types'

export function MovementList({
  movements,
  editable = false,
  hrefBase = '',
  empty = 'Nessun movimento con questi filtri.',
}: {
  movements: MovementRecord[]
  editable?: boolean
  hrefBase?: string
  empty?: string
}) {
  if (movements.length === 0) {
    return <p className="rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-ink-soft">{empty}</p>
  }

  return (
    <ul className="space-y-3">
      {movements.map((movement) => {
        const items =
          movement.kind === 'stock_count'
            ? ITEM_TYPES
            : ITEM_TYPES.filter((item) => movement.quantities[item.key] > 0)
        return (
          <li key={movement.id} className="rounded-3xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm text-ink-soft">{formatDate(movement.date)}</p>
                <p className="mt-1 font-semibold">{KIND_META[movement.kind].label}</p>
                <p className="text-sm text-ink-soft">
                  {movement.clientName} — {movement.propertyName}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone(movement.kind)}`}>
                {formatNumber(totalPieces(movement.quantities))} pezzi
              </span>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              {items.map((item) => (
                <li key={item.key} className="flex items-baseline justify-between gap-2">
                  <span className="text-ink-soft">{item.label}</span>
                  <span className="font-semibold tabular-nums">{formatNumber(movement.quantities[item.key])}</span>
                </li>
              ))}
            </ul>
            {movement.notes ? <p className="mt-3 text-sm leading-6 text-ink-soft">{movement.notes}</p> : null}
            {editable ? (
              <Link
                href={`${hrefBase}/admin/movimenti/${movement.id}`}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-teal"
              >
                Modifica
              </Link>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function tone(kind: MovementRecord['kind']): string {
  if (kind === 'delivery') return 'bg-teal-soft text-teal-dark'
  if (kind === 'pickup') return 'bg-clay-soft text-clay'
  return 'bg-amber-soft text-amber'
}
