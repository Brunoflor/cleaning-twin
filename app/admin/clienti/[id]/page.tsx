import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm } from '@/components/action-form'
import { ConfirmButton, SubmitButton } from '@/components/submit-button'
import { Card, Field, Flash, PageHeader, TextArea } from '@/components/ui'
import { deleteClient, deleteProperty, updateClient, createProperty, updateProperty } from '@/lib/actions'
import { requireAdmin } from '@/lib/auth'
import { flashFrom, type SearchParams } from '@/lib/flash'
import { loadClient } from '@/lib/queries'
import { isUuid } from '@/lib/validation'

export const metadata = { title: 'Cliente' }

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const { supabase } = await requireAdmin()
  const client = await loadClient(supabase, id)
  if (!client) notFound()
  const flash = flashFrom(await searchParams)

  return (
    <>
      <Link href="/admin/clienti" className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-teal">
        Tutti i clienti
      </Link>
      <PageHeader title={client.name} description={client.email} />
      <Flash error={flash.error} message={flash.message} />

      <Card className="mb-6">
        <h2 className="mb-3 font-serif text-2xl">Dati</h2>
        <ActionForm action={updateClient.bind(null, client.id)} className="space-y-4">
          <Field label="Nome" name="name" required defaultValue={client.name} />
          <Field label="Email" name="email" type="email" required defaultValue={client.email} />
          <Field label="Telefono" name="phone" type="tel" defaultValue={client.phone} />
          <TextArea label="Note" name="notes" defaultValue={client.notes} />
          <SubmitButton>Salva cliente</SubmitButton>
        </ActionForm>
      </Card>

      <section className="mb-6">
        <h2 className="mb-3 font-serif text-2xl">Strutture</h2>
        <Card className="mb-3">
          <h3 className="mb-3 font-semibold">Nuova struttura</h3>
          <ActionForm action={createProperty.bind(null, client.id)} className="space-y-4">
            <Field label="Nome" name="name" required hint="Per esempio Camere vista mare." />
            <Field label="Indirizzo" name="address" />
            <TextArea label="Note" name="notes" />
            <SubmitButton>Aggiungi struttura</SubmitButton>
          </ActionForm>
        </Card>
        {client.properties.length === 0 ? (
          <p className="text-sm text-ink-soft">Questo cliente non ha ancora strutture. I movimenti si registrano su una struttura.</p>
        ) : (
          <ul className="space-y-3">
            {client.properties.map((property) => (
              <li key={property.id}>
                <Card>
                  <h3 className="font-serif text-2xl">{property.name}</h3>
                  {property.address ? <p className="text-sm text-ink-soft">{property.address}</p> : null}
                  {property.notes ? <p className="mt-1 text-sm">{property.notes}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link className="inline-flex min-h-11 items-center rounded-xl bg-teal px-3 text-sm font-semibold text-white" href={`/admin/movimenti/nuovo?tipo=consegna&struttura=${property.id}`}>
                      Consegna
                    </Link>
                    <Link className="inline-flex min-h-11 items-center rounded-xl bg-sand px-3 text-sm font-semibold" href={`/admin/movimenti/nuovo?tipo=ritiro&struttura=${property.id}`}>
                      Ritiro
                    </Link>
                    <Link className="inline-flex min-h-11 items-center rounded-xl bg-sand px-3 text-sm font-semibold" href={`/admin/movimenti/nuovo?tipo=giacenza&struttura=${property.id}`}>
                      Giacenza
                    </Link>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-teal">Modifica struttura</summary>
                    <ActionForm action={updateProperty.bind(null, client.id, property.id)} className="mt-3 space-y-4">
                      <Field label="Nome" name="name" required defaultValue={property.name} />
                      <Field label="Indirizzo" name="address" defaultValue={property.address} />
                      <TextArea label="Note" name="notes" defaultValue={property.notes} />
                      <SubmitButton>Salva struttura</SubmitButton>
                    </ActionForm>
                    <form action={deleteProperty.bind(null, client.id, property.id)} className="mt-3">
                      <ConfirmButton message={`Eliminare ${property.name} e tutti i suoi movimenti?`}>
                        Elimina struttura
                      </ConfirmButton>
                    </form>
                  </details>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card>
        <h2 className="font-serif text-2xl">Elimina cliente</h2>
        <p className="mt-1 mb-3 text-sm leading-6 text-ink-soft">
          Elimina anche le strutture, le consegne, i ritiri e i conteggi. L’account di accesso, se
          esiste, resta: non vedrà più questi dati.
        </p>
        <form action={deleteClient.bind(null, client.id)}>
          <ConfirmButton message={`Eliminare ${client.name} e tutti i dati collegati?`}>
            Elimina cliente
          </ConfirmButton>
        </form>
      </Card>
    </>
  )
}
