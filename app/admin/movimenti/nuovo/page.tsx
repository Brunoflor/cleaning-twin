import Link from 'next/link'
import { ActionForm } from '@/components/action-form'
import { MovementFields } from '@/components/movement-fields'
import { SubmitButton } from '@/components/submit-button'
import { Card, PageHeader } from '@/components/ui'
import { createMovement } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { parseFilters } from '@/lib/filters'
import type { SearchParams } from '@/lib/flash'
import { todayISO } from '@/lib/format'
import { loadPropertyOptions } from '@/lib/queries'

export const metadata = { title: 'Nuova registrazione' }

export default async function NewMovementPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin()
  const properties = await loadPropertyOptions(supabase)
  const filters = parseFilters(await searchParams)
  const propertyId = properties.some((property) => property.id === filters.propertyId) ? filters.propertyId : undefined

  return (
    <>
      <Link href="/admin/movimenti" className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-teal">
        Tutti i movimenti
      </Link>
      <PageHeader title="Nuova registrazione" description="Una data, una struttura, le quantità." />
      {properties.length === 0 ? (
        <Card>
          <p className="text-sm leading-6 text-ink-soft">
            Prima serve almeno un cliente con una struttura.
          </p>
          <Link href="/admin/clienti" className="mt-3 inline-flex min-h-11 items-center font-semibold text-teal">
            Vai ai clienti
          </Link>
        </Card>
      ) : (
        <Card>
          <ActionForm action={createMovement} className="space-y-5">
            <MovementFields
              properties={properties}
              defaults={{ kind: filters.kind ?? 'delivery', propertyId, date: todayISO() }}
            />
            <SubmitButton>Salva registrazione</SubmitButton>
          </ActionForm>
        </Card>
      )}
    </>
  )
}
