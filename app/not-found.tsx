import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
      <h1 className="font-serif text-4xl tracking-tight">Pagina non trovata</h1>
      <p className="mt-3 text-sm leading-6 text-ink-soft">Questo indirizzo non corrisponde a una pagina di Cleaning Twin.</p>
      <Link href="/" className="mt-6 text-sm font-semibold text-teal">
        Torna all’inizio
      </Link>
    </main>
  )
}
