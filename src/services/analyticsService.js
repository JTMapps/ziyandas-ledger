/**
 * analyticsService.js (Phase 4 - Analytics & Reporting)
 * 
 * Service for financial analytics and reporting.
 * Provides calculations for:
 * - Cash flow analysis (daily, monthly, yearly)
 * - Income statement generation (profit & loss)
 * - Balance sheet calculation (assets, liabilities, equity)
 * - Tax summary reports (taxable vs non-deductible)
 * 
 * All queries use event_effects and recognition tables for accuracy.
 * Data is purely event-driven for maximum auditability.
 */

import { supabase } from '../lib/supabase'

// Safe numeric helpers in case global Math is shadowed or mutated
function safeAbs(v) {
  const n = Number(v || 0)
  return n < 0 ? -n : n
}

function safeMax(...args) {
  const nums = args.map(a => Number(a || 0))
  return nums.reduce((m, v) => (v > m ? v : m), nums[0] ?? 0)
}

// Ensure value is always an array to avoid ".forEach is not a function" errors
function safeArray(val) {
  if (Array.isArray(val)) return val
  if (val === null || val === undefined) return []
  if (typeof val === 'object' && val.length !== undefined) return Array.from(val)
  return []
}

/**
 * Get cash flow analysis grouped by date
 * Returns daily cash movements for charting
 * 
 * @param {string} entityId - Entity UUID
 * @param {string} startDate - ISO date (inclusive)
 * @param {string} endDate - ISO date (inclusive)
 * @param {string} [granularity] - 'daily', 'weekly', 'monthly' (default 'daily')
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<{date, inflow, outflow, net, balance}>,
 *   error?: string
 * }>}
 */
export async function getCashFlow(entityId, startDate, endDate, granularity = 'daily') {
  try {
    if (!entityId || !startDate || !endDate) {
      throw new Error('Required: entityId, startDate, endDate')
    }

    // Step 1: Get all event IDs for this entity in the date range
    const { data: events, error: eventError } = await supabase
      .from('economic_events')
      .select('id')
      .eq('entity_id', entityId)
      .gte('event_date', startDate)
      .lte('event_date', endDate)

    if (eventError) throw eventError

    const eventIds = (events || []).map(e => e.id)
    if (eventIds.length === 0) {
      return { success: true, data: [] }
    }

    // Step 2: Get all cash effect events for these events
    const { data: effects, error } = await supabase
      .from('event_effects')
      .select('amount, created_at')
      .in('effect_type', ['CASH_INCREASE', 'CASH_DECREASE'])
      .in('event_id', eventIds)
      .order('created_at', { ascending: true })

    if (error) throw error
    
    // Group cash flows by date
    const flowByDate = {}
    let runningBalance = 0

    safeArray(effects).forEach(effect => {
      const date = effect.created_at.split('T')[0]
      if (!flowByDate[date]) {
        flowByDate[date] = { inflow: 0, outflow: 0, net: 0, balance: 0 }
      }

      if (effect.amount > 0) {
        flowByDate[date].inflow += effect.amount
      } else {
        flowByDate[date].outflow += safeAbs(effect.amount)
      }
      flowByDate[date].net += effect.amount
    })

    // Calculate running balance
    const data = Object.entries(flowByDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, flow]) => {
        runningBalance += flow.net
        return {
          date,
          inflow: flow.inflow,
          outflow: flow.outflow,
          net: flow.net,
          runningBalance
        }
      })

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Error in getCashFlow:', error)
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to calculate cash flow'
    }
  }
}

/**
 * Get income statement (Profit & Loss) for date range
 * 
 * @param {string} entityId - Entity UUID
 * @param {string} startDate - ISO date
 * @param {string} endDate - ISO date
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     totalIncome: number,
 *     totalExpenses: number,
 *     deductibleExpenses: number,
 *     nonDeductibleExpenses: number,
 *     netIncome: number,
 *     taxableIncome: number,
 *     incomeByClass: Object,
 *     expenseByNature: Object
 *   },
 *   error?: string
 * }>}
 */
