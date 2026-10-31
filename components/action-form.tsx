'use client'

import { useActionState } from 'react'
import type { ActionState } from '@/lib/actions'

export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  children: React.ReactNode
  className?: string
}) {
  const [state, formAction] = useActionState(action, {})
  return (
    <form action={formAction} className={className}>
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-clay-soft px-3 py-2 text-sm text-clay">
          {state.error}
        </p>
      ) : null}
      {children}
    </form>
  )
}
