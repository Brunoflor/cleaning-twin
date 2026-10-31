import Link from 'next/link'
import { MovementFields } from '@/components/movement-fields'
import { PreviewChrome } from '@/components/preview-chrome'
import { buttonClass, Card, PageHeader } from '@/components/ui'
import { parseFilters } from '@/lib/filters'
import type { SearchParams } from '@/lib/flash'
import { todayISO } from '@/lib/format'
import { previewProperties } from '@/lib/preview-data'

export const metadata = { title: 'Nuova registrazione' }

export default async function PreviewNewMovementPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const filters = parseFilters(await searchParams)
  return (
    <PreviewChrome role="admin" email="admin@cleaning-twin.example">
      <Link href="/anteprima/admin/movimenti" className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-teal">
        Tutti i movimenti
      </Link>
      <PageHeader title="Nuova registrazione" description="Una data, una struttura, le quantità." />
      <Card>
        <form className="space-y-5">
          <MovementFields
            properties={previewProperties}
            defaults={{
              kind: filters.kind ?? 'delivery',
              propertyId: filters.propertyId,
              date: todayISO(),
            }}
          />
          <button type="button" className={buttonClass('primary')}>
            Salva registrazione
          </button>
        </form>
      </Card>
    </PreviewChrome>
  )
}
