'use client'

import { useState } from 'react'
import { ITEM_TYPES, type ItemKey, type Quantities } from '@/lib/items'

export function QuantityInputs({ defaults }: { defaults?: Partial<Quantities> }) {
  const [values, setValues] = useState<Record<ItemKey, string>>(() => {
    const initial = {} as Record<ItemKey, string>
    for (const item of ITEM_TYPES) initial[item.key] = String(defaults?.[item.key] ?? 0)
    return initial
  })

  function setValue(key: ItemKey, raw: string) {
    const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 6)
    setValues((current) => ({ ...current, [key]: digits }))
  }

  function bump(key: ItemKey, delta: number) {
    setValues((current) => {
      const next = Math.max(0, Math.min(100_000, Number(current[key] || 0) + delta))
      return { ...current, [key]: String(next) }
    })
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ITEM_TYPES.map((item) => (
        <div key={item.key} className="rounded-2xl border border-line bg-white px-3 py-2">
          <label htmlFor={item.key} className="text-sm font-medium">
            {item.label}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="h-11 w-11 rounded-xl border border-line text-lg"
              aria-label={`Diminuisci ${item.label}`}
              onClick={() => bump(item.key, -1)}
            >
              −
            </button>
            <input
              id={item.key}
              name={item.key}
              inputMode="numeric"
              autoComplete="off"
              value={values[item.key]}
              onChange={(event) => setValue(item.key, event.target.value)}
              className="h-11 w-full rounded-xl border border-line text-center text-lg font-semibold"
            />
            <button
              type="button"
              className="h-11 w-11 rounded-xl border border-line text-lg"
              aria-label={`Aumenta ${item.label}`}
              onClick={() => bump(item.key, 1)}
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
