import { QuantityInputs } from '@/components/quantity-inputs'
import { controlClass, TextArea } from '@/components/ui'
import { KIND_META, MOVEMENT_KINDS, type MovementKind, type Quantities } from '@/lib/items'
import type { PropertyOption } from '@/lib/types'

export function MovementFields({
  properties,
  defaults,
}: {
  properties: PropertyOption[]
  defaults?: {
    propertyId?: string
    kind?: MovementKind
    date?: string
    notes?: string | null
    quantities?: Quantities
  }
}) {
  const groups = new Map<string, PropertyOption[]>()
  for (const property of properties) {
    const list = groups.get(property.clientName) ?? []
    list.push(property)
    groups.set(property.clientName, list)
  }
  const kind = defaults?.kind ?? 'delivery'

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tipo</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {MOVEMENT_KINDS.map((value) => (
            <label key={value} className="block">
              <input
                type="radio"
                name="kind"
                value={value}
                defaultChecked={kind === value}
                className="peer sr-only"
                required
              />
              <span className="block cursor-pointer rounded-2xl border border-line bg-white px-3 py-3 peer-checked:border-teal peer-checked:bg-teal-soft peer-focus-visible:ring-2 peer-focus-visible:ring-teal">
                <span className="block text-sm font-semibold">{KIND_META[value].label}</span>
                <span className="mt-1 block text-xs leading-5 font-normal text-ink-soft">
                  {KIND_META[value].description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium">
        Struttura
        <select
          name="property_id"
          required
          defaultValue={defaults?.propertyId ?? ''}
          className={controlClass}
        >
          <option value="">Scegli una struttura</option>
          {[...groups.entries()].map(([clientName, list]) => (
            <optgroup key={clientName} label={clientName}>
              {list.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Data
        <input
          type="date"
          name="movement_date"
          required
          defaultValue={defaults?.date ?? ''}
          className={controlClass}
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium">Quantità</p>
        <p className="mb-3 text-sm leading-6 text-ink-soft">
          La giacenza è un conteggio fatto a mano e può essere tutta zero. Una consegna o un ritiro
          deve avere almeno un capo.
        </p>
        <QuantityInputs defaults={defaults?.quantities} />
      </div>

      <TextArea label="Note" name="notes" defaultValue={defaults?.notes} hint="Opzionale." />
    </div>
  )
}
