// -----------------------------------------------------------
// StatementOrchestrator.ts
// Enterprise-grade orchestration for building & rendering
// financial statements (SOFP, P&L, OCI, CF).
// -----------------------------------------------------------

import { supabase } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'

// -----------------------------------------------------------
// RPC Wrapper
// -----------------------------------------------------------
async function rpc<T>(fn: string, params: any): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params)

  if (error) {
    console.error(`[RPC ERROR] ${fn}`, error)
    throw new Error(error.message)
  }

  return data as T
}

// -----------------------------------------------------------
// Ensure authentication
// -----------------------------------------------------------
async function requireAuth() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) throw new Error('User not authenticated')

  return user
}

// -----------------------------------------------------------
// Public API
// -----------------------------------------------------------
export const StatementOrchestrator = {
  /** -------------------------------------------------------
   * Create a new snapshot (DRAFT)
   * ------------------------------------------------------ */
  async createSnapshot(entityId: string, periodId: string, statementType: string) {
    const user = await requireAuth()

    const { data, error } = await supabase
      .from('financial_statement_snapshots')
      .insert([
        {
          entity_id: entityId,
          reporting_period_id: periodId,
          statement_type: statementType,
          snapshot_type: 'DRAFT',
          financial_year: null, // backend may override
          generated_at: new Date().toISOString()
        }
      ])
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    const snapshotId = data.id

    eventEmitter.emit('SNAPSHOT_CREATED', { snapshotId, statementType })

    return snapshotId
  },

  /** -------------------------------------------------------
   * Build ALL lines for a snapshot (SOFP / P&L / OCI / CF)
   * Uses backend module build_financial_statements()
   * ------------------------------------------------------ */
  async rebuildSnapshot(snapshotId: string) {
    await rpc<void>('build_financial_statements', {
      p_snapshot_id: snapshotId
    })

    eventEmitter.emit('STATEMENT_REBUILT', { snapshotId })
  },

  /** -------------------------------------------------------
   * Render statement (RPC render_financial_statement)
   * Returns snapshot_id (uuid)
   * ------------------------------------------------------ */
  async renderStatement(entityId: string, periodId: string, statementType: string) {
    const snapshotId = await rpc<string>('render_financial_statement', {
      p_entity_id: entityId,
      p_period_id: periodId,
      p_statement_type: statementType
    })

    eventEmitter.emit('STATEMENT_RENDERED', { snapshotId, statementType })
    return snapshotId
  },

  /** -------------------------------------------------------
   * Load statement lines for UI
   * ------------------------------------------------------ */
  async getStatementLines(snapshotId: string) {
    const { data, error } = await supabase
      .from('financial_statement_lines')
      .select('*')
      .eq('snapshot_id', snapshotId)
      .order('display_order')

    if (error) throw new Error(error.message)

    return data
  },

  /** -------------------------------------------------------
   * Mark snapshot FINAL
   * ------------------------------------------------------ */
  async finalizeSnapshot(snapshotId: string) {
    const { error } = await supabase
      .from('financial_statement_snapshots')
      .update({ snapshot_type: 'FINAL' })
      .eq('id', snapshotId)

    if (error) throw new Error(error.message)

    eventEmitter.emit('SNAPSHOT_FINALIZED', { snapshotId })
  }
}
