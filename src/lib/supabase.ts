// src/lib/supabase.ts
/// <reference types="vite/client" />
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

/** ---------------------------------------------------------
 * Auth helpers
 * -------------------------------------------------------- */

export async function getCurrentUser(): Promise<{
  user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']
  error: Awaited<ReturnType<typeof supabase.auth.getUser>>['error']
}> {
  const { data, error } = await supabase.auth.getUser()
  return { user: data.user, error }
}

export async function getSession(): Promise<{
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
  error: Awaited<ReturnType<typeof supabase.auth.getSession>>['error']
}> {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

/** ---------------------------------------------------------
 * RPC helpers
 * -------------------------------------------------------- */

type EnumValueRow = { value: string }

export async function getEnumValues(typeName: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_enum_values', {
    type_name: typeName
  })

  if (error) throw error

  // data can be null depending on RPC return; keep it safe
  const rows = (data ?? []) as EnumValueRow[]
  return rows.map((row) => row.value)
}

/** ---------------------------------------------------------
 * RLS note:
 * Prefer RLS policies over "queryAsUser" style filtering.
 * Keep the helpers below only if you truly need them.
 * -------------------------------------------------------- */

/**
 * Helper: Insert with user_id
 * Automatically adds current user ID to payload
 */
export async function insertAsUser<T extends Record<string, any>>(
  table: string,
  payload: T,
  userIdColumn: string = 'user_id'
) {
  const { user } = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  return supabase
    .from(table)
    .insert({
      ...payload,
      [userIdColumn]: user.id
    })
    .select()
}

/**
 * Helper: Query rows by current user id (optional utility).
 * NOTE: This was broken in your JS version because getUser() is async.
 */
export async function queryAsUser(
  table: string,
  userIdColumn: string = 'user_id'
) {
  const { user } = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  return supabase.from(table).select('*').eq(userIdColumn, user.id)
}

/** ---------------------------------------------------------
 * Error normalization
 * -------------------------------------------------------- */

export type NormalizedError = {
  code: string
  message: string
  details: any
  hint: string | null
}

export function normalizeError(error: any): NormalizedError {
  return {
    code: error?.code ?? 'UNKNOWN',
    message: error?.message ?? 'Unknown error',
    details: error?.details ?? null,
    hint: error?.hint ?? null
  }
}