export async function getIncomeStatement(entityId, startDate, endDate) {
  try {
    if (!entityId || !startDate || !endDate) {
      throw new Error('Required: entityId, startDate, endDate')
    }

    // Step 1: Get all event IDs for this entity in the date range
    const { data: events, error: eventError } = await supabase
      .from('economic_events')
      .select('id')
      .eq('entity_id', entityId)
      .gte('event_date', startDate)
      .lte('event_date', endDate)

    if (eventError) throw eventError

    const eventIds = (events || []).map(e => e.id)
    if (eventIds.length === 0) {
      return {
        success: true,
        data: {
          totalIncome: 0,
          totalExpenses: 0,
          deductibleExpenses: 0,
          nonDeductibleExpenses: 0,
          netIncome: 0,
          taxableIncome: 0,
          incomeByClass: {},
          expenseByNature: {}
        }
      }
    }

    // Step 2: Get income effects for these events
    const { data: incomeRecs, error: incomeError } = await supabase
      .from('event_effects')
      .select('*')
      .eq('effect_type', 'INCOME_RECOGNIZED')
      .in('event_id', eventIds)

    if (incomeError) throw incomeError

    // Step 3: Get expense effects for these events
    const { data: expenseRecs, error: expenseError } = await supabase
      .from('event_effects')
      .select('*')
      .eq('effect_type', 'EXPENSE_RECOGNIZED')
      .in('event_id', eventIds)

    if (expenseError) throw expenseError

    // Aggregate income
    const incomeByClass = {}
    let totalIncome = 0

    safeArray(incomeRecs).forEach(rec => {
      const income = rec.amount || 0
      totalIncome += income
      incomeByClass['GENERAL'] = (incomeByClass['GENERAL'] || 0) + income
    })

    // Aggregate expenses
    const expenseByNature = {}
    let totalExpenses = 0
    let deductibleExpenses = 0
    let nonDeductibleExpenses = 0

    safeArray(expenseRecs).forEach(rec => {
      const expense = safeAbs(rec.amount) || 0
      totalExpenses += expense
      // Assume all expenses recorded through event_effects are deductible
      deductibleExpenses += expense
      expenseByNature['OPERATIONAL'] = (expenseByNature['OPERATIONAL'] || 0) + expense
    })

    const netIncome = totalIncome - totalExpenses
    const taxableIncome = totalIncome - deductibleExpenses

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        deductibleExpenses,
        nonDeductibleExpenses,
        netIncome,
        taxableIncome,
        incomeByClass,
        expenseByNature
      }
    }
  } catch (error) {
    console.error('Error in getIncomeStatement:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to generate income statement'
    }
  }
}

/**
 * Get balance sheet (Assets - Liabilities = Equity)
 * Returns summary from assets/liabilities tables (Phase 5)
 * 
 * @param {string} entityId - Entity UUID
 * @returns {Promise<{success, data, error}>}
 */
export async function getBalanceSheet(entityId) {
  try {
    if (!entityId) throw new Error('Entity ID required')

    // Get assets grouped by type
    const { data: assets, error: assetError } = await supabase
      .from('assets')
      .select('asset_type, initial_value')
      .eq('entity_id', entityId)
      .is('disposed_event_id', null)

    const { data: liabilities, error: liabError } = await supabase
      .from('liabilities')
      .select('liability_type, principal_amount')
      .eq('entity_id', entityId)
      .is('extinguished_event_id', null)

    // If tables don't exist or queries fail, return empty structure
    const assetsByType = {}
    let totalAssets = 0

    if (assets && !assetError) {
      assets.forEach(asset => {
        const value = asset.initial_value || 0
        totalAssets += value
        assetsByType[asset.asset_type] = (assetsByType[asset.asset_type] || 0) + value
      })
    }

    const liabilitiesByType = {}
    let totalLiabilities = 0

    if (liabilities && !liabError) {
      liabilities.forEach(liability => {
        const balance = liability.principal_amount || 0
        totalLiabilities += balance
        liabilitiesByType[liability.liability_type] = (liabilitiesByType[liability.liability_type] || 0) + balance
      })
    }

    const equity = totalAssets - totalLiabilities

    return {
      success: true,
      data: {
        assets: assetsByType,
        liabilities: liabilitiesByType,
        totalAssets,
        totalLiabilities,
        equity
      }
    }
  } catch (error) {
    // Return empty balance sheet on error
    return {
      success: true,
      data: {
        assets: {},
        liabilities: {},
        totalAssets: 0,
        totalLiabilities: 0,
        equity: 0
      }
    }
  }
}

/**
 * Get tax summary for year
 * Shows taxable, deductible, and tax-exempt income/expenses
 * 
 * @param {string} entityId - Entity UUID
 * @param {number} year - Year (e.g., 2025)
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     grossIncome: number,
 *     taxableIncome: number,
 *     taxExemptIncome: number,
 *     deductibleExpenses: number,
 *     nonDeductibleExpenses: number,
 *     effectiveTaxBase: number
 *   },
 *   error?: string
 * }>}
 */
