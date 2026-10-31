import { SetupNeeded } from '@/components/setup-needed'
import { Shell } from '@/components/shell'
import { SignOutButton } from '@/components/sign-out-button'
import { requireUser } from '@/lib/auth'
import { supabaseEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function AreaLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseEnv()) return <SetupNeeded />
  const { user } = await requireUser()
  return (
    <Shell role="client" email={user.email} signOut={<SignOutButton />}>
      {children}
    </Shell>
  )
}
