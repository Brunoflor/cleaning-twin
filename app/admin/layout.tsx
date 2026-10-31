import { SetupNeeded } from '@/components/setup-needed'
import { Shell } from '@/components/shell'
import { SignOutButton } from '@/components/sign-out-button'
import { requireAdmin } from '@/lib/auth'
import { supabaseEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseEnv()) return <SetupNeeded />
  const { user } = await requireAdmin()
  return (
    <Shell role="admin" email={user.email} width="wide" signOut={<SignOutButton />}>
      {children}
    </Shell>
  )
}
