export const ERRORS = {
  email_non_valida: 'Inserisci un indirizzo email valido.',
  email_esistente: "Questa email è già usata da un altro cliente.",
  email_registrata: "Esiste già un account con questa email. Accedi.",
  nome_obbligatorio: 'Inserisci un nome.',
  password: 'La password deve avere almeno 8 caratteri.',
  password_diversa: 'Le due password non coincidono.',
  credenziali: 'Email o password non corretti.',
  conferma_email: "Conferma l'indirizzo dalla mail che ti abbiamo inviato, poi accedi.",
  quantita_non_valida: 'Le quantità devono essere numeri interi tra 0 e 100.000.',
  quantita_mancante:
    'Indica almeno un capo per la consegna o il ritiro. La giacenza può essere tutta zero.',
  data: 'Inserisci una data valida.',
  struttura: 'Scegli una struttura.',
  tipo: 'Scegli il tipo di registrazione.',
  note: 'Le note sono troppo lunghe.',
  dati_non_validi: 'Controlla i campi: qualche valore non è accettato.',
  non_trovato: 'Questo elemento non c’è più.',
  permessi: 'Non hai il permesso di fare questa operazione.',
  salvataggio: 'Non sono riuscito a salvare. Riprova.',
  accesso: 'Accesso non riuscito. Riprova.',
  configurazione: 'Manca la configurazione di Supabase. Controlla le variabili nel file .env.local.',
  link_non_valido: 'Il link non è più valido. Prova ad accedere di nuovo.',
  telefono: 'Il telefono è troppo lungo.',
  indirizzo: "L'indirizzo è troppo lungo.",
} as const

export type ErrorCode = keyof typeof ERRORS

export const SUCCESS = {
  salvato: 'Registrazione salvata.',
  creato: "Cliente creato. Chi si registra con questa email vede le sue strutture.",
  aggiornato: 'Modifiche salvate.',
  eliminato: 'Eliminato.',
  controlla_email: "Controlla la posta e apri il link per attivare l'account. Poi accedi.",
} as const

export type SuccessCode = keyof typeof SUCCESS

export function errorMessage(code: string | undefined | null): string | null {
  if (!code || !(code in ERRORS)) return null
  return ERRORS[code as ErrorCode]
}

export function successMessage(code: string | undefined | null): string | null {
  if (!code || !(code in SUCCESS)) return null
  return SUCCESS[code as SuccessCode]
}

export function mapAuthError(message: string): ErrorCode {
  const text = message.toLowerCase()
  if (text.includes('invalid login') || text.includes('invalid credentials')) return 'credenziali'
  if (text.includes('email not confirmed')) return 'conferma_email'
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'email_registrata'
  }
  if (text.includes('password')) return 'password'
  return 'accesso'
}

export function mutationError(error: { code?: string; message?: string }): ErrorCode {
  if (error.code === '23505') return 'email_esistente'
  if (error.code === '23514' || error.code === '23502' || error.code === '22P02') return 'dati_non_validi'
  if (error.code === '42501' || error.code === 'PGRST301') return 'permessi'
  return 'salvataggio'
}
