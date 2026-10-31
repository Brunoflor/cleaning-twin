import { PreviewChrome } from '@/components/preview-chrome'
import { Card, PageHeader } from '@/components/ui'

export const metadata = { title: 'La tua area' }

export default function PreviewEmptyAreaPage() {
  return (
    <PreviewChrome role="client" email="ospite@example.com">
      <PageHeader title="Ciao, Giulia" />
      <Card>
        <h2 className="font-serif text-2xl">Nessuna struttura collegata</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          L’account è attivo, ma questa email non è ancora associata a un cliente. Quando chi gestisce
          il servizio ti registra con lo stesso indirizzo, qui compariranno consegne, ritiri e giacenza.
        </p>
        <p className="mt-4 rounded-2xl bg-sand px-3 py-2 text-sm">
          Email da comunicare: <span className="font-semibold">ospite@example.com</span>
        </p>
      </Card>
    </PreviewChrome>
  )
}
