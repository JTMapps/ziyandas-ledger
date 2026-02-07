import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

/**
 * Get current authenticated user
 * @returns {Promise<{user, session} | {user: null, session: null}>}
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Get current session
 * @returns {Promise<{session, error}>}
 */
export async function getSession() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()
  return { session, error }
}

/**
 * Typed RPC wrapper for enum values
 * @param {string} typeName - Enum type name (e.g., 'entity_type', 'expense_category')
 * @returns {Promise<Array<string>>}
 */
export async function getEnumValues(typeName) {
  const { data, error } = await supabase.rpc('get_enum_values', {
    type_name: typeName
  })
  if (error) throw error
  return data?.map(row => row.value) || []
}

/**
 * Helper: Query with RLS user_id filter
 * @param {string} table - Table name
 * @param {string} userIdColumn - Column name for user ID (default 'user_id')
 * @returns {SupabaseQueryBuilder}
 */
export function queryAsUser(table, userIdColumn = 'user_id') {
  return supabase.from(table).select().eq(userIdColumn, supabase.auth.getUser())
}

/**
 * Helper: Insert with user_id RLS
 * Automatically adds current user ID to payload
 * @param {string} table - Table name
 * @param {Object} payload - Data to insert (without user_id)
 * @param {string} userIdColumn - Column name (default 'user_id')
 * @returns {Promise<{data, error}>}
 */
export async function insertAsUser(table, payload, userIdColumn = 'user_id') {
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
 * Helper: Catch and normalize error responses
 * @param {Error} error - Supabase error
 * @returns {Object} { code, message, details }
 */
export function normalizeError(error) {
  return {
    code: error?.code || 'UNKNOWN',
    message: error?.message || 'Unknown error',
    details: error?.details || null,
    hint: error?.hint || null
  }
}
