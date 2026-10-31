import Link from 'next/link'
import type { ReactNode } from 'react'
import { AdminNav } from '@/components/admin-nav'
import { Logo } from '@/components/logo'

export function Shell({
  role,
  email,
  signOut,
  hrefBase = '',
  width = 'default',
  children,
}: {
  role: 'admin' | 'client'
  email: string
  signOut?: ReactNode
  hrefBase?: string
  width?: 'default' | 'wide'
  children: ReactNode
}) {
  const home = role === 'admin' ? `${hrefBase}/admin` : `${hrefBase}/area`
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href={home} className="min-w-0">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-52 truncate text-sm text-ink-soft sm:inline">{email}</span>
            {signOut}
          </div>
        </div>
        {role === 'admin' ? (
          <div className="mx-auto hidden max-w-5xl px-4 pb-3 md:block">
            <AdminNav hrefBase={hrefBase} layout="inline" />
          </div>
        ) : null}
      </header>
      <main
        className={`mx-auto px-4 py-6 ${width === 'wide' ? 'max-w-5xl' : 'max-w-3xl'} ${role === 'admin' ? 'pb-28 md:pb-10' : 'pb-12'}`}
      >
        {children}
      </main>
      {role === 'admin' ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          <AdminNav hrefBase={hrefBase} layout="bar" />
        </div>
      ) : null}
    </div>
  )
}
