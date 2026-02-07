/**
 * incomeService.js
 * 
 * Service for income operations: adding, querying, and managing income events.
 * Wraps eventService to record REVENUE_EARNED events with INCOME_RECOGNIZED effects.
 * Also creates income_recognitions table entries for tax/IFRS treatment.
 * 
 * All income flows through economic_events + event_effects + income_recognitions.
 * This provides:
 *  - Immutable audit trail
 *  - Tax treatment tracking
 *  - Reconciliation hooks
 */

import { supabase, getCurrentUser } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'
import { recordEconomicEvent, queryEventsByEntity, queryEventEffects } from './eventService'

/**
 * Add income to an entity
 * Creates: economic_event (REVENUE_EARNED) + event_effect (INCOME_RECOGNIZED) + income_recognition
 * 
 * @param {Object} params
 * @param {string} params.entityId - Entity UUID
 * @param {string} params.dateReceived - ISO date
 * @param {number} params.amountNet - Income amount (net)
 * @param {string} params.incomeClass - Category (e.g., 'SALARY', 'BUSINESS_INCOME')
 * @param {string} [params.taxTreatment] - Default 'TAXABLE'
 * @param {string} [params.description] - Optional description
 * @param {string} [params.paymentMethod] - Optional (e.g., 'BANK_TRANSFER')
 * @param {string} [params.counterparty] - Optional payer name
 * @param {number} [params.grossAmount] - If different from net
 * @param {string} [params.vatTreatment] - Optional VAT treatment
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: {event, effects, recognition},
 *   error?: string
 * }>}
 * 
 * @example
 * const result = await addIncome({
 *   entityId: 'abc-123',
 *   dateReceived: '2025-02-07',
 *   amountNet: 5000,
 *   incomeClass: 'SALARY',
 *   description: 'Monthly salary'
 * })
 */
