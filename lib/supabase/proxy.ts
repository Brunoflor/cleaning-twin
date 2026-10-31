import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseEnv } from '@/lib/env'

export async function updateSession(request: NextRequest) {
  const env = supabaseEnv()
  if (!env) return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value)
        })
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const pathname = request.nextUrl.pathname
  const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/area')
  if (!data?.claims && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/accedi'
    url.search = ''
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    for (const header of ['cache-control', 'expires', 'pragma']) {
      const value = supabaseResponse.headers.get(header)
      if (value) redirectResponse.headers.set(header, value)
    }
    return redirectResponse
  }

  return supabaseResponse
}
