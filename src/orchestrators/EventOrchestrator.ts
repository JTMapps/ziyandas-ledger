// -----------------------------------------------------------
// EventOrchestrator.ts
// Enterprise-grade economic event orchestrator
// -----------------------------------------------------------

import { supabase } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'

// ----------------------------------------------
// Types
// ----------------------------------------------
export interface EconomicEventEffect {
  account_id: string
  amount: number
  effect_sign: 1 | -1
  tax_treatment?: string | null
  metadata?: Record<string, any>
}

export interface RecordEconomicEventParams {
  entityId: string
  eventType: string
  eventDate: string
  description?: string
  effects: EconomicEventEffect[]
}

// ----------------------------------------------
// RPC WRAPPER
// ----------------------------------------------
async function rpc<T>(fn: string, params: any): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params)

  if (error) {
    console.error(`[RPC ERROR] ${fn}`, error)
    throw new Error(error.message)
  }

  return data as T
}

// ----------------------------------------------
// ENSURE AUTH
// ----------------------------------------------
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

// ----------------------------------------------
// MAIN ORCHESTRATOR
// ----------------------------------------------
export const EventOrchestrator = {
  /** -------------------------------------------------------
   * Record a full economic event (atomic transaction)
   * ------------------------------------------------------ */
  async recordEconomicEvent({
    entityId,
    eventType,
    eventDate,
    description,
    effects
  }: RecordEconomicEventParams) {
    if (!entityId) throw new Error('entityId is required')
    if (!effects || effects.length < 2)
      throw new Error('At least 2 effects (debit+credit) are required')

    const user = await requireAuth()

    const eventId = await rpc<string>('record_economic_event', {
      p_user_id: user.id,
      p_entity_id: entityId,
      p_event_type: eventType,
      p_event_date: eventDate,
      p_description: description ?? null,
      p_effects: effects
    })

    // Notify UI
    eventEmitter.emit('ECONOMIC_EVENT_RECORDED', { eventId })

    return eventId
  }
}
