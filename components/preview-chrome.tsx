import { Shell } from '@/components/shell'
import { buttonClass } from '@/components/ui'

export function PreviewChrome({
  role,
  email,
  children,
}: {
  role: 'admin' | 'client'
  email: string
  children: React.ReactNode
}) {
  return (
    <Shell
      role={role}
      email={email}
      hrefBase="/anteprima"
      width={role === 'admin' ? 'wide' : 'default'}
      signOut={
        <button type="button" className={buttonClass('ghost')}>
          Esci
        </button>
      }
    >
      {children}
    </Shell>
  )
}
