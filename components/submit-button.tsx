'use client'

import { useFormStatus } from 'react-dom'
import { buttonClass, type ButtonVariant } from '@/components/ui'

export function SubmitButton({
  children,
  variant = 'primary',
  pendingLabel = 'Salvataggio…',
}: {
  children: React.ReactNode
  variant?: ButtonVariant
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant)}>
      {pending ? pendingLabel : children}
    </button>
  )
}

export function ConfirmButton({
  children,
  message,
  variant = 'danger',
}: {
  children: React.ReactNode
  message: string
  variant?: ButtonVariant
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass(variant)}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault()
      }}
    >
      {pending ? 'Attendere…' : children}
    </button>
  )
}
