import Link from 'next/link'
import { MovementList } from '@/components/movement-list'
import { PreviewChrome } from '@/components/preview-chrome'
import { StockGrid } from '@/components/stock-grid'
import { TotalsPanel } from '@/components/totals-panel'
import { buttonClass, Card, PageHeader } from '@/components/ui'
import { FilterForm } from '@/components/filter-form'
import { formatDate } from '@/lib/format'
import { kindToQuery } from '@/lib/items'
import { previewClients, previewMovements, previewProperties, previewStock, previewTotals } from '@/lib/preview-data'

export const metadata = { title: 'Panoramica' }

export default function PreviewAdminPage() {
  return (
    <PreviewChrome role="admin" email="admin@cleaning-twin.example">
      <PageHeader eyebrow="Servizio" title="Panoramica" description="Tutte le date" />
      <Card className="mb-4">
        <FilterForm
          action="/anteprima/admin"
          filters={{}}
          clients={previewClients.map((client) => ({ id: client.id, name: client.name }))}
          properties={previewProperties}
        />
      </Card>
      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <Link href={`/anteprima/admin/movimenti/nuovo?tipo=${kindToQuery('delivery')}`} className={buttonClass('primary')}>
          Nuova consegna
        </Link>
        <Link href={`/anteprima/admin/movimenti/nuovo?tipo=${kindToQuery('pickup')}`} className={buttonClass('quiet')}>
          Nuovo ritiro
        </Link>
        <Link href={`/anteprima/admin/movimenti/nuovo?tipo=${kindToQuery('stock_count')}`} className={buttonClass('quiet')}>
          Nuovo conteggio
        </Link>
      </div>
      <section className="mb-8">
        <h2 className="mb-3 font-serif text-2xl">Totali nel periodo</h2>
        <TotalsPanel delivery={previewTotals('delivery')} pickup={previewTotals('pickup')} />
      </section>
      <section className="mb-8">
        <h2 className="font-serif text-2xl">Giacenza attuale</h2>
        <p className="mt-1 mb-3 max-w-2xl text-sm leading-6 text-ink-soft">
          È l’ultimo conteggio manuale. Non è calcolata da consegne e ritiri. Se non c’è un conteggio,
          la giacenza non è zero: non è ancora stata rilevata.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          {previewStock.map((card) => (
            <Card key={card.propertyId}>
              <p className="text-sm text-ink-soft">{card.clientName}</p>
              <h3 className="font-serif text-2xl">{card.propertyName}</h3>
              {card.address ? <p className="text-sm text-ink-soft">{card.address}</p> : null}
              <div className="mt-3">
                {card.count ? (
                  <>
                    <p className="mb-2 text-sm font-medium">Conteggio del {formatDate(card.count.date)}</p>
                    <StockGrid quantities={card.count.quantities} />
                  </>
                ) : (
                  <p className="text-sm text-ink-soft">Nessun conteggio registrato.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 font-serif text-2xl">Movimenti</h2>
        <MovementList movements={previewMovements} hrefBase="/anteprima" editable />
      </section>
    </PreviewChrome>
  )
}
