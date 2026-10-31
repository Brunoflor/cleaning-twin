import Link from 'next/link'
import { PreviewChrome } from '@/components/preview-chrome'
import { buttonClass, Card, Field, PageHeader, TextArea } from '@/components/ui'
import { previewClients } from '@/lib/preview-data'

export const metadata = { title: 'Clienti' }

export default function PreviewClientsPage() {
  return (
    <PreviewChrome role="admin" email="admin@cleaning-twin.example">
      <PageHeader
        title="Clienti"
        description="L’email è il collegamento con l’accesso. Chi si registra con lo stesso indirizzo vede solo le strutture di quel cliente."
      />
      <Card className="mb-6">
        <h2 className="mb-3 font-serif text-2xl">Nuovo cliente</h2>
        <form className="space-y-4">
          <Field label="Nome" name="name" required hint="Per esempio il nome dell’hotel." />
          <Field label="Email" name="email" type="email" required />
          <Field label="Telefono" name="phone" type="tel" />
          <TextArea label="Note" name="notes" />
          <button type="button" className={buttonClass('primary')}>
            Crea cliente
          </button>
        </form>
      </Card>
      <ul className="space-y-3">
        {previewClients.map((client) => (
          <li key={client.id}>
            <Link href={`/anteprima/admin/clienti/${client.id}`} className="block rounded-3xl border border-line bg-card p-4">
              <p className="font-serif text-2xl">{client.name}</p>
              <p className="text-sm text-ink-soft">{client.email}</p>
              <p className="mt-2 text-sm">{client.properties.length === 1 ? '1 struttura' : `${client.properties.length} strutture`}</p>
            </Link>
          </li>
        ))}
      </ul>
    </PreviewChrome>
  )
}
