import { ITEM_TYPES, totalPieces, type Quantities } from '@/lib/items'
import { formatNumber } from '@/lib/format'

export function StockGrid({ quantities }: { quantities: Quantities }) {
  return (
    <div>
      <p className="mb-2 text-sm text-ink-soft">{formatNumber(totalPieces(quantities))} pezzi in totale</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {ITEM_TYPES.map((item) => (
          <li key={item.key} className="rounded-2xl bg-sand/80 px-3 py-2">
            <p className="text-xs leading-5 text-ink-soft">{item.label}</p>
            <p className="font-serif text-2xl">{formatNumber(quantities[item.key])}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
