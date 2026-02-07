/**
 * assetService.js (Phase 5 - Asset Tracking)
 * 
 * Service for asset operations: adding, querying, and managing assets.
 * Wraps eventService to record ASSET_ACQUIRED events with tracking data.
 * 
 * Features:
 * - Add asset with acquisition date, value, depreciation method
 * - Track depreciation schedule (straight-line, diminishing balance, units of production)
 * - Query assets by entity
 * - Calculate accumulated depreciation and book value
 * - Mark asset as disposed
 * 
 * All asset transactions are immutable economic events for compliance.
 */

import { supabase, getCurrentUser } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'
import { recordEconomicEvent } from './eventService'

/**
 * Add an asset to an entity
 * Creates: economic_event (ASSET_ACQUIRED) + event_effect (ASSET_INCREASE) + asset record
 * 
 * @param {Object} params
 * @param {string} params.entityId - Entity UUID
 * @param {string} params.assetType - Asset classification (e.g., 'VEHICLE', 'COMPUTER', 'BUILDING')
 * @param {string} params.name - Asset name/description
 * @param {string} params.acquisitionDate - ISO date
 * @param {number} params.initialValue - Original cost
 * @param {string} params.measurementModel - 'COST' or 'REVALUATION'
 * @param {string} [params.depreciationMethod] - 'STRAIGHT_LINE', 'DIMINISHING_BALANCE', 'UNITS_OF_PRODUCTION'
 * @param {number} [params.usefulLifeMonths] - Useful life in months
 * @param {string} [params.currency] - Default 'ZAR'
 * 
 * @returns {Promise<{success, data: {event, effect, asset}, error}>}
 */
