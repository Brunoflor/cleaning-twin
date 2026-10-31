import type { ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'quiet'

const button =
  'inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'

export function buttonClass(variant: ButtonVariant = 'primary'): string {
  if (variant === 'primary') return `${button} bg-teal text-white hover:bg-teal-dark`
  if (variant === 'danger') return `${button} bg-clay-soft text-clay hover:bg-clay hover:text-white`
  if (variant === 'quiet') return `${button} bg-sand text-ink hover:bg-line`
  return `${button} text-ink-soft hover:bg-sand hover:text-ink`
}

export const controlClass =
  'mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base text-ink outline-none placeholder:text-ink-soft focus:border-teal focus:ring-2 focus:ring-teal/20'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line bg-card p-4 shadow-[0_1px_0_rgba(28,36,48,0.04)] ${className}`}>
      {children}
    </section>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-teal uppercase">{eyebrow}</p> : null}
        <h1 className="font-serif text-3xl tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-soft">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Flash({ error, message }: { error?: string | null; message?: string | null }) {
  if (!error && !message) return null
  const problem = Boolean(error)
  return (
    <p
      role={problem ? 'alert' : 'status'}
      className={`mb-4 rounded-2xl px-3 py-2 text-sm ${problem ? 'bg-clay-soft text-clay' : 'bg-teal-soft text-teal-dark'}`}
    >
      {error ?? message}
    </p>
  )
}

export function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  autoComplete,
  hint,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string | null
  autoComplete?: string
  hint?: string
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input
        className={controlClass}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ''}
        autoComplete={autoComplete}
      />
      {hint ? <span className="mt-1 block font-normal text-ink-soft">{hint}</span> : null}
    </label>
  )
}

export function TextArea({
  label,
  name,
  defaultValue,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string | null
  hint?: string
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <textarea
        className={`${controlClass} min-h-24 resize-y`}
        name={name}
        defaultValue={defaultValue ?? ''}
        maxLength={2000}
      />
      {hint ? <span className="mt-1 block font-normal text-ink-soft">{hint}</span> : null}
    </label>
  )
}
