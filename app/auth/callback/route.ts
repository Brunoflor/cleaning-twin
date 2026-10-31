import { NextResponse } from 'next/server'
import { homePath } from '@/lib/auth'
import { supabaseEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  if (!supabaseEnv()) {
    return NextResponse.redirect(new URL('/accedi?errore=configurazione', url.origin))
  }

  const code = url.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/accedi?errore=link_non_valido', url.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/accedi?errore=link_non_valido', url.origin))
  }

  return NextResponse.redirect(new URL(await homePath(supabase), url.origin))
}
