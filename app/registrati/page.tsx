import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ActionForm } from '@/components/action-form'
import { Logo } from '@/components/logo'
import { SubmitButton } from '@/components/submit-button'
import { Field } from '@/components/ui'
import { signUp } from '@/lib/actions'
import { getSessionUser, homePath } from '@/lib/auth'
import { supabaseEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  if (supabaseEnv()) {
    const supabase = await createClient()
    const user = await getSessionUser(supabase)
    if (user) redirect(await homePath(supabase))
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/">
        <Logo />
      </Link>
      <h1 className="mt-8 font-serif text-4xl tracking-tight">Crea un account</h1>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        Non serve un’approvazione. Quando il gestore registra un cliente con la tua email, vedi le
        sue strutture.
      </p>
      <ActionForm action={signUp} className="mt-6 space-y-4">
        <Field label="Nome e cognome" name="full_name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="Almeno 8 caratteri."
        />
        <Field
          label="Ripeti la password"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          required
        />
        <SubmitButton pendingLabel="Creazione…">Crea l’account</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-sm text-ink-soft">
        Hai già un account?{' '}
        <Link href="/accedi" className="font-semibold text-teal">
          Accedi
        </Link>
      </p>
    </main>
  )
}
