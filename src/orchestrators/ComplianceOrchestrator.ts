// -----------------------------------------------------------
// ComplianceOrchestrator.ts
// Handles IAS 12, IFRS 9, VAT, audit access
// -----------------------------------------------------------

import { supabase } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'

// Generic RPC wrapper
async function rpc<T>(fn: string, params: any): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params)

  if (error) {
    console.error(`[RPC ERROR] ${fn}`, error)
    throw new Error(error.message)
  }

  return data as T
}

// Ensure authentication
async function requireAuth() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) throw new Error('User not authenticated')
  return user
}

// -----------------------------------------------------------
// API Surface
// -----------------------------------------------------------
export const ComplianceOrchestrator = {
  /** -------------------------------------------------------
   * IAS 12 — Post Deferred Tax Movement
   * ------------------------------------------------------ */
  async postDeferredTax(entityId: string, year: number) {
    const result = await rpc<void>('post_deferred_tax_movement', {
      p_entity: entityId,
      p_year: year
    })

    eventEmitter.emit('IAS12_DEFERRED_TAX_POSTED', { entityId, year })
    return result
  },

  /** -------------------------------------------------------
   * IFRS 9 — Post ECL Movement
   * ------------------------------------------------------ */
  async postECL(entityId: string, year: number) {
    const result = await rpc<void>('post_ecl_movement', {
      p_entity: entityId,
      p_year: year
    })

    eventEmitter.emit('IFRS9_ECL_POSTED', { entityId, year })
    return result
  },

  /** -------------------------------------------------------
   * VAT reporting (RPC generate_vat_report)
   * ------------------------------------------------------ */
  async generateVATReport(entityId: string, start: string, end: string) {
    const report = await rpc<any>('generate_vat_report', {
      p_entity_id: entityId,
      p_start: start,
      p_end: end
    })

    eventEmitter.emit('VAT_REPORT_GENERATED', { entityId, start, end })
    return report
  },

  /** -------------------------------------------------------
   * Audit Log viewer helper
   * ------------------------------------------------------ */
  async fetchAuditLog(limit = 200) {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)
    return data
  }
}
