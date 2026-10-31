import { formatNumber } from '@/lib/format'
import { ITEM_TYPES } from '@/lib/items'
import type { Totals } from '@/lib/types'

export function TotalsPanel({ delivery, pickup }: { delivery: Totals; pickup: Totals }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-line px-4 py-3 text-xs font-semibold tracking-wide text-ink-soft uppercase">
        <span>Capo</span>
        <span className="text-right">Consegnato</span>
        <span className="text-right">Ritirato</span>
      </div>
      {ITEM_TYPES.map((item) => (
        <div key={item.key} className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-line/70 px-4 py-2.5 text-sm">
          <span>{item.label}</span>
          <span className="text-right font-semibold tabular-nums">{formatNumber(delivery[item.key])}</span>
          <span className="text-right font-semibold tabular-nums">{formatNumber(pickup[item.key])}</span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-3 text-sm font-semibold">
        <span>Totale pezzi</span>
        <span className="text-right tabular-nums">{formatNumber(delivery.totale)}</span>
        <span className="text-right tabular-nums">{formatNumber(pickup.totale)}</span>
      </div>
    </div>
  )
}
