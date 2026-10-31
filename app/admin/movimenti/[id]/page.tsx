import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm } from '@/components/action-form'
import { MovementFields } from '@/components/movement-fields'
import { ConfirmButton, SubmitButton } from '@/components/submit-button'
import { Card, Flash, PageHeader } from '@/components/ui'
import { deleteMovement, updateMovement } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { flashFrom, type SearchParams } from '@/lib/flash'
import { KIND_META } from '@/lib/items'
import { loadMovement, loadPropertyOptions } from '@/lib/queries'
import { isUuid } from '@/lib/validation'

export const metadata = { title: 'Modifica registrazione' }

export default async function EditMovementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const { supabase } = await requireAdmin()
  const [movement, properties] = await Promise.all([loadMovement(supabase, id), loadPropertyOptions(supabase)])
  if (!movement) notFound()
  const flash = flashFrom(await searchParams)

  return (
    <>
      <Link href="/admin/movimenti" className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-teal">
        Tutti i movimenti
      </Link>
      <PageHeader
        title="Modifica registrazione"
        description={`${KIND_META[movement.kind].label} · ${movement.clientName} — ${movement.propertyName}`}
      />
      <Flash error={flash.error} message={flash.message} />
      <Card>
        <ActionForm action={updateMovement.bind(null, movement.id)} className="space-y-5">
          <MovementFields
            properties={properties}
            defaults={{
              propertyId: movement.propertyId,
              kind: movement.kind,
              date: movement.date,
              notes: movement.notes,
              quantities: movement.quantities,
            }}
          />
          <SubmitButton>Salva modifiche</SubmitButton>
        </ActionForm>
        <form action={deleteMovement.bind(null, movement.id)} className="mt-4 border-t border-line pt-4">
          <ConfirmButton message="Eliminare questa registrazione?">Elimina registrazione</ConfirmButton>
        </form>
      </Card>
    </>
  )
}
