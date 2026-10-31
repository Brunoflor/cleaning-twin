'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Panoramica', icon: OverviewIcon },
  { href: '/admin/clienti', label: 'Clienti', icon: ClientsIcon },
  { href: '/admin/movimenti', label: 'Movimenti', icon: MovementsIcon },
]

export function AdminNav({ hrefBase = '', layout }: { hrefBase?: string; layout: 'inline' | 'bar' }) {
  const pathname = usePathname().replace(/^\/anteprima/, '') || '/'
  const itemClass =
    layout === 'bar'
      ? 'flex flex-1 flex-col items-center gap-1 px-2 py-2 text-xs font-semibold'
      : 'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold'

  return (
    <nav className={layout === 'bar' ? 'flex' : 'flex gap-1'} aria-label="Sezioni">
      {LINKS.map((link) => {
        const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={`${hrefBase}${link.href}`}
            aria-current={active ? 'page' : undefined}
            className={`${itemClass} ${active ? 'bg-teal-soft text-teal-dark' : 'text-ink-soft hover:text-ink'}`}
          >
            <Icon />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

function OverviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function ClientsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19c.6-2.8 2.7-4 5.5-4s4.9 1.2 5.5 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.2 15c2.2.2 3.6 1.3 4.3 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function MovementsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M4 7h11M4 12h16M4 17h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
