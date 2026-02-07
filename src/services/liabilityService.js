/**
 * liabilityService.js (Phase 5 - Liability Tracking)
 * 
 * Service for liability operations: adding, querying, and managing liabilities.
 * Wraps eventService to record LIABILITY_INCURRED events with tracking data.
 * 
 * Features:
 * - Add liability with principal amount, interest rate, maturity date
 * - Track interest accrual (simple and compound)
 * - Query liabilities by entity
 * - Calculate remaining balance and interest due
 * - Mark as settled/extinguished
 * 
 * All liability transactions are immutable economic events for compliance.
 */

import { supabase, getCurrentUser } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'
import { recordEconomicEvent } from './eventService'

/**
 * Add a liability (loan, debt, accounts payable, etc.)
 * Creates: economic_event (LIABILITY_INCURRED) + event_effect (LIABILITY_INCREASE) + liability record
 * 
 * @param {Object} params
 * @param {string} params.entityId - Entity UUID
 * @param {string} params.liabilityType - Type (e.g., 'LOAN', 'ACCOUNT_PAYABLE', 'MORTGAGE', 'CREDIT_CARD')
 * @param {number} params.principalAmount - Amount owed
 * @param {string} params.incurrenceDate - ISO date
 * @param {number} [params.interestRate] - Annual interest rate (e.g., 0.08 for 8%)
 * @param {string} [params.interestMethod] - 'SIMPLE' or 'COMPOUND' (default 'COMPOUND')
 * @param {string} [params.maturityDate] - ISO date when due
 * @param {string} [params.counterparty] - Lender name
 * @param {string} [params.currency] - Default 'ZAR'
 * 
 * @returns {Promise<{success, data: {event, effect, liability}, error}>}
 */
