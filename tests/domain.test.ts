import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { errorMessage, mapAuthError, successMessage } from '../lib/errors'
import { filtersToQuery, parseFilters, rangeIsBackwards, reconcileFilters } from '../lib/filters'
import { formatDate, todayISO } from '../lib/format'
import { ITEM_TYPES, totalPieces } from '../lib/items'
import { parseClientInput, parseMovementForm, parseQuantity, parseSignUp } from '../lib/validation'

const propertyId = '20000000-0000-4000-8000-000000000001'
const otherPropertyId = '20000000-0000-4000-8000-000000000003'
const clientId = '10000000-0000-4000-8000-000000000001'
const otherClientId = '10000000-0000-4000-8000-000000000002'

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.set(key, value)
  return data
}

test('item columns in the migration match the fixed list', () => {
  const sql = readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20261031120000_init.sql'),
    'utf8',
  )
  for (const item of ITEM_TYPES) {
    assert.match(sql, new RegExp(`\\b${item.key}\\b`))
  }
  assert.equal(new Set(ITEM_TYPES.map((item) => item.label)).size, ITEM_TYPES.length)
})

test('quantities reject decimals, blanks become zero, and the cap is enforced', () => {
  assert.equal(parseQuantity(''), 0)
  assert.equal(parseQuantity(' 12 '), 12)
  assert.equal(parseQuantity('0'), 0)
  assert.equal(parseQuantity('1.5'), null)
  assert.equal(parseQuantity('1,5'), null)
  assert.equal(parseQuantity('-1'), null)
  assert.equal(parseQuantity('4a'), null)
  assert.equal(parseQuantity('100001'), null)
})

test('a stock count may be zero and a delivery may not', () => {
  const base = {
    property_id: propertyId,
    movement_date: '2026-10-31',
    notes: '  piano 2  ',
  }
  const stock = parseMovementForm(form({ ...base, kind: 'stock_count' }))
  assert.equal(stock.ok, true)
  if (stock.ok) {
    assert.equal(totalPieces(stock.value.quantities), 0)
    assert.equal(stock.value.notes, 'piano 2')
  }

  const delivery = parseMovementForm(form({ ...base, kind: 'delivery', federa: '40' }))
  assert.equal(delivery.ok, true)
  if (delivery.ok) assert.equal(delivery.value.quantities.federa, 40)

  const emptyDelivery = parseMovementForm(form({ ...base, kind: 'delivery' }))
  assert.deepEqual(emptyDelivery, { ok: false, error: 'quantita_mancante' })

  const badDate = parseMovementForm(form({ ...base, kind: 'pickup', federa: '1', movement_date: '2026-02-31' }))
  assert.deepEqual(badDate, { ok: false, error: 'data' })
})

test('client input normalizes email and rejects a duplicate-looking blank name', () => {
  const parsed = parseClientInput(
    form({
      name: '  Hotel Vesuvio ',
      email: ' Maria@Hotel-Vesuvio.EXAMPLE ',
      phone: '',
      notes: '',
    }),
  )
  assert.deepEqual(parsed, {
    ok: true,
    value: {
      name: 'Hotel Vesuvio',
      email: 'maria@hotel-vesuvio.example',
      phone: null,
      notes: null,
    },
  })
  assert.deepEqual(parseClientInput(form({ name: '   ', email: 'a@b.co' })), {
    ok: false,
    error: 'nome_obbligatorio',
  })
})

test('sign-up checks the password twice', () => {
  const mismatch = parseSignUp(
    form({
      full_name: 'Maria Esposito',
      email: 'maria@hotel-vesuvio.example',
      password: 'segretissima',
      password_confirmation: 'diversa',
    }),
  )
  assert.deepEqual(mismatch, { ok: false, error: 'password_diversa' })
  const ok = parseSignUp(
    form({
      full_name: 'Maria Esposito',
      email: 'MARIA@hotel-vesuvio.example',
      password: 'segretissima',
      password_confirmation: 'segretissima',
    }),
  )
  assert.equal(ok.ok, true)
  if (ok.ok) assert.equal(ok.value.email, 'maria@hotel-vesuvio.example')
})

test('filters keep only real ids, dates, and kinds', () => {
  const filters = parseFilters({
    cliente: clientId,
    struttura: 'not-a-uuid',
    dal: '2026-10-01',
    al: '2026-02-31',
    tipo: 'giacenza',
  })
  assert.deepEqual(filters, {
    clientId,
    propertyId: undefined,
    from: '2026-10-01',
    to: undefined,
    kind: 'stock_count',
  })
  assert.equal(rangeIsBackwards({ from: '2026-10-31', to: '2026-10-01' }), true)
})

test('a property filter that belongs to another client is dropped', () => {
  const filters = reconcileFilters(
    { clientId, propertyId: otherPropertyId, kind: 'delivery' },
    [
      { id: propertyId, clientId },
      { id: otherPropertyId, clientId: otherClientId },
    ],
  )
  assert.deepEqual(filters, { clientId, propertyId: undefined, kind: 'delivery' })
  assert.equal(
    filtersToQuery('/admin/movimenti', { clientId, kind: 'pickup', from: '2026-10-01' }),
    `/admin/movimenti?cliente=${clientId}&dal=2026-10-01&tipo=ritiro`,
  )
})

test('dates format in Italian without shifting the calendar day', () => {
  assert.equal(formatDate('2026-10-31'), '31 ottobre 2026')
  assert.equal(todayISO(new Date('2026-10-31T23:30:00Z')), '2026-11-01')
  assert.equal(todayISO(new Date('2026-06-15T22:30:00Z')), '2026-06-16')
})

test('auth and success messages stay on the known list', () => {
  assert.equal(mapAuthError('Invalid login credentials'), 'credenziali')
  assert.equal(mapAuthError('Email not confirmed'), 'conferma_email')
  assert.equal(errorMessage('nope'), null)
  assert.match(successMessage('creato') ?? '', /email/i)
})
