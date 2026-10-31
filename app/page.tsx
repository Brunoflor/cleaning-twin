import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/logo'
import { buttonClass } from '@/components/ui'
import { fetchIsAdmin, getSessionUser } from '@/lib/auth'
import { supabaseEnv } from '@/lib/env'
import { ITEM_TYPES, KIND_META, MOVEMENT_KINDS } from '@/lib/items'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  if (supabaseEnv()) {
    const supabase = await createClient()
    const user = await getSessionUser(supabase)
    if (user) redirect((await fetchIsAdmin(supabase)) ? '/admin' : '/area')
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-14">
      <Logo />
      <p className="mt-10 text-xs font-semibold tracking-[0.16em] text-teal uppercase">Noleggio biancheria</p>
      <h1 className="mt-3 max-w-xl font-serif text-5xl leading-none tracking-tight sm:text-6xl">
        Ogni capo, in ogni struttura.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft">
        Cleaning Twin tiene il conto di quello che esce pulito, di quello che rientra sporco e di
        quello che resta dal cliente. Un accesso per chi gestisce il servizio, uno per la struttura.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/accedi" className={buttonClass('primary')}>
          Accedi
        </Link>
        <Link href="/registrati" className={buttonClass('quiet')}>
          Crea un account
        </Link>
      </div>

      <div className="mt-12 grid gap-3 md:grid-cols-3">
        {MOVEMENT_KINDS.map((kind) => (
          <article key={kind} className="rounded-3xl border border-line bg-card p-4">
            <h2 className="font-serif text-2xl">{KIND_META[kind].label}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{KIND_META[kind].description}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-3xl border border-line bg-card p-4">
        <h2 className="text-sm font-semibold tracking-wide text-ink-soft uppercase">Capi seguiti</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {ITEM_TYPES.map((item) => (
            <li key={item.key} className="rounded-full bg-sand px-3 py-1.5 text-sm">
              {item.label}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
