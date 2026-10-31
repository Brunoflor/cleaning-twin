import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MovementList } from '@/components/movement-list'
import { StockGrid } from '@/components/stock-grid'
import { Card, Flash, PageHeader } from '@/components/ui'
import { fetchIsAdmin, requireUser } from '@/lib/auth'
import { parseFilters, reconcileFilters } from '@/lib/filters'
import { flashFrom, type SearchParams } from '@/lib/flash'
import { formatDate } from '@/lib/format'
import { loadClientByEmail, loadLatestStock, loadMovements } from '@/lib/queries'
import type { MovementRecord, PropertyRecord, StockCount } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'La tua area' }

export default async function ClientAreaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { supabase, user } = await requireUser()
  const client = await loadClientByEmail(supabase, user.email)
  const admin = await fetchIsAdmin(supabase)
  const flash = flashFrom(params)

  if (!client) {
    return (
      <>
        <PageHeader title={user.fullName ? `Ciao, ${user.fullName}` : 'La tua area'} />
        <Flash error={flash.error} message={flash.message} />
        <Card>
          <h2 className="font-serif text-2xl">Nessuna struttura collegata</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            L’account è attivo, ma questa email non è ancora associata a un cliente. Quando chi
            gestisce il servizio ti registra con lo stesso indirizzo, qui compariranno consegne,
            ritiri e giacenza.
          </p>
          <p className="mt-4 rounded-2xl bg-sand px-3 py-2 text-sm">
            Email da comunicare: <span className="font-semibold">{user.email}</span>
          </p>
        </Card>
        {admin ? (
          <Link href="/admin" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-teal">
            Apri la panoramica
          </Link>
        ) : null}
      </>
    )
  }

  const requested = parseFilters(params)
  const properties = client.properties.map((property) => ({ id: property.id, clientId: client.id }))
  const filters = reconcileFilters(
    { propertyId: requested.propertyId, clientId: client.id },
    properties,
  )
  if (requested.propertyId && requested.propertyId !== filters.propertyId) {
    redirect(filters.propertyId ? `/area?struttura=${filters.propertyId}` : '/area')
  }

  const [movements, counts] = await Promise.all([
    loadMovements(supabase, { clientId: client.id, propertyId: filters.propertyId }),
    loadLatestStock(supabase, { clientId: client.id, propertyId: filters.propertyId }),
  ])
  const visibleProperties = client.properties.filter(
    (property) => !filters.propertyId || property.id === filters.propertyId,
  )

  return (
    <>
      <PageHeader
        eyebrow="Cliente"
        title={client.name}
        description="Consegne, ritiri e ultimo conteggio di giacenza. La giacenza non è calcolata dai movimenti."
        action={
          admin ? (
            <Link href="/admin" className="text-sm font-semibold text-teal">
              Panoramica
            </Link>
          ) : null
        }
      />
      <Flash error={flash.error} message={flash.message} />
      {client.properties.length > 1 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/area"
            aria-current={filters.propertyId ? undefined : 'page'}
            className={chipClass(!filters.propertyId)}
          >
            Tutte
          </Link>
          {client.properties.map((property) => (
            <Link
              key={property.id}
              href={`/area?struttura=${property.id}`}
              aria-current={filters.propertyId === property.id ? 'page' : undefined}
              className={chipClass(filters.propertyId === property.id)}
            >
              {property.name}
            </Link>
          ))}
        </div>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Giacenza attuale</h2>
        {visibleProperties.length === 0 ? (
          <p className="text-sm text-ink-soft">Non ci sono ancora strutture a tuo nome.</p>
        ) : (
          <div className="space-y-3">
            {visibleProperties.map((property) => (
              <PropertyStock
                key={property.id}
                property={property}
                count={counts.find((count) => count.propertyId === property.id) ?? null}
              />
            ))}
          </div>
        )}
      </section>

      {movements.truncated ? (
        <p className="mb-4 text-sm text-ink-soft">Mostro i 200 movimenti più recenti.</p>
      ) : null}
      <History title="Consegne" movements={movements.rows.filter((row) => row.kind === 'delivery')} empty="Nessuna consegna registrata." />
      <History title="Ritiri" movements={movements.rows.filter((row) => row.kind === 'pickup')} empty="Nessun ritiro registrato." />
      <History
        title="Conteggi di giacenza"
        movements={movements.rows.filter((row) => row.kind === 'stock_count')}
        empty="Nessun conteggio registrato."
      />
    </>
  )
}

function chipClass(active: boolean) {
  return `inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold ${active ? 'bg-teal text-white' : 'border border-line bg-card'}`
}

function PropertyStock({ property, count }: { property: PropertyRecord; count: StockCount | null }) {
  return (
    <Card>
      <h3 className="font-serif text-2xl">{property.name}</h3>
      {property.address ? <p className="text-sm text-ink-soft">{property.address}</p> : null}
      <div className="mt-3">
        {count ? (
          <>
            <p className="mb-2 text-sm font-medium">Conteggio del {formatDate(count.date)}</p>
            <StockGrid quantities={count.quantities} />
            {count.notes ? <p className="mt-2 text-sm text-ink-soft">{count.notes}</p> : null}
          </>
        ) : (
          <p className="text-sm leading-6 text-ink-soft">
            Non è ancora stato registrato un conteggio per questa struttura.
          </p>
        )}
      </div>
    </Card>
  )
}

function History({ title, movements, empty }: { title: string; movements: MovementRecord[]; empty: string }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-serif text-2xl">{title}</h2>
      <MovementList movements={movements} empty={empty} />
    </section>
  )
}
