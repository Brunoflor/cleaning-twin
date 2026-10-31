'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
      <h1 className="font-serif text-4xl tracking-tight">Qualcosa non ha funzionato</h1>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        Riprova tra un momento. Se il problema resta, controlla la connessione e la configurazione
        di Supabase.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal px-4 text-sm font-semibold text-white"
      >
        Riprova
      </button>
    </main>
  )
}
