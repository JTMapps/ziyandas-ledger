/**
 * expenseService.js
 * 
 * Service for expense operations: adding, querying, and managing expense events.
 * Wraps eventService to record EXPENSE_INCURRED events with EXPENSE_RECOGNIZED effects.
 * Also creates expense_recognitions table entries for SARS/tax treatment.
 * 
 * All expenses flow through economic_events + event_effects + expense_recognitions.
 * Tracks:
 *  - Amount and date
 *  - Tax deductibility status
 *  - SARS deduction category
 *  - Payment method
 */

import { supabase, getCurrentUser } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'
import { recordEconomicEvent, queryEventsByEntity } from './eventService'

/**
 * Add an expense to an entity
 * Creates: economic_event (EXPENSE_INCURRED) + event_effect (EXPENSE_RECOGNIZED) + expense_recognition
 * 
 * @param {Object} params
 * @param {string} params.entityId - Entity UUID
 * @param {string} params.dateSpent - ISO date
 * @param {number} params.amount - Expense amount
 * @param {string} params.category - Expense category (e.g., 'OFFICE_SUPPLIES', 'TRAVEL')
 * @param {boolean} [params.isTaxDeductible] - Default false
 * @param {string} [params.sarsCategory] - SARS deduction category
 * @param {string} [params.deductionTiming] - 'IMMEDIATE' or 'CAPITALIZED' (default 'IMMEDIATE')
 * @param {string} [params.description] - Optional description
 * @param {string} [params.paymentMethod] - Optional (e.g., 'CREDIT_CARD', 'CASH')
 * @param {string} [params.purpose] - Optional business purpose
 * @param {string} [params.notes] - Optional notes
 * @param {string} [params.pdfUrl] - Optional PDF receipt URL
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: {event, effects, recognition},
 *   error?: string
 * }>}
 * 
 * @example
 * const result = await addExpense({
 *   entityId: 'abc-123',
 *   dateSpent: '2025-02-07',
 *   amount: 150,
 *   category: 'OFFICE_SUPPLIES',
 *   isTaxDeductible: true,
 *   sarsCategory: 'S23(d)',
 *   description: 'Stationery and office supplies'
 * })
 */
