import Link from 'next/link'
import { MovementList } from '@/components/movement-list'
import { PreviewChrome } from '@/components/preview-chrome'
import { StockGrid } from '@/components/stock-grid'
import { Card, PageHeader } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { previewHotel, previewMovements, previewStock } from '@/lib/preview-data'

export const metadata = { title: 'La tua area' }

export default function PreviewClientPage() {
  const movements = previewMovements.filter((movement) => movement.clientId === previewHotel.id)
  const stock = previewStock.filter((card) => card.clientId === previewHotel.id)
  return (
    <PreviewChrome role="client" email={previewHotel.email}>
      <PageHeader
        eyebrow="Cliente"
        title={previewHotel.name}
        description="Consegne, ritiri e ultimo conteggio di giacenza. La giacenza non è calcolata dai movimenti."
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Link href="/anteprima/area" aria-current="page" className="inline-flex min-h-11 items-center rounded-full bg-teal px-3 text-sm font-semibold text-white">
          Tutte
        </Link>
        {previewHotel.properties.map((property) => (
          <span key={property.id} className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-3 text-sm font-semibold">
            {property.name}
          </span>
        ))}
      </div>
      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Giacenza attuale</h2>
        <div className="space-y-3">
          {stock.map((card) => (
            <Card key={card.propertyId}>
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
                  <p className="text-sm text-ink-soft">Non è ancora stato registrato un conteggio per questa struttura.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Consegne</h2>
        <MovementList movements={movements.filter((movement) => movement.kind === 'delivery')} empty="Nessuna consegna registrata." />
      </section>
      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Ritiri</h2>
        <MovementList movements={movements.filter((movement) => movement.kind === 'pickup')} empty="Nessun ritiro registrato." />
      </section>
      <section>
        <h2 className="mb-3 font-serif text-2xl">Conteggi di giacenza</h2>
        <MovementList movements={movements.filter((movement) => movement.kind === 'stock_count')} empty="Nessun conteggio registrato." />
      </section>
    </PreviewChrome>
  )
}