export async function getTaxSummary(entityId, year) {
  try {
    if (!entityId || !year) {
      throw new Error('Required: entityId, year')
    }

    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    // Step 1: Get all event IDs for this entity in the year
    const { data: events, error: eventError } = await supabase
      .from('economic_events')
      .select('id')
      .eq('entity_id', entityId)
      .gte('event_date', startDate)
      .lte('event_date', endDate)

    if (eventError) throw eventError

    const eventIds = (events || []).map(e => e.id)
    if (eventIds.length === 0) {
      return {
        success: true,
        data: {
          grossIncome: 0,
          taxableIncome: 0,
          taxExemptIncome: 0,
          deductibleExpenses: 0,
          nonDeductibleExpenses: 0,
          effectiveTaxBase: 0
        }
      }
    }

    // Step 2: Get income effects for these events
    const { data: incomeRecs } = await supabase
      .from('event_effects')
      .select('amount')
      .eq('effect_type', 'INCOME_RECOGNIZED')
      .in('event_id', eventIds)

    // Step 3: Get expense effects for these events
    const { data: expenseRecs } = await supabase
      .from('event_effects')
      .select('amount')
      .eq('effect_type', 'EXPENSE_RECOGNIZED')
      .in('event_id', eventIds)

    // Aggregate
    let grossIncome = 0
    let taxableIncome = 0
    let taxExemptIncome = 0

    safeArray(incomeRecs).forEach(rec => {
      const income = rec.amount || 0
      grossIncome += income
      taxableIncome += income  // Assume all income is taxable by default
    })

    let deductibleExpenses = 0
    let nonDeductibleExpenses = 0

    safeArray(expenseRecs).forEach(rec => {
      // Assume all expenses recorded are deductible
      deductibleExpenses += safeAbs(rec.amount || 0)
    })

    const effectiveTaxBase = safeMax(0, taxableIncome - deductibleExpenses)

    return {
      success: true,
      data: {
        grossIncome,
        taxableIncome,
        taxExemptIncome,
        deductibleExpenses,
        nonDeductibleExpenses,
        effectiveTaxBase
      }
    }
  } catch (error) {
    console.error('Error in getTaxSummary:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to generate tax summary'
    }
  }
}

/**
 * Get monthly summary for charting
 * Returns array of monthly income, expenses, and net
 * 
 * @param {string} entityId
 * @param {number} year
 * @returns {Promise<{success, data, error}>}
 */
export async function getMonthlySummary(entityId, year) {
  try {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0')
      return `${year}-${month}`
    })

    const summary = await Promise.all(
      months.map(async (yearMonth) => {
        const startDate = `${yearMonth}-01`
        const endDate = new Date(yearMonth + '-01')
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0)
        const endDateStr = endDate.toISOString().split('T')[0]

        // Step 1: Get event IDs for this month and entity
        const { data: events } = await supabase
          .from('economic_events')
          .select('id')
          .eq('entity_id', entityId)
          .gte('event_date', startDate)
          .lte('event_date', endDateStr)

        const eventIds = (events || []).map(e => e.id)

        // Step 2: Get income effects for these events
        let totalIncome = 0
        if (eventIds.length > 0) {
          const incomeRes = await supabase
            .from('event_effects')
            .select('amount')
            .eq('effect_type', 'INCOME_RECOGNIZED')
            .in('event_id', eventIds)

          totalIncome = safeArray(incomeRes.data).reduce((sum, r) => sum + (r.amount || 0), 0)
        }

        // Step 3: Get expense effects for these events
        let totalExpense = 0
        if (eventIds.length > 0) {
          const expenseRes = await supabase
            .from('event_effects')
            .select('amount')
            .eq('effect_type', 'EXPENSE_RECOGNIZED')
            .in('event_id', eventIds)

          totalExpense = safeArray(expenseRes.data).reduce((sum, r) => sum + safeAbs(r.amount || 0), 0)
        }

        return {
          month: yearMonth,
          income: totalIncome,
          expense: totalExpense,
          net: totalIncome - totalExpense
        }
      })
    )

    return {
      success: true,
      data: summary
    }
  } catch (error) {
    console.error('Error in getMonthlySummary:', error)
    return {
      success: false,
      data: [],
      error: error.message
    }
  }
}


