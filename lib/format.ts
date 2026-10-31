const longDate = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const numberFormat = new Intl.NumberFormat('it-IT')

export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return iso
  return longDate.format(new Date(year, month - 1, day))
}

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** Calendar day in Europe/Rome, so a late evening entry is not stored as the next day. */
export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
