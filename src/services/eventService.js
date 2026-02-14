/**
 * eventService.js
 *
 * Core service for recording and querying economic events and their effects.
 * All mutations flow through this service.
 *
 * This version is aligned to the dimensional accounting model:
 *
 * event_effect_type:
 *   CASH, ASSET, LIABILITY, INCOME, EXPENSE, EQUITY
 *
 * effect_sign:
 *   +1 or -1
 */

import { supabase, getCurrentUser } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'

/* ============================================================
   RECORD ECONOMIC EVENT
============================================================ */

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

    // 1️⃣ Create economic event
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

    // 2️⃣ Insert dimensional effects
    let effectsData = []

    if (effects.length > 0) {
      const payloads = effects.map(effect => ({
        event_id: eventData.id,
        effect_type: effect.effectType, // CASH | ASSET | LIABILITY | ...
        amount: effect.amount,
        effect_sign: effect.effectSign, // +1 or -1
        created_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('event_effects')
        .insert(payloads)
        .select()

      if (error) throw error
      effectsData = data
    }

    // 3️⃣ Emit domain event
    eventEmitter.emit('ECONOMIC_EVENT_RECORDED', {
      event: eventData,
      effects: effectsData
    })

    return {
      success: true,
      data: {
        event: eventData,
        effects: effectsData
      }
    }

  } catch (error) {
    console.error('recordEconomicEvent error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/* ============================================================
   QUERY EVENTS FOR ENTITY
============================================================ */

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

    if (eventType) query = query.eq('event_type', eventType)
    if (startDate) query = query.gte('event_date', startDate)
    if (endDate) query = query.lte('event_date', endDate)

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
    console.error('queryEventsByEntity error:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message
    }
  }
}

/* ============================================================
   GET EVENT WITH EFFECTS
============================================================ */

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
    console.error('getEventWithEffects error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/* ============================================================
   SUM EFFECTS (SIGN-AWARE)
============================================================ */

export async function sumEffectsByType(entityId, effectType, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('event_effects')
      .select(`
        amount,
        effect_sign,
        economic_events!inner(entity_id, event_date)
      `)
      .eq('effect_type', effectType)
      .eq('economic_events.entity_id', entityId)

    if (error) throw error

    const filtered = (data || []).filter(row => {
      const date = row.economic_events.event_date
      if (startDate && date < startDate) return false
      if (endDate && date > endDate) return false
      return true
    })

    const total = filtered.reduce(
      (sum, row) => sum + (row.amount * row.effect_sign),
      0
    )

    return { success: true, total }

  } catch (error) {
    console.error('sumEffectsByType error:', error)
    return {
      success: false,
      total: 0,
      error: error.message
    }
  }
}
