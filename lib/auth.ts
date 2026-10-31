import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { SessionUser } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

export async function getSessionUser(supabase: SupabaseClient): Promise<SessionUser | null> {
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null
  const email = typeof data.claims.email === 'string' ? data.claims.email : null
  if (!email) return null

  const metadata = data.claims.user_metadata
  let fullName: string | null = null
  if (metadata && typeof metadata === 'object' && 'full_name' in metadata) {
    const value = metadata.full_name
    if (typeof value === 'string' && value.trim()) fullName = value.trim()
  }

  return { id: data.claims.sub, email, fullName }
}

export async function fetchIsAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) {
    console.error(error)
    return false
  }
  return data === true
}

export async function homePath(supabase: SupabaseClient): Promise<string> {
  return (await fetchIsAdmin(supabase)) ? '/admin' : '/area'
}

export async function requireUser() {
  const supabase = await createClient()
  const user = await getSessionUser(supabase)
  if (!user) redirect('/accedi')
  return { supabase, user }
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser()
  if (!(await fetchIsAdmin(supabase))) redirect('/area')
  return { supabase, user }
}