export async function addAsset({
  entityId,
  assetType,
  name,
  acquisitionDate,
  initialValue,
  measurementModel = 'COST',
  depreciationMethod = 'STRAIGHT_LINE',
  usefulLifeMonths,
  currency = 'ZAR'
}) {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    // Validate
    if (!entityId || !assetType || !name || !acquisitionDate || !initialValue) {
      throw new Error('Missing required fields')
    }

    if (initialValue <= 0) {
      throw new Error('Asset value must be positive')
    }

    // 1. Record economic event
    const eventResult = await recordEconomicEvent({
      entityId,
      eventType: 'ASSET_ACQUIRED',
      eventDate: acquisitionDate,
      description: `Asset acquired: ${name}`,
      sourceReference: `ASSET-${Date.now()}`,
      effects: [
        {
          effectType: 'ASSET_INCREASE',
          amount: initialValue,
          currency,
          relatedTable: 'assets'
        }
      ]
    })

    if (!eventResult.success) {
      throw new Error(eventResult.error)
    }

    const effect = eventResult.data.effects[0]

    // 2. Create asset record
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .insert({
        entity_id: entityId,
        originating_effect_id: effect.id,
        asset_type: assetType,
        name,
        acquisition_date: acquisitionDate,
        initial_value: initialValue,
        measurement_model: measurementModel,
        depreciation_method: depreciationMethod,
        useful_life_months: usefulLifeMonths,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (assetError) throw assetError

    // 3. Emit event
    eventEmitter.emit('ASSET_ADDED', {
      assetId: assetData.id,
      eventId: eventResult.data.event.id,
      name,
      value: initialValue,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      data: {
        event: eventResult.data.event,
        effect,
        asset: assetData
      }
    }
  } catch (error) {
    console.error('Error in addAsset:', error)
    eventEmitter.emit('RECOVERY_ERROR', { error: error.message })
    return {
      success: false,
      error: error.message || 'Failed to add asset'
    }
  }
}

/**
 * Get assets by entity
 * Includes depreciation calculation if applicable
 * 
 * @param {string} entityId - Entity UUID
 * @param {Object} [filters]
 * @param {boolean} [filters.activeOnly] - Only non-disposed assets (default true)
 * @param {string} [filters.assetType] - Filter by type
 * @param {number} [filters.limit] - Result limit
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<{asset, bookValue, accumulatedDepreciation, monthsUsed}>,
 *   count: number,
 *   error?: string
 * }>}
 */
export async function getAssetsByEntity(entityId, filters = {}) {
  try {
    const {
      activeOnly = true,
      assetType,
      limit = 100
    } = filters

    let query = supabase
      .from('assets')
      .select('*', { count: 'exact' })
      .eq('entity_id', entityId)

    if (activeOnly) {
      query = query.is('disposed_event_id', null)
    }

    if (assetType) {
      query = query.eq('asset_type', assetType)
    }

    const { data, count, error } = await query
      .order('acquisition_date', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Calculate depreciation for each asset
    const assetsWithDepreciation = (data || []).map(asset => {
      const accumulated = calculateDepreciation(asset)
      const bookValue = asset.initial_value - accumulated

      return {
        asset,
        bookValue,
        accumulatedDepreciation: accumulated,
        monthsUsed: calculateMonthsUsed(asset.acquisition_date)
      }
    })

    return {
      success: true,
      data: assetsWithDepreciation,
      count: count || 0
    }
  } catch (error) {
    console.error('Error in getAssetsByEntity:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to fetch assets'
    }
  }
}

/**
 * Mark asset as disposed
 * Creates ASSET_DISPOSED event to void the asset
 * 
 * @param {string} assetId - Asset UUID
 * @param {string} disposalDate - ISO date
 * @param {number} [disposalProceeds] - Sale price or scrap value
 * @param {string} [reason] - Reason for disposal
 * 
 * @returns {Promise<{success, disposalEventId, gain, error}>}
 */
export async function disposeAsset(assetId, disposalDate, disposalProceeds = 0, reason = 'Disposed') {
  try {
    // Get asset
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single()

    if (assetError) throw assetError
    if (!asset) throw new Error('Asset not found')

    // Calculate gain/loss
    const bookValue = asset.initial_value - calculateDepreciation(asset)
    const gain = disposalProceeds - bookValue

    // Record disposal event
    const disposalResult = await recordEconomicEvent({
      entityId: asset.entity_id,
      eventType: 'ASSET_DISPOSED',
      eventDate: disposalDate,
      description: `Asset disposed: ${asset.name} (${reason})`,
      sourceReference: `DISPOSAL-${Date.now()}`,
      effects: [
        {
          effectType: 'ASSET_DECREASE',
          amount: -asset.initial_value,
          currency: 'ZAR'
        },
        {
          effectType: gain >= 0 ? 'INCOME_RECOGNIZED' : 'EXPENSE_RECOGNIZED',
          amount: gain,
          currency: 'ZAR'
        }
      ]
    })

    if (!disposalResult.success) {
      throw new Error(disposalResult.error)
    }

    // Update asset record
    const { error: updateError } = await supabase
      .from('assets')
      .update({
        disposed_event_id: disposalResult.data.event.id
      })
      .eq('id', assetId)

    if (updateError) throw updateError

    eventEmitter.emit('ASSET_DISPOSED', {
      assetId,
      eventId: disposalResult.data.event.id,
      gain,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      disposalEventId: disposalResult.data.event.id,
      gain
    }
  } catch (error) {
    console.error('Error in disposeAsset:', error)
    return {
      success: false,
      error: error.message || 'Failed to dispose asset'
    }
  }
}

/**
 * Get total asset value by type
 * 
 * @param {string} entityId
 * @returns {Promise<{success, totalValue, byType, error}>}
 */
export async function getAssetSummary(entityId) {
  try {
    const result = await getAssetsByEntity(entityId, { activeOnly: true, limit: 1000 })
    if (!result.success) throw new Error(result.error)

    let totalValue = 0
    const byType = {}

    result.data.forEach(({ asset, bookValue }) => {
      totalValue += bookValue
      byType[asset.asset_type] = (byType[asset.asset_type] || 0) + bookValue
    })

    return {
      success: true,
      totalValue,
      byType,
      count: result.count
    }
  } catch (error) {
    console.error('Error in getAssetSummary:', error)
    return {
      success: false,
      totalValue: 0,
      byType: {},
      error: error.message
    }
  }
}

/**
 * Helper: Calculate accumulated depreciation
 * @private
 */
function calculateDepreciation(asset) {
  if (!asset.useful_life_months || asset.useful_life_months === 0) {
    return 0 // Non-depreciable asset
  }

  const monthsUsed = calculateMonthsUsed(asset.acquisition_date)
  const totalValue = asset.initial_value

  switch (asset.depreciation_method) {
    case 'STRAIGHT_LINE': {
      const monthlyDepreciation = totalValue / asset.useful_life_months
      return monthlyDepreciation * monthsUsed
    }

    case 'DIMINISHING_BALANCE': {
      // 20% per annum (declining balance)
      const annualRate = 0.20
      const yearsUsed = monthsUsed / 12
      return totalValue * (1 - Math.pow(1 - annualRate, yearsUsed))
    }

    case 'UNITS_OF_PRODUCTION':
    default:
      return 0 // Requires tracking usage; simplified here
  }
}

/**
 * Helper: Calculate months between acquisition and today
 * @private
 */
function calculateMonthsUsed(acquisitionDate) {
  const acquired = new Date(acquisitionDate)
  const today = new Date()
  
  const months = (today.getFullYear() - acquired.getFullYear()) * 12 +
                 (today.getMonth() - acquired.getMonth())
  
  return Math.max(0, months)
}


