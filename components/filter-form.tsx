'use client'

import { useState } from 'react'
import type { Filters } from '@/lib/filters'
import type { ClientOption, PropertyOption } from '@/lib/types'
import { buttonClass, controlClass } from '@/components/ui'

export function FilterForm({
  action,
  filters,
  clients,
  properties,
}: {
  action: string
  filters: Filters
  clients: ClientOption[]
  properties: PropertyOption[]
}) {
  const [clientId, setClientId] = useState(filters.clientId ?? '')
  const [propertyId, setPropertyId] = useState(filters.propertyId ?? '')
  const visible = clientId ? properties.filter((property) => property.clientId === clientId) : properties

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {filters.kind ? <input type="hidden" name="tipo" value={filters.kind === 'delivery' ? 'consegna' : filters.kind === 'pickup' ? 'ritiro' : 'giacenza'} /> : null}
      <label className="block text-sm font-medium">
        Cliente
        <select
          name="cliente"
          value={clientId}
          className={controlClass}
          onChange={(event) => {
            const next = event.target.value
            setClientId(next)
            const allowed = properties.filter((property) => !next || property.clientId === next)
            if (!allowed.some((property) => property.id === propertyId)) setPropertyId('')
          }}
        >
          <option value="">Tutti i clienti</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Struttura
        <select
          name="struttura"
          value={propertyId}
          className={controlClass}
          onChange={(event) => setPropertyId(event.target.value)}
        >
          <option value="">Tutte le strutture</option>
          {visible.map((property) => (
            <option key={property.id} value={property.id}>
              {property.clientName} — {property.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Dal
        <input type="date" name="dal" defaultValue={filters.from ?? ''} className={controlClass} />
      </label>
      <label className="block text-sm font-medium">
        Al
        <input type="date" name="al" defaultValue={filters.to ?? ''} className={controlClass} />
      </label>
      <div className="flex items-end">
        <button type="submit" className={`${buttonClass('primary')} w-full`}>
          Applica filtri
        </button>
      </div>
    </form>
  )
}
