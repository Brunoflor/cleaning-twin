import { Logo } from '@/components/logo'

export function SetupNeeded() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-16">
      <Logo />
      <h1 className="mt-6 font-serif text-3xl tracking-tight">Configurazione incompleta</h1>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        Per entrare servono l’indirizzo del progetto Supabase e la chiave pubblica. Copia{' '}
        <code className="rounded bg-sand px-1">.env.example</code> in{' '}
        <code className="rounded bg-sand px-1">.env.local</code> e inserisci{' '}
        <code className="rounded bg-sand px-1">NEXT_PUBLIC_SUPABASE_URL</code> più{' '}
        <code className="rounded bg-sand px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (oppure la
        chiave anon). Poi riavvia l’app.
      </p>
    </main>
  )
}
