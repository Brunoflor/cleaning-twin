import Link from 'next/link'
import { ActionForm } from '@/components/action-form'
import { SubmitButton } from '@/components/submit-button'
import { Card, Field, Flash, PageHeader, TextArea } from '@/components/ui'
import { createClientRecord } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { flashFrom, type SearchParams } from '@/lib/flash'
import { loadClients } from '@/lib/queries'

export const metadata = { title: 'Clienti' }

export default async function ClientsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin()
  const [clients, flash] = await Promise.all([loadClients(supabase), flashFrom(await searchParams)])

  return (
    <>
      <PageHeader
        title="Clienti"
        description="L’email è il collegamento con l’accesso. Chi si registra con lo stesso indirizzo vede solo le strutture di quel cliente."
      />
      <Flash error={flash.error} message={flash.message} />
      <Card className="mb-6">
        <h2 className="mb-3 font-serif text-2xl">Nuovo cliente</h2>
        <ActionForm action={createClientRecord} className="space-y-4">
          <Field label="Nome" name="name" required hint="Per esempio il nome dell’hotel." />
          <Field label="Email" name="email" type="email" autoComplete="off" required />
          <Field label="Telefono" name="phone" type="tel" autoComplete="off" />
          <TextArea label="Note" name="notes" />
          <SubmitButton>Crea cliente</SubmitButton>
        </ActionForm>
      </Card>
      {clients.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
          Non c’è ancora nessun cliente.
        </p>
      ) : (
        <ul className="space-y-3">
          {clients.map((client) => (
            <li key={client.id}>
              <Link href={`/admin/clienti/${client.id}`} className="block rounded-3xl border border-line bg-card p-4">
                <p className="font-serif text-2xl">{client.name}</p>
                <p className="text-sm text-ink-soft">{client.email}</p>
                <p className="mt-2 text-sm">
                  {client.properties.length === 0
                    ? 'Nessuna struttura'
                    : client.properties.length === 1
                      ? '1 struttura'
                      : `${client.properties.length} strutture`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