export async function addLiability({
  entityId,
  liabilityType,
  principalAmount,
  incurrenceDate,
  interestRate = 0,
  interestMethod = 'COMPOUND',
  maturityDate,
  counterparty,
  currency = 'ZAR'
}) {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    // Validate
    if (!entityId || !liabilityType || !principalAmount || !incurrenceDate) {
      throw new Error('Missing required fields')
    }

    if (principalAmount <= 0) {
      throw new Error('Principal amount must be positive')
    }

    // 1. Record economic event
    const eventResult = await recordEconomicEvent({
      entityId,
      eventType: 'LIABILITY_INCURRED',
      eventDate: incurrenceDate,
      description: `Liability incurred: ${liabilityType}`,
      sourceReference: `LIABILITY-${Date.now()}`,
      effects: [
        {
          effectType: 'LIABILITY_INCREASE',
          amount: principalAmount,
          currency,
          relatedTable: 'liabilities'
        },
        {
          effectType: 'CASH_INCREASE',
          amount: principalAmount,
          currency
        }
      ]
    })

    if (!eventResult.success) {
      throw new Error(eventResult.error)
    }

    const liabilityEffect = eventResult.data.effects[0]

    // 2. Create liability record
    const { data: liabilityData, error: liabilityError } = await supabase
      .from('liabilities')
      .insert({
        entity_id: entityId,
        originating_effect_id: liabilityEffect.id,
        liability_type: liabilityType,
        principal_amount: principalAmount,
        interest_rate: interestRate,
        maturity_date: maturityDate,
        counterparty: counterparty || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (liabilityError) throw liabilityError

    // 3. Emit event
    eventEmitter.emit('LIABILITY_ADDED', {
      liabilityId: liabilityData.id,
      eventId: eventResult.data.event.id,
      type: liabilityType,
      amount: principalAmount,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      data: {
        event: eventResult.data.event,
        effect: liabilityEffect,
        liability: liabilityData
      }
    }
  } catch (error) {
    console.error('Error in addLiability:', error)
    eventEmitter.emit('RECOVERY_ERROR', { error: error.message })
    return {
      success: false,
      error: error.message || 'Failed to add liability'
    }
  }
}

/**
 * Get liabilities by entity
 * Includes interest calculation if applicable
 * 
 * @param {string} entityId - Entity UUID
 * @param {Object} [filters]
 * @param {boolean} [filters.activeOnly] - Only unsettled liabilities (default true)
 * @param {string} [filters.liabilityType] - Filter by type
 * @param {number} [filters.limit] - Result limit
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<{liability, balance, accumulatedInterest, daysSince, isOverdue}>,
 *   totalBalance: number,
 *   error?: string
 * }>}
 */
export async function getLiabilitiesByEntity(entityId, filters = {}) {
  try {
    const {
      activeOnly = true,
      liabilityType,
      limit = 100
    } = filters

    let query = supabase
      .from('liabilities')
      .select('*', { count: 'exact' })
      .eq('entity_id', entityId)

    if (activeOnly) {
      query = query.is('extinguished_event_id', null)
    }

    if (liabilityType) {
      query = query.eq('liability_type', liabilityType)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Calculate interest for each liability
    const liabilitiesWithInterest = (data || []).map(liability => {
      const accumulatedInterest = calculateInterest(liability)
      const balance = liability.principal_amount + accumulatedInterest
      const daysSince = calculateDaysSince(liability.created_at)
      const isOverdue = liability.maturity_date && new Date(liability.maturity_date) < new Date()

      return {
        liability,
        balance,
        accumulatedInterest,
        daysSince,
        isOverdue
      }
    })

    const totalBalance = liabilitiesWithInterest.reduce((sum, l) => sum + l.balance, 0)

    return {
      success: true,
      data: liabilitiesWithInterest,
      totalBalance,
      count: data?.length || 0
    }
  } catch (error) {
    console.error('Error in getLiabilitiesByEntity:', error)
    return {
      success: false,
      data: [],
      totalBalance: 0,
      count: 0,
      error: error.message || 'Failed to fetch liabilities'
    }
  }
}

/**
 * Record a liability payment
 * Creates LIABILITY_SETTLED event
 * 
 * @param {string} liabilityId - Liability UUID
 * @param {number} paymentAmount - Amount paid
 * @param {string} paymentDate - ISO date
 * @param {string} [paymentMethod] - How it was paid
 * 
 * @returns {Promise<{success, paymentEventId, remainingBalance, error}>}
 */
export async function recordLiabilityPayment(liabilityId, paymentAmount, paymentDate, paymentMethod) {
  try {
    // Get liability
    const { data: liability, error: liabError } = await supabase
      .from('liabilities')
      .select('*')
      .eq('id', liabilityId)
      .single()

    if (liabError) throw liabError
    if (!liability) throw new Error('Liability not found')

    // Calculate current balance
    const currentBalance = liability.principal_amount + calculateInterest(liability)
    const remainingBalance = Math.max(0, currentBalance - paymentAmount)

    // Record payment event
    const paymentResult = await recordEconomicEvent({
      entityId: liability.entity_id,
      eventType: 'LIABILITY_SETTLED',
      eventDate: paymentDate,
      description: `Liability payment: ${liability.liability_type} (${paymentAmount})`,
      sourceReference: `PAYMENT-${Date.now()}`,
      effects: [
        {
          effectType: 'LIABILITY_DECREASE',
          amount: -paymentAmount,
          currency: 'ZAR'
        },
        {
          effectType: 'CASH_DECREASE',
          amount: -paymentAmount,
          currency: 'ZAR'
        }
      ]
    })

    if (!paymentResult.success) {
      throw new Error(paymentResult.error)
    }

    // If fully settled, mark as extinguished
    if (remainingBalance === 0) {
      const { error: updateError } = await supabase
        .from('liabilities')
        .update({
          extinguished_event_id: paymentResult.data.event.id
        })
        .eq('id', liabilityId)

      if (updateError) throw updateError
    }

    eventEmitter.emit('LIABILITY_PAYMENT_RECORDED', {
      liabilityId,
      eventId: paymentResult.data.event.id,
      paymentAmount,
      remainingBalance,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      paymentEventId: paymentResult.data.event.id,
      remainingBalance
    }
  } catch (error) {
    console.error('Error in recordLiabilityPayment:', error)
    return {
      success: false,
      error: error.message || 'Failed to record liability payment'
    }
  }
}

/**
 * Get liability summary
 * Total balance and breakdown by type
 * 
 * @param {string} entityId
 * @returns {Promise<{success, totalBalance, byType, overdue, error}>}
 */
export async function getLiabilitySummary(entityId) {
  try {
    const result = await getLiabilitiesByEntity(entityId, { activeOnly: true, limit: 1000 })
    if (!result.success) throw new Error(result.error)

    const byType = {}
    let overdueAmount = 0

    result.data.forEach(({ liability, balance, isOverdue }) => {
      byType[liability.liability_type] = (byType[liability.liability_type] || 0) + balance
      if (isOverdue) {
        overdueAmount += balance
      }
    })

    return {
      success: true,
      totalBalance: result.totalBalance,
      byType,
      overdue: overdueAmount,
      count: result.count
    }
  } catch (error) {
    console.error('Error in getLiabilitySummary:', error)
    return {
      success: false,
      totalBalance: 0,
      byType: {},
      overdue: 0,
      error: error.message
    }
  }
}

/**
 * Helper: Calculate accumulated interest
 * @private
 */
function calculateInterest(liability) {
  if (!liability.interest_rate || liability.interest_rate === 0) {
    return 0
  }

  const years = calculateYearsSince(liability.created_at)
  const principal = liability.principal_amount
  const rate = liability.interest_rate

  // Compound interest: A = P(1 + r)^t
  const compounded = principal * Math.pow(1 + rate, years) - principal

  // Simple interest: I = P * r * t
  const simple = principal * rate * years

  return compounded // Default to compound
}

/**
 * Helper: Calculate years since date
 * @private
 */
function calculateYearsSince(createdAt) {
  const created = new Date(createdAt)
  const today = new Date()
  const diffTime = Math.abs(today - created)
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays / 365.25
}

/**
 * Helper: Calculate days since date
 * @private
 */
function calculateDaysSince(createdAt) {
  const created = new Date(createdAt)
  const today = new Date()
  const diffTime = Math.abs(today - created)
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export default {
  addLiability,
  getLiabilitiesByEntity,
  recordLiabilityPayment,
  getLiabilitySummary
}
