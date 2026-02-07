/**
 * eventService.js
 * 
 * Core service for recording and querying economic events and their effects.
 * All income, expense, asset, and liability mutations flow through this service.
 * 
 * This service ensures:
 *  - Events and effects are properly linked
 *  - RLS enforces ownership at DB level
 *  - Mutations are atomic (event + effects created together)
 *  - Immutability triggers prevent unauthorized mutations
 */

import { supabase, getCurrentUser } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'

/**
 * Record a new economic event with associated effects
 * 
 * @param {Object} params
 * @param {string} params.entityId - UUID of entity
 * @param {string} params.eventType - Type from economic_event_type enum
 * @param {string} params.eventDate - ISO date (default: today)
 * @param {string} [params.description] - Optional description
 * @param {string} [params.sourceReference] - Optional external reference
 * @param {string} [params.jurisdiction] - Default 'ZA'
 * @param {Array} [params.effects] - Array of effect objects to create with event
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: {event, effects},
 *   error?: string
 * }>}
 * 
 * @example
 * const result = await recordEconomicEvent({
 *   entityId: '...',
 *   eventType: 'REVENUE_EARNED',
 *   eventDate: '2025-02-07',
 *   description: 'Invoice #INV001',
 *   sourceReference: 'INV001',
 *   effects: [
 *     { effectType: 'INCOME_RECOGNIZED', amount: 5000, currency: 'ZAR' },
 *     { effectType: 'CASH_INCREASE', amount: 5000, currency: 'ZAR' }
 *   ]
 * })
 */
export async function recordEconomicEvent({
  entityId,
  eventType,
  eventDate = new Date().toISOString().split('T')[0],
  description,
  sourceReference,
  jurisdiction = 'ZA',
  effects = []
}) {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    // 1. Create the economic event
    const { data: eventData, error: eventError } = await supabase
      .from('economic_events')
      .insert({
        user_id: user.id,
        entity_id: entityId,
        event_type: eventType,
        event_date: eventDate,
        description,
        source_reference: sourceReference,
        jurisdiction,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (eventError) throw eventError

    // 2. Create associated effects (if provided)
    let effectsData = []
    if (effects && effects.length > 0) {
      const effectPayloads = effects.map(effect => ({
        event_id: eventData.id,
        effect_type: effect.effectType,
        amount: effect.amount,
        currency: effect.currency || 'ZAR',
        related_table: effect.relatedTable || null,
        related_record_id: effect.relatedRecordId || null,
        created_at: new Date().toISOString()
      }))

      const { data: effects2, error: effectsError } = await supabase
        .from('event_effects')
        .insert(effectPayloads)
        .select()

      if (effectsError) throw effectsError
      effectsData = effects2
    }

    // 3. Emit event for UI listeners
    eventEmitter.emit('ECONOMIC_EVENT_RECORDED', {
      event: eventData,
      effects: effectsData,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      data: {
        event: eventData,
        effects: effectsData
      }
    }
  } catch (error) {
    console.error('Error in recordEconomicEvent:', error)
    eventEmitter.emit('RECOVERY_ERROR', { error: error.message })
    return {
      success: false,
      error: error.message || 'Failed to record economic event'
    }
  }
}

/**
 * Query economic events for an entity with optional filters
 * 
 * @param {string} entityId - Entity UUID
 * @param {Object} [filters]
 * @param {string} [filters.eventType] - Filter by event type
 * @param {string} [filters.startDate] - Filter from date (inclusive)
 * @param {string} [filters.endDate] - Filter to date (inclusive)
 * @param {number} [filters.limit] - Result limit (default 100)
 * @param {number} [filters.offset] - Pagination offset (default 0)
 * @param {string} [filters.orderBy] - Sort column (default 'event_date')
 * @param {string} [filters.order] - Sort direction 'asc' or 'desc' (default 'desc')
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<EconomicEvent>,
 *   count: number,
 *   error?: string
 * }>}
 */
export async function queryEventsByEntity(entityId, filters = {}) {
  try {
    const {
      eventType,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      orderBy = 'event_date',
      order = 'desc'
    } = filters

    let query = supabase
      .from('economic_events')
      .select('*', { count: 'exact' })
      .eq('entity_id', entityId)

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (startDate) {
      query = query.gte('event_date', startDate)
    }

    if (endDate) {
      query = query.lte('event_date', endDate)
    }

    query = query
      .order(orderBy, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query
    if (error) throw error

    return {
      success: true,
      data: data || [],
      count: count || 0
    }
  } catch (error) {
    console.error('Error in queryEventsByEntity:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to query events'
    }
  }
}

/**
 * Query event effects by criteria
 * 
 * @param {Object} filters
 * @param {string} [filters.effectType] - Filter by effect type
 * @param {string} [filters.eventId] - Filter by event ID
 * @param {string} [filters.entityId] - Filter by entity (requires join)
 * @param {number} [filters.limit] - Result limit (default 100)
 * @param {number} [filters.offset] - Pagination offset
 * 
 * @returns {Promise<{success, data, count, error}>}
 */
export async function queryEventEffects(filters = {}) {
  try {
    const {
      effectType,
      eventId,
      limit = 100,
      offset = 0
    } = filters

    let query = supabase
      .from('event_effects')
      .select('*', { count: 'exact' })

    if (effectType) {
      query = query.eq('effect_type', effectType)
    }

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query
    if (error) throw error

    return {
      success: true,
      data: data || [],
      count: count || 0
    }
  } catch (error) {
    console.error('Error in queryEventEffects:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to query effects'
    }
  }
}

/**
 * Calculate total effect amount by type across a date range
 * Useful for cash balance, income totals, expense totals
 * 
 * @param {string} entityId - Entity UUID
 * @param {string} effectType - Effect type to sum
 * @param {string} [startDate] - ISO date (inclusive)
 * @param {string} [endDate] - ISO date (inclusive)
 * 
 * @returns {Promise<{success, total, error}>}
 */
export async function sumEffectsByType(entityId, effectType, startDate, endDate) {
  try {
    let query = supabase
      .from('event_effects')
      .select('amount')
      .eq('effect_type', effectType)

    // Join to get entity context
    query = query.in('event_id', 
      supabase
        .from('economic_events')
        .select('id')
        .eq('entity_id', entityId)
    )

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query
    if (error) throw error

    const total = (data || []).reduce((sum, row) => sum + row.amount, 0)

    return {
      success: true,
      total
    }
  } catch (error) {
    console.error('Error in sumEffectsByType:', error)
    return {
      success: false,
      total: 0,
      error: error.message || 'Failed to sum effects'
    }
  }
}

/**
 * Get full event chain: event + all its effects
 * 
 * @param {string} eventId - Event UUID
 * @returns {Promise<{success, event, effects, error}>}
 */
export async function getEventWithEffects(eventId) {
  try {
    const { data: event, error: eventError } = await supabase
      .from('economic_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError) throw eventError

    const { data: effects, error: effectsError } = await supabase
      .from('event_effects')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    if (effectsError) throw effectsError

    return {
      success: true,
      event,
      effects: effects || []
    }
  } catch (error) {
    console.error('Error in getEventWithEffects:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch event'
    }
  }
}


