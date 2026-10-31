import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FilterForm } from '@/components/filter-form'
import { MovementList } from '@/components/movement-list'
import { StockGrid } from '@/components/stock-grid'
import { TotalsPanel } from '@/components/totals-panel'
import { buttonClass, Card, Flash, PageHeader } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { filtersToQuery, parseFilters, rangeIsBackwards, reconcileFilters } from '@/lib/filters'
import { flashFrom, type SearchParams } from '@/lib/flash'
import { formatDate } from '@/lib/format'
import { kindToQuery } from '@/lib/items'
import { loadClientOptions, loadLatestStock, loadMovements, loadPropertyOptions, loadTotals, stockCards } from '@/lib/queries'
import type { ClientOption, PropertyOption } from '@/lib/types'

export const metadata = { title: 'Panoramica' }

export default async function AdminHome({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { supabase } = await requireAdmin()
  const [clients, properties] = await Promise.all([
    loadClientOptions(supabase),
    loadPropertyOptions(supabase),
  ])
  const requested = parseFilters(params)
  const filters = reconcileFilters(requested, properties)
  if (requested.propertyId && requested.propertyId !== filters.propertyId) {
    redirect(filtersToQuery('/admin', filters))
  }

  const [delivery, pickup, counts, movements] = await Promise.all([
    loadTotals(supabase, 'delivery', filters),
    loadTotals(supabase, 'pickup', filters),
    loadLatestStock(supabase, {
      clientId: filters.clientId,
      propertyId: filters.propertyId,
      asOf: filters.to,
    }),
    loadMovements(supabase, filters),
  ])
  const cards = stockCards(properties, counts, filters)
  const flash = flashFrom(params)

  return (
    <>
      <PageHeader
        eyebrow="Servizio"
        title="Panoramica"
        description={describeFilters(filters, clients, properties)}
      />
      <Flash error={flash.error} message={flash.message} />
      {rangeIsBackwards(filters) ? (
        <p className="mb-4 rounded-2xl bg-amber-soft px-3 py-2 text-sm text-amber">
          La data iniziale è dopo quella finale: il periodo non contiene giorni.
        </p>
      ) : null}

      <Card className="mb-4">
        <FilterForm action="/admin" filters={filters} clients={clients} properties={properties} />
      </Card>

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <Link href={`/admin/movimenti/nuovo?tipo=${kindToQuery('delivery')}`} className={buttonClass('primary')}>
          Nuova consegna
        </Link>
        <Link href={`/admin/movimenti/nuovo?tipo=${kindToQuery('pickup')}`} className={buttonClass('quiet')}>
          Nuovo ritiro
        </Link>
        <Link href={`/admin/movimenti/nuovo?tipo=${kindToQuery('stock_count')}`} className={buttonClass('quiet')}>
          Nuovo conteggio
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Totali nel periodo</h2>
        <TotalsPanel delivery={delivery} pickup={pickup} />
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl">Giacenza attuale</h2>
        <p className="mt-1 mb-3 max-w-2xl text-sm leading-6 text-ink-soft">
          È l’ultimo conteggio manuale{filters.to ? ` fino al ${formatDate(filters.to)}` : ''}. Non è
          calcolata da consegne e ritiri. Se non c’è un conteggio, la giacenza non è zero: non è
          ancora stata rilevata.
        </p>
        {cards.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-ink-soft">
            Nessuna struttura da mostrare. Aggiungi un cliente e una struttura.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {cards.map((card) => (
              <Card key={card.propertyId}>
                <p className="text-sm text-ink-soft">{card.clientName}</p>
                <h3 className="font-serif text-2xl">{card.propertyName}</h3>
                {card.address ? <p className="text-sm text-ink-soft">{card.address}</p> : null}
                <div className="mt-3">
                  {card.count ? (
                    <>
                      <p className="mb-2 text-sm font-medium">Conteggio del {formatDate(card.count.date)}</p>
                      <StockGrid quantities={card.count.quantities} />
                      {card.count.notes ? <p className="mt-2 text-sm text-ink-soft">{card.count.notes}</p> : null}
                    </>
                  ) : (
                    <p className="text-sm text-ink-soft">Nessun conteggio registrato.</p>
                  )}
                </div>
                <Link
                  href={`/admin/movimenti/nuovo?tipo=giacenza&struttura=${card.propertyId}`}
                  className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-teal"
                >
                  Registra un conteggio
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-2xl">Movimenti</h2>
        {movements.truncated ? (
          <p className="mb-3 text-sm text-ink-soft">Mostro i 200 movimenti più recenti. I totali sopra contano tutto il periodo.</p>
        ) : null}
        <MovementList movements={movements.rows} editable />
      </section>
    </>
  )
}

function describeFilters(filters: ReturnType<typeof parseFilters>, clients: ClientOption[], properties: PropertyOption[]) {
  const parts: string[] = []
  const client = clients.find((item) => item.id === filters.clientId)
  const property = properties.find((item) => item.id === filters.propertyId)
  if (client) parts.push(client.name)
  if (property) parts.push(property.name)
  if (filters.from && filters.to) parts.push(`dal ${formatDate(filters.from)} al ${formatDate(filters.to)}`)
  else if (filters.from) parts.push(`dal ${formatDate(filters.from)}`)
  else if (filters.to) parts.push(`fino al ${formatDate(filters.to)}`)
  else parts.push('Tutte le date')
  return parts.join(' · ')
}
