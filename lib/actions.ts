'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchIsAdmin, getSessionUser, homePath } from '@/lib/auth'
import { ERRORS, mapAuthError, mutationError } from '@/lib/errors'
import { supabaseEnv } from '@/lib/env'
import { isUuid, parseClientInput, parseCredentials, parseMovementForm, parsePropertyInput, parseSignUp } from '@/lib/validation'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error?: string }

function refresh() {
  revalidatePath('/admin')
  revalidatePath('/admin/clienti')
  revalidatePath('/admin/movimenti')
  revalidatePath('/area')
}

type AdminDb =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: string }

async function adminDb(): Promise<AdminDb> {
  if (!supabaseEnv()) return { ok: false, error: ERRORS.configurazione }
  const supabase = await createClient()
  const user = await getSessionUser(supabase)
  if (!user) redirect('/accedi')
  if (!(await fetchIsAdmin(supabase))) redirect('/area')
  return { ok: true, supabase }
}

async function origin(): Promise<string> {
  const headerStore = await headers()
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000'
  const proto = headerStore.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseCredentials(formData)
  if (!parsed.ok) return { error: ERRORS[parsed.error] }
  if (!supabaseEnv()) return { error: ERRORS.configurazione }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.value)
  if (error) return { error: ERRORS[mapAuthError(error.message)] }
  redirect(await homePath(supabase))
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseSignUp(formData)
  if (!parsed.ok) return { error: ERRORS[parsed.error] }
  if (!supabaseEnv()) return { error: ERRORS.configurazione }
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.value.email,
    password: parsed.value.password,
    options: {
      data: { full_name: parsed.value.fullName },
      emailRedirectTo: `${await origin()}/auth/callback`,
    },
  })
  if (error) return { error: ERRORS[mapAuthError(error.message)] }
  if (data.session) redirect(await homePath(supabase))
  redirect(`/accedi?messaggio=controlla_email`)
}

export async function signOut() {
  if (supabaseEnv()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/')
}

export async function createClientRecord(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseClientInput(formData)
  if (!parsed.ok) return { error: ERRORS[parsed.error] }
  const db = await adminDb()
  if (!db.ok) return { error: db.error }
  const { data, error } = await db.supabase
    .from('clients')
    .insert(parsed.value)
    .select('id')
    .single()
  if (error) return { error: ERRORS[mutationError(error)] }
  refresh()
  redirect(`/admin/clienti/${data.id}?messaggio=creato`)
}

export async function updateClient(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isUuid(id)) return { error: ERRORS.non_trovato }
  const parsed = parseClientInput(formData)
  if (!parsed.ok) return { error: ERRORS[parsed.error] }
  const db = await adminDb()
  if (!db.ok) return { error: db.error }
  const { data, error } = await db.supabase
    .from('clients')
    .update(parsed.value)
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) return { error: ERRORS[mutationError(error)] }
  if (!data) return { error: ERRORS.non_trovato }
  refresh()
  redirect(`/admin/clienti/${id}?messaggio=aggiornato`)
}

export async function deleteClient(id: string) {
  if (!isUuid(id)) redirect('/admin/clienti?errore=non_trovato')
  const db = await adminDb()
  if (!db.ok) redirect('/admin/clienti?errore=permessi')
  const { data, error } = await db.supabase.from('clients').delete().eq('id', id).select('id').maybeSingle()
  if (error || !data) redirect('/admin/clienti?errore=salvataggio')
  refresh()
  redirect('/admin/clienti?messaggio=eliminato')
}

export async function createProperty(clientId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isUuid(clientId)) return { error: ERRORS.non_trovato }
  const parsed = parsePropertyInput(formData)
  if (!parsed.ok) return { error: ERRORS[parsed.error] }
  const db = await adminDb()
  if (!db.ok) return { error: db.error }
  const { error } = await db.supabase.from('properties').insert({ ...parsed.value, client_id: clientId })
  if (error) return { error: ERRORS[mutationError(error)] }
  refresh()
  redirect(`/admin/clienti/${clientId}?messaggio=salvato`)
}

export async function updateProperty(
  clientId: string,
  propertyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isUuid(clientId) || !isUuid(propertyId)) return { error: ERRORS.non_trovato }
  const parsed = parsePropertyInput(formData)
  if (!parsed.ok) return { error: ERRORS[parsed.error] }
  const db = await adminDb()
  if (!db.ok) return { error: db.error }
  const { data, error } = await db.supabase
    .from('properties')
    .update(parsed.value)
    .eq('id', propertyId)
    .eq('client_id', clientId)
    .select('id')
    .maybeSingle()
  if (error) return { error: ERRORS[mutationError(error)] }
  if (!data) return { error: ERRORS.non_trovato }
  refresh()
  redirect(`/admin/clienti/${clientId}?messaggio=aggiornato`)
}

export async function deleteProperty(clientId: string, propertyId: string) {
  if (!isUuid(clientId) || !isUuid(propertyId)) redirect('/admin/clienti?errore=non_trovato')
  const db = await adminDb()
  if (!db.ok) redirect(`/admin/clienti/${clientId}?errore=permessi`)
  const { error } = await db.supabase.from('properties').delete().eq('id', propertyId).eq('client_id', clientId)
  if (error) redirect(`/admin/clienti/${clientId}?errore=salvataggio`)
  refresh()
  redirect(`/admin/clienti/${clientId}?messaggio=eliminato`)
}

export async function createMovement(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseMovementForm(formData)
  if (!parsed.ok) return { error: ERRORS[parsed.error] }
  const db = await adminDb()
  if (!db.ok) return { error: db.error }
  const { error } = await db.supabase.from('movements').insert({
    property_id: parsed.value.propertyId,
    kind: parsed.value.kind,
    movement_date: parsed.value.date,
    notes: parsed.value.notes,
    ...parsed.value.quantities,
  })
  if (error) return { error: ERRORS[mutationError(error)] }
  refresh()
  redirect('/admin/movimenti?messaggio=salvato')
}

export async function updateMovement(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isUuid(id)) return { error: ERRORS.non_trovato }
  const parsed = parseMovementForm(formData)
  if (!parsed.ok) return { error: ERRORS[parsed.error] }
  const db = await adminDb()
  if (!db.ok) return { error: db.error }
  const { data, error } = await db.supabase
    .from('movements')
    .update({
      property_id: parsed.value.propertyId,
      kind: parsed.value.kind,
      movement_date: parsed.value.date,
      notes: parsed.value.notes,
      ...parsed.value.quantities,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) return { error: ERRORS[mutationError(error)] }
  if (!data) return { error: ERRORS.non_trovato }
  refresh()
  redirect('/admin/movimenti?messaggio=aggiornato')
}

export async function deleteMovement(id: string) {
  if (!isUuid(id)) redirect('/admin/movimenti?errore=non_trovato')
  const db = await adminDb()
  if (!db.ok) redirect('/admin/movimenti?errore=permessi')
  const { data, error } = await db.supabase.from('movements').delete().eq('id', id).select('id').maybeSingle()
  if (error || !data) redirect(`/admin/movimenti/${id}?errore=salvataggio`)
  refresh()
  redirect('/admin/movimenti?messaggio=eliminato')
}
