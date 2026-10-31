import type { Metadata, Viewport } from 'next'
import { Fraunces, Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' })

export const metadata: Metadata = {
  title: { default: 'Cleaning Twin', template: '%s · Cleaning Twin' },
  description: 'Gestione del noleggio biancheria per strutture ricettive.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#0f6e68',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
