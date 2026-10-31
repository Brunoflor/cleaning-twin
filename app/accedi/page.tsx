import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ActionForm } from '@/components/action-form'
import { Logo } from '@/components/logo'
import { SubmitButton } from '@/components/submit-button'
import { Field, Flash } from '@/components/ui'
import { signIn } from '@/lib/actions'
import { getSessionUser, homePath } from '@/lib/auth'
import { supabaseEnv } from '@/lib/env'
import { flashFrom, type SearchParams } from '@/lib/flash'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (supabaseEnv()) {
    const supabase = await createClient()
    const user = await getSessionUser(supabase)
    if (user) redirect(await homePath(supabase))
  }
  const flash = flashFrom(await searchParams)

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/">
        <Logo />
      </Link>
      <h1 className="mt-8 font-serif text-4xl tracking-tight">Accedi</h1>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        Usa l’email con cui ti sei registrato. Se non sei ancora collegato a una struttura, dopo
        l’accesso vedrai un messaggio, non un errore.
      </p>
      <div className="mt-6">
        <Flash error={flash.error} message={flash.message} />
        <ActionForm action={signIn} className="space-y-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <SubmitButton pendingLabel="Accesso…">Entra</SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        Non hai un account?{' '}
        <Link href="/registrati" className="font-semibold text-teal">
          Registrati
        </Link>
      </p>
    </main>
  )
}