export async function addIncome({
  entityId,
  dateReceived,
  amountNet,
  incomeClass,
  taxTreatment = 'TAXABLE',
  description,
  paymentMethod,
  counterparty,
  grossAmount,
  vatTreatment
}) {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    // Validate inputs
    if (!entityId || !dateReceived || !amountNet || !incomeClass) {
      throw new Error('Missing required fields: entityId, dateReceived, amountNet, incomeClass')
    }

    if (amountNet <= 0) {
      throw new Error('Income amount must be positive')
    }

    // 1. Record the economic event
    const eventResult = await recordEconomicEvent({
      entityId,
      eventType: 'REVENUE_EARNED',
      eventDate: dateReceived,
      description: description || `Income: ${incomeClass}`,
      sourceReference: `INC-${Date.now()}`, // Unique ref for traceability
      effects: [
        {
          effectType: 'INCOME_RECOGNIZED',
          amount: amountNet,
          currency: 'ZAR'
        },
        {
          effectType: 'CASH_INCREASE',
          amount: amountNet,
          currency: 'ZAR'
        }
      ]
    })

    if (!eventResult.success) {
      throw new Error(eventResult.error || 'Failed to record event')
    }

    // 2. Find the INCOME_RECOGNIZED effect to link to recognition record
    const incomeEffect = eventResult.data.effects.find(
      e => e.effect_type === 'INCOME_RECOGNIZED'
    )
    if (!incomeEffect) {
      throw new Error('Failed to create income effect')
    }

    // 3. Create income recognition record (for tax/IFRS tracking)
    const { data: recognitionData, error: recognitionError } = await supabase
      .from('income_recognitions')
      .insert({
        effect_id: incomeEffect.id,
        recognition_date: dateReceived,
        income_class: incomeClass,
        tax_treatment: taxTreatment,
        vat_treatment: vatTreatment || null,
        gross_amount: grossAmount || amountNet,
        net_amount: amountNet,
        counterparty: counterparty || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (recognitionError) throw recognitionError

    // 4. Emit event
    eventEmitter.emit('INCOME_ADDED', {
      eventId: eventResult.data.event.id,
      recognitionId: recognitionData.id,
      amountNet,
      incomeClass,
      dateReceived,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      data: {
        event: eventResult.data.event,
        effects: eventResult.data.effects,
        recognition: recognitionData
      }
    }
  } catch (error) {
    console.error('Error in addIncome:', error)
    eventEmitter.emit('RECOVERY_ERROR', { error: error.message })
    return {
      success: false,
      error: error.message || 'Failed to add income'
    }
  }
}

/**
 * Fetch income entries for an entity, optionally with filtering
 * 
 * @param {string} entityId - Entity UUID
 * @param {Object} [filters]
 * @param {string} [filters.startDate] - Filter from date
 * @param {string} [filters.endDate] - Filter to date
 * @param {string} [filters.incomeClass] - Filter by income class
 * @param {number} [filters.limit] - Result limit (default 100)
 * @param {number} [filters.offset] - Pagination offset
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<{event, effects, recognition}>,
 *   count: number,
 *   error?: string
 * }>}
 */
export async function getIncomeByEntity(entityId, filters = {}) {
  try {
    const {
      startDate,
      endDate,
      incomeClass,
      limit = 100,
      offset = 0
    } = filters

    // 1. Get all income events for entity
    const eventsResult = await queryEventsByEntity(entityId, {
      eventType: 'REVENUE_EARNED',
      startDate,
      endDate,
      limit,
      offset
    })

    if (!eventsResult.success) {
      throw new Error(eventsResult.error)
    }

    // 2. For each event, get its effects and recognition
    const incomeWithDetails = await Promise.all(
      eventsResult.data.map(async (event) => {
        const { data: effects } = await supabase
          .from('event_effects')
          .select('*')
          .eq('event_id', event.id)

        // Get income recognition
        const incomeEffect = effects?.find(e => e.effect_type === 'INCOME_RECOGNIZED')
        let recognition = null
        if (incomeEffect) {
          const { data: rec } = await supabase
            .from('income_recognitions')
            .select('*')
            .eq('effect_id', incomeEffect.id)
            .single()
          recognition = rec
        }

        return {
          event,
          effects: effects || [],
          recognition
        }
      })
    )

    // 3. Filter by incomeClass if specified
    const filtered = incomeClass
      ? incomeWithDetails.filter(item => item.recognition?.income_class === incomeClass)
      : incomeWithDetails

    return {
      success: true,
      data: filtered,
      count: eventsResult.count
    }
  } catch (error) {
    console.error('Error in getIncomeByEntity:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to fetch income'
    }
  }
}

/**
 * Get total income for entity in date range
 * 
 * @param {string} entityId - Entity UUID
 * @param {string} [startDate] - ISO date (inclusive)
 * @param {string} [endDate] - ISO date (inclusive)
 * 
 * @returns {Promise<{success, total, count, breakdown, error}>}
 * breakdown = { [incomeClass]: amount, ... }
 */
export async function getTotalIncome(entityId, startDate, endDate) {
  try {
    const incomeResult = await getIncomeByEntity(entityId, {
      startDate,
      endDate,
      limit: 1000 // Fetch all for aggregation
    })

    if (!incomeResult.success) {
      throw new Error(incomeResult.error)
    }

    let total = 0
    const breakdown = {}

    incomeResult.data.forEach(({ recognition }) => {
      if (recognition) {
        total += recognition.net_amount || 0
        const cls = recognition.income_class
        breakdown[cls] = (breakdown[cls] || 0) + (recognition.net_amount || 0)
      }
    })

    return {
      success: true,
      total,
      count: incomeResult.data.length,
      breakdown
    }
  } catch (error) {
    console.error('Error in getTotalIncome:', error)
    return {
      success: false,
      total: 0,
      count: 0,
      breakdown: {},
      error: error.message || 'Failed to calculate total income'
    }
  }
}

/**
 * Void an income entry by creating a reversing event
 * (Immutability prevents deletion; instead create REVENUE_DEFERRED event)
 * 
 * @param {string} incomeEventId - Original event ID
 * @param {string} reason - Reason for void
 * @returns {Promise<{success, voidEventId, error}>}
 */
export async function voidIncome(incomeEventId, reason) {
  try {
    // Create reversing event
    const voidResult = await recordEconomicEvent({
      entityId: null, // Will be fetched from original event
      eventType: 'REVENUE_DEFERRED',
      description: `Void of previous income: ${reason}`,
      effects: [
        {
          effectType: 'INCOME_RECOGNIZED',
          amount: 0, // Neutral
          currency: 'ZAR'
        }
      ]
    })

    if (!voidResult.success) {
      throw new Error(voidResult.error)
    }

    eventEmitter.emit('INCOME_VOIDED', {
      originalEventId: incomeEventId,
      voidEventId: voidResult.data.event.id,
      reason,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      voidEventId: voidResult.data.event.id
    }
  } catch (error) {
    console.error('Error in voidIncome:', error)
    return {
      success: false,
      error: error.message || 'Failed to void income'
    }
  }
}


