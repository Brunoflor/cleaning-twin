import type { ErrorCode } from '@/lib/errors'
import {
  emptyQuantities,
  isMovementKind,
  ITEM_TYPES,
  totalPieces,
  type MovementKind,
  type Quantities,
} from '@/lib/items'

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: ErrorCode }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_QUANTITY = 100_000

export function isUuid(value: string): boolean {
  return UUID.test(value)
}

export function parseISODate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return value
}

export function parseEmail(value: unknown): string | null {
  const email = String(value ?? '').trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 200) return null
  return email
}

function text(value: unknown): string {
  return String(value ?? '').trim()
}

export function parseQuantity(value: unknown): number | null {
  const raw = text(value)
  if (raw === '') return 0
  if (!/^\d+$/.test(raw)) return null
  const quantity = Number(raw)
  if (!Number.isSafeInteger(quantity) || quantity > MAX_QUANTITY) return null
  return quantity
}

export type ClientInput = {
  name: string
  email: string
  phone: string | null
  notes: string | null
}

export function parseClientInput(formData: FormData): ParseResult<ClientInput> {
  const name = text(formData.get('name'))
  if (name.length < 1 || name.length > 200) return { ok: false, error: 'nome_obbligatorio' }
  const email = parseEmail(formData.get('email'))
  if (!email) return { ok: false, error: 'email_non_valida' }
  const phone = text(formData.get('phone'))
  if (phone.length > 40) return { ok: false, error: 'telefono' }
  const notes = text(formData.get('notes'))
  if (notes.length > 2000) return { ok: false, error: 'note' }
  return {
    ok: true,
    value: {
      name,
      email,
      phone: phone || null,
      notes: notes || null,
    },
  }
}

export type PropertyInput = {
  name: string
  address: string | null
  notes: string | null
}

export function parsePropertyInput(formData: FormData): ParseResult<PropertyInput> {
  const name = text(formData.get('name'))
  if (name.length < 1 || name.length > 200) return { ok: false, error: 'nome_obbligatorio' }
  const address = text(formData.get('address'))
  if (address.length > 300) return { ok: false, error: 'indirizzo' }
  const notes = text(formData.get('notes'))
  if (notes.length > 2000) return { ok: false, error: 'note' }
  return {
    ok: true,
    value: {
      name,
      address: address || null,
      notes: notes || null,
    },
  }
}

export type MovementInput = {
  propertyId: string
  kind: MovementKind
  date: string
  notes: string | null
  quantities: Quantities
}

export function parseMovementForm(formData: FormData): ParseResult<MovementInput> {
  const propertyId = text(formData.get('property_id'))
  if (!isUuid(propertyId)) return { ok: false, error: 'struttura' }
  const kind = text(formData.get('kind'))
  if (!isMovementKind(kind)) return { ok: false, error: 'tipo' }
  const date = parseISODate(text(formData.get('movement_date')))
  if (!date) return { ok: false, error: 'data' }
  const notes = text(formData.get('notes'))
  if (notes.length > 2000) return { ok: false, error: 'note' }

  const quantities = emptyQuantities()
  for (const item of ITEM_TYPES) {
    const quantity = parseQuantity(formData.get(item.key))
    if (quantity === null) return { ok: false, error: 'quantita_non_valida' }
    quantities[item.key] = quantity
  }
  if (kind !== 'stock_count' && totalPieces(quantities) === 0) {
    return { ok: false, error: 'quantita_mancante' }
  }

  return {
    ok: true,
    value: {
      propertyId,
      kind,
      date,
      notes: notes || null,
      quantities,
    },
  }
}

export function parseCredentials(formData: FormData): ParseResult<{ email: string; password: string }> {
  const email = parseEmail(formData.get('email'))
  if (!email) return { ok: false, error: 'email_non_valida' }
  const password = String(formData.get('password') ?? '')
  if (password.length < 8 || password.length > 72) return { ok: false, error: 'password' }
  return { ok: true, value: { email, password } }
}

export function parseSignUp(
  formData: FormData,
): ParseResult<{ fullName: string; email: string; password: string }> {
  const fullName = text(formData.get('full_name'))
  if (fullName.length < 2 || fullName.length > 200) return { ok: false, error: 'nome_obbligatorio' }
  const credentials = parseCredentials(formData)
  if (!credentials.ok) return credentials
  const confirmation = String(formData.get('password_confirmation') ?? '')
  if (confirmation !== credentials.value.password) return { ok: false, error: 'password_diversa' }
  return {
    ok: true,
    value: { fullName, email: credentials.value.email, password: credentials.value.password },
  }
}