export async function addExpense({
  entityId,
  dateSpent,
  amount,
  category,
  isTaxDeductible = false,
  sarsCategory,
  deductionTiming = 'IMMEDIATE',
  description,
  paymentMethod,
  purpose,
  notes,
  pdfUrl
}) {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    // Validate inputs
    if (!entityId || !dateSpent || !amount || !category) {
      throw new Error('Missing required fields: entityId, dateSpent, amount, category')
    }

    if (amount <= 0) {
      throw new Error('Expense amount must be positive')
    }

    // 1. Record the economic event
    const eventResult = await recordEconomicEvent({
      entityId,
      eventType: 'EXPENSE_INCURRED',
      eventDate: dateSpent,
      description: description || `Expense: ${category}`,
      sourceReference: `EXP-${Date.now()}`,
      effects: [
        {
          effectType: 'EXPENSE_RECOGNIZED',
          amount: -amount, // Negative because it's a cost
          currency: 'ZAR'
        },
        {
          effectType: 'CASH_DECREASE',
          amount: -amount,
          currency: 'ZAR'
        }
      ]
    })

    if (!eventResult.success) {
      throw new Error(eventResult.error || 'Failed to record event')
    }

    // 2. Find the EXPENSE_RECOGNIZED effect
    const expenseEffect = eventResult.data.effects.find(
      e => e.effect_type === 'EXPENSE_RECOGNIZED'
    )
    if (!expenseEffect) {
      throw new Error('Failed to create expense effect')
    }

    // 3. Create expense recognition record (for SARS/tax tracking)
    const { data: recognitionData, error: recognitionError } = await supabase
      .from('expense_recognitions')
      .insert({
        effect_id: expenseEffect.id,
        recognition_date: dateSpent,
        expense_nature: category,
        sars_category: sarsCategory || null,
        deductible: isTaxDeductible,
        deduction_timing: deductionTiming,
        amount: amount,
        purpose: purpose || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (recognitionError) throw recognitionError

    // 4. Emit event
    eventEmitter.emit('EXPENSE_ADDED', {
      eventId: eventResult.data.event.id,
      recognitionId: recognitionData.id,
      amount,
      category,
      dateSpent,
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
    console.error('Error in addExpense:', error)
    eventEmitter.emit('RECOVERY_ERROR', { error: error.message })
    return {
      success: false,
      error: error.message || 'Failed to add expense'
    }
  }
}

/**
 * Fetch expense entries for an entity with optional filtering
 * 
 * @param {string} entityId - Entity UUID
 * @param {Object} [filters]
 * @param {string} [filters.startDate] - Filter from date
 * @param {string} [filters.endDate] - Filter to date
 * @param {string} [filters.category] - Filter by category
 * @param {boolean} [filters.deductibleOnly] - Only tax-deductible
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
export async function getExpenseByEntity(entityId, filters = {}) {
  try {
    const {
      startDate,
      endDate,
      category,
      deductibleOnly,
      limit = 100,
      offset = 0
    } = filters

    // 1. Get all expense events for entity
    const eventsResult = await queryEventsByEntity(entityId, {
      eventType: 'EXPENSE_INCURRED',
      startDate,
      endDate,
      limit,
      offset
    })

    if (!eventsResult.success) {
      throw new Error(eventsResult.error)
    }

    // 2. For each event, get its effects and recognition
    const expenseWithDetails = await Promise.all(
      eventsResult.data.map(async (event) => {
        const { data: effects } = await supabase
          .from('event_effects')
          .select('*')
          .eq('event_id', event.id)

        // Get expense recognition
        const expenseEffect = effects?.find(e => e.effect_type === 'EXPENSE_RECOGNIZED')
        let recognition = null
        if (expenseEffect) {
          const { data: rec } = await supabase
            .from('expense_recognitions')
            .select('*')
            .eq('effect_id', expenseEffect.id)
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

    // 3. Apply filters
    let filtered = expenseWithDetails
    if (category) {
      filtered = filtered.filter(item => item.recognition?.expense_nature === category)
    }
    if (deductibleOnly) {
      filtered = filtered.filter(item => item.recognition?.deductible === true)
    }

    return {
      success: true,
      data: filtered,
      count: eventsResult.count
    }
  } catch (error) {
    console.error('Error in getExpenseByEntity:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to fetch expenses'
    }
  }
}

/**
 * Get total expenses for entity in date range
 * Optionally breakdown by category
 * 
 * @param {string} entityId - Entity UUID
 * @param {string} [startDate] - ISO date (inclusive)
 * @param {string} [endDate] - ISO date (inclusive)
 * 
 * @returns {Promise<{
 *   success,
 *   total,
 *   deductible,
 *   nonDeductible,
 *   breakdown,
 *   error
 * }>}
 */
export async function getTotalExpense(entityId, startDate, endDate) {
  try {
    const expenseResult = await getExpenseByEntity(entityId, {
      startDate,
      endDate,
      limit: 1000
    })

    if (!expenseResult.success) {
      throw new Error(expenseResult.error)
    }

    let total = 0
    let deductible = 0
    let nonDeductible = 0
    const breakdown = {}

    expenseResult.data.forEach(({ recognition }) => {
      if (recognition) {
        const amount = recognition.amount || 0
        total += amount

        if (recognition.deductible) {
          deductible += amount
        } else {
          nonDeductible += amount
        }

        const cat = recognition.expense_nature
        breakdown[cat] = (breakdown[cat] || 0) + amount
      }
    })

    return {
      success: true,
      total,
      deductible,
      nonDeductible,
      count: expenseResult.data.length,
      breakdown
    }
  } catch (error) {
    console.error('Error in getTotalExpense:', error)
    return {
      success: false,
      total: 0,
      deductible: 0,
      nonDeductible: 0,
      count: 0,
      breakdown: {},
      error: error.message || 'Failed to calculate total expenses'
    }
  }
}

/**
 * Get expenses grouped by category
 * 
 * @param {string} entityId - Entity UUID
 * @param {string} [startDate] - ISO date (inclusive)
 * @param {string} [endDate] - ISO date (inclusive)
 * 
 * @returns {Promise<{success, categories, error}>}
 * categories = [
 *   {category, amount, count, deductible},
 *   ...
 * ]
 */
export async function getExpensesByCategory(entityId, startDate, endDate) {
  try {
    const expenseResult = await getExpenseByEntity(entityId, {
      startDate,
      endDate,
      limit: 1000
    })

    if (!expenseResult.success) {
      throw new Error(expenseResult.error)
    }

    const categorized = {}

    expenseResult.data.forEach(({ recognition }) => {
      if (recognition) {
        const cat = recognition.expense_nature
        if (!categorized[cat]) {
          categorized[cat] = {
            category: cat,
            amount: 0,
            count: 0,
            deductible: 0,
            nonDeductible: 0
          }
        }
        const amount = recognition.amount || 0
        categorized[cat].amount += amount
        categorized[cat].count += 1
        if (recognition.deductible) {
          categorized[cat].deductible += amount
        } else {
          categorized[cat].nonDeductible += amount
        }
      }
    })

    const categories = Object.values(categorized).sort((a, b) => b.amount - a.amount)

    return {
      success: true,
      categories
    }
  } catch (error) {
    console.error('Error in getExpensesByCategory:', error)
    return {
      success: false,
      categories: [],
      error: error.message || 'Failed to categorize expenses'
    }
  }
}

/**
 * Void an expense entry by creating a reversing event
 * 
 * @param {string} expenseEventId - Original event ID
 * @param {string} reason - Reason for void
 * @returns {Promise<{success, voidEventId, error}>}
 */
export async function voidExpense(expenseEventId, reason) {
  try {
    // Create reversing event
    const voidResult = await recordEconomicEvent({
      entityId: null,
      eventType: 'PREPAID_EXPENSE_AMORTIZED',
      description: `Void of previous expense: ${reason}`,
      effects: [
        {
          effectType: 'EXPENSE_RECOGNIZED',
          amount: 0,
          currency: 'ZAR'
        }
      ]
    })

    if (!voidResult.success) {
      throw new Error(voidResult.error)
    }

    eventEmitter.emit('EXPENSE_VOIDED', {
      originalEventId: expenseEventId,
      voidEventId: voidResult.data.event.id,
      reason,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      voidEventId: voidResult.data.event.id
    }
  } catch (error) {
    console.error('Error in voidExpense:', error)
    return {
      success: false,
      error: error.message || 'Failed to void expense'
    }
  }
}

export default {
  addExpense,
  getExpenseByEntity,
  getTotalExpense,
  getExpensesByCategory,
  voidExpense
}
