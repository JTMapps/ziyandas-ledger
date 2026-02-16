// -----------------------------------------------------------
// YearEndOrchestrator.ts
// Enterprise Orchestrator for Year-End Close (D-Suite)
// -----------------------------------------------------------

import { supabase } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'

// Shared RPC wrapper
async function rpc<T>(fn: string, params: any): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params)

  if (error) {
    console.error(`[RPC ERROR] ${fn}`, error)
    throw new Error(error.message)
  }

  return data as T
}

// Ensure auth
async function requireAuth() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('User not authenticated')
  }

  return user
}

// -----------------------------------------------------------
// Main Export
// -----------------------------------------------------------

export const YearEndOrchestrator = {
  /** -------------------------------------------------------
   * 1) Run full enterprise year-end close pipeline
   *    (MODULE 12 ORCHESTRATOR)
   * ------------------------------------------------------ */
  async runFullYearEndClose(entityId: string, year: number) {
    const user = await requireAuth()

    const closeResult = await rpc('close_financial_year_enterprise', {
      p_entity_id: entityId,
      p_year: year,
      p_user: user.id
    })

    // Notify listeners
    eventEmitter.emit('YEAR_END_COMPLETED', {
      entityId,
      year,
      result: closeResult
    })

    return closeResult
  },

  /** -------------------------------------------------------
   * 2) Only run opening balance generator
   *    (MODULE 2)
   * ------------------------------------------------------ */
  async generateOpeningBalances(entityId: string, year: number) {
    const result = await rpc<void>('generate_opening_balances', {
      p_entity_id: entityId,
      p_year: year
    })

    eventEmitter.emit('OPENING_BALANCES_CREATED', { entityId, year })
    return result
  },

  /** -------------------------------------------------------
   * 3) Run IFRS cash flow generation
   *    (MODULE 3)
   * ------------------------------------------------------ */
  async generateCashFlow(entityId: string, periodId: string) {
    const result = await rpc<string>('generate_cash_flow_indirect', {
      p_entity_id: entityId,
      p_period_id: periodId
    })

    eventEmitter.emit('CASH_FLOW_GENERATED', { entityId, periodId })

    return result
  },

  /** -------------------------------------------------------
   * 4) Run Deferred Tax Posting (IAS 12)
   *    (MODULE 7)
   * ------------------------------------------------------ */
  async postDeferredTax(entityId: string, year: number) {
    const result = await rpc<void>('post_deferred_tax_movement', {
      p_entity: entityId,
      p_year: year
    })

    eventEmitter.emit('DEFERRED_TAX_POSTED', { entityId, year })
    return result
  },

  /** -------------------------------------------------------
   * 5) Run ECL Posting (IFRS 9)
   *    (MODULE 8)
   * ------------------------------------------------------ */
  async postECLMovement(entityId: string, year: number) {
    const result = await rpc<void>('post_ecl_movement', {
      p_entity: entityId,
      p_year: year
    })

    eventEmitter.emit('ECL_POSTED', { entityId, year })
    return result
  },

  /** -------------------------------------------------------
   * 6) Force-regenerate financial statements
   *    (MODULE 4/5/6)
   * ------------------------------------------------------ */
  async rebuildStatements(snapshotId: string) {
    const result = await rpc<void>('build_financial_statements', {
      p_snapshot_id: snapshotId
    })

    eventEmitter.emit('STATEMENTS_REBUILT', { snapshotId })
    return result
  }
}
