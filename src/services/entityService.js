import { supabase, getCurrentUser } from '../lib/supabase'

/* ============================================================
   GET MY ENTITIES
============================================================ */

export async function getMyEntities() {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || []
    }

  } catch (error) {
    console.error('getMyEntities error:', error)
    return {
      success: false,
      data: [],
      error: error.message
    }
  }
}

/* ============================================================
   GET FINANCIAL SNAPSHOT (READ MODEL)
============================================================ */

export async function getEntitySnapshot(entityId) {
  try {
    if (!entityId) throw new Error('Entity ID required')

    const { data, error } = await supabase
      .from('v_entity_financial_snapshot')
      .select('*')
      .eq('entity_id', entityId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (acceptable)
      throw error
    }

    return {
      success: true,
      snapshot: data || {
        entity_id: entityId,
        total_income: 0,
        total_expenses: 0,
        net_profit: 0,
        total_cash: 0,
        total_assets: 0,
        total_liabilities: 0,
        total_equity: 0,
        event_count: 0
      }
    }

  } catch (error) {
    console.error('getEntitySnapshot error:', error)
    return {
      success: false,
      snapshot: null,
      error: error.message || 'Failed to fetch entity snapshot'
    }
  }
}
