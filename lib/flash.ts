import { errorMessage, successMessage } from '@/lib/errors'

export type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function flashFrom(params: SearchParams) {
  return {
    error: errorMessage(first(params.errore)),
    message: successMessage(first(params.messaggio)),
  }
}
