import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FilterForm } from '@/components/filter-form'
import { MovementList } from '@/components/movement-list'
import { buttonClass, Card, Flash, PageHeader } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { filtersToQuery, parseFilters, reconcileFilters, type Filters } from '@/lib/filters'
import { flashFrom, type SearchParams } from '@/lib/flash'
import { KIND_META, MOVEMENT_KINDS, type MovementKind } from '@/lib/items'
import { loadClientOptions, loadMovements, loadPropertyOptions } from '@/lib/queries'

export const metadata = { title: 'Movimenti' }

export default async function MovementsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { supabase } = await requireAdmin()
  const [clients, properties] = await Promise.all([
    loadClientOptions(supabase),
    loadPropertyOptions(supabase),
  ])
  const requested = parseFilters(params)
  const filters = reconcileFilters(requested, properties)
  if (requested.propertyId && requested.propertyId !== filters.propertyId) {
    redirect(filtersToQuery('/admin/movimenti', filters))
  }
  const movements = await loadMovements(supabase, filters)
  const flash = flashFrom(params)

  return (
    <>
      <PageHeader
        title="Movimenti"
        description="Consegne, ritiri e conteggi di giacenza."
        action={
          <Link href="/admin/movimenti/nuovo" className={buttonClass('primary')}>
            Nuova registrazione
          </Link>
        }
      />
      <Flash error={flash.error} message={flash.message} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <KindTab filters={filters} />
        {MOVEMENT_KINDS.map((kind) => (
          <KindTab key={kind} filters={filters} kind={kind} />
        ))}
      </div>
      <Card className="mb-4">
        <FilterForm action="/admin/movimenti" filters={filters} clients={clients} properties={properties} />
      </Card>
      {movements.truncated ? (
        <p className="mb-3 text-sm text-ink-soft">Mostro i 200 movimenti più recenti.</p>
      ) : null}
      <MovementList movements={movements.rows} editable />
    </>
  )
}

function KindTab({ filters, kind }: { filters: Filters; kind?: MovementKind }) {
  const active = filters.kind === kind
  const href = filtersToQuery('/admin/movimenti', { ...filters, kind })
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold ${active ? 'bg-teal text-white' : 'bg-card text-ink border border-line'}`}
    >
      {kind ? KIND_META[kind].short : 'Tutti'}
    </Link>
  )
}
