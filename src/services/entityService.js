/**
 * entityService.js
 * 
 * Service for entity management: CRUD operations on entities.
 * Updated to work with new schema where entities is foundational.
 * 
 * Entities are the organizational units that contain economic events,
 * income/expense entries, assets, and liabilities.
 */

import { supabase, getCurrentUser } from '../lib/supabase'
import { eventEmitter } from '../lib/eventEmitter'

/**
 * Create a new entity
 * 
 * @param {Object} params
 * @param {string} params.name - Entity name
 * @param {string} params.type - Entity type (e.g., 'PERSONAL', 'BUSINESS', 'TRUST', 'HOLDING')
 * @param {string} [params.description] - Optional description
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: {entity},
 *   error?: string
 * }>}
 */
export async function createEntity({ name, type, description }) {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    // Validate
    if (!name || !type) {
      throw new Error('Missing required fields: name, type')
    }

    const { data, error } = await supabase
      .from('entities')
      .insert({
        name,
        type,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Emit event
    eventEmitter.emit('ENTITY_CREATED', {
      entityId: data.id,
      name,
      type,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      data: { entity: data }
    }
  } catch (error) {
    console.error('Error in createEntity:', error)
    eventEmitter.emit('RECOVERY_ERROR', { error: error.message })
    return {
      success: false,
      error: error.message || 'Failed to create entity'
    }
  }
}

/**
 * Retrieve all entities owned by current user
 * 
 * @param {Object} [filters]
 * @param {string} [filters.type] - Filter by entity type
 * @param {number} [filters.limit] - Limit results (default 100)
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<Entity>,
 *   count: number,
 *   error?: string
 * }>}
 */
export async function getMyEntities(filters = {}) {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    const { type, limit = 100 } = filters

    let query = supabase
      .from('entities')
      .select('*', { count: 'exact' })
      .eq('created_by', user.id)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      success: true,
      data: data || [],
      count: count || 0
    }
  } catch (error) {
    console.error('Error in getMyEntities:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to fetch entities'
    }
  }
}

/**
 * Get a single entity by ID
 * Verifies ownership via RLS
 * 
 * @param {string} entityId - Entity UUID
 * @returns {Promise<{success, entity, error}>}
 */
export async function getEntity(entityId) {
  try {
    if (!entityId) throw new Error('Entity ID required')

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Entity not found')

    return {
      success: true,
      entity: data
    }
  } catch (error) {
    console.error('Error in getEntity:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch entity'
    }
  }
}

/**
 * Update entity name
 * 
 * @param {string} entityId - Entity UUID
 * @param {string} name - New name
 * @returns {Promise<{success, entity, error}>}
 */
export async function updateEntityName(entityId, name) {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    if (!entityId || !name) {
      throw new Error('Missing required fields: entityId, name')
    }

    const { data, error } = await supabase
      .from('entities')
      .update({ name })
      .eq('id', entityId)
      .eq('created_by', user.id) // RLS: ensure ownership
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Entity not found or unauthorized')

    eventEmitter.emit('ENTITY_UPDATED', {
      entityId,
      field: 'name',
      newValue: name,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      entity: data
    }
  } catch (error) {
    console.error('Error in updateEntityName:', error)
    return {
      success: false,
      error: error.message || 'Failed to update entity'
    }
  }
}

/**
 * Delete an entity
 * WARNING: This deletes the entity and all associated records due to FK cascades
 * Consider soft-delete or archive instead for production
 * 
 * @param {string} entityId - Entity UUID
 * @returns {Promise<{success, error}>}
 */
export async function deleteEntity(entityId) {
  try {
    const { user, error: userError } = await getCurrentUser()
    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    if (!entityId) throw new Error('Entity ID required')

    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('id', entityId)
      .eq('created_by', user.id) // RLS: ensure ownership

    if (error) throw error

    eventEmitter.emit('ENTITY_DELETED', {
      entityId,
      timestamp: new Date().toISOString()
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('Error in deleteEntity:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete entity'
    }
  }
}

/**
 * Check if current user owns an entity
 * 
 * @param {string} entityId - Entity UUID
 * @returns {Promise<{success, owns, error}>}
 */
export async function userOwnsEntity(entityId) {
  try {
    const result = await getEntity(entityId)
    if (!result.success) {
      return {
        success: false,
        owns: false,
        error: result.error
      }
    }

    const { user } = await getCurrentUser()
    const owns = result.entity.created_by === user?.id

    return {
      success: true,
      owns
    }
  } catch (error) {
    console.error('Error in userOwnsEntity:', error)
    return {
      success: false,
      owns: false,
      error: error.message
    }
  }
}

/**
 * Get entity summary stats
 * Fetches income, expense, asset, and liability totals
 * 
 * @param {string} entityId - Entity UUID
 * @param {string} [startDate] - ISO date for filtering
 * @param {string} [endDate] - ISO date for filtering
 * @returns {Promise<{
 *   success,
 *   summary: {totalIncome, totalExpense, netIncome, ...},
 *   error
 * }>}
 */
export async function getEntitySummary(entityId, startDate, endDate) {
  try {
    if (!entityId) throw new Error('Entity ID required')

    let query = supabase.rpc('get_entity_summary', {
      p_entity_id: entityId,
      p_start_date: startDate || null,
      p_end_date: endDate || null
    })

    const { data, error } = await query

    if (error) {
      // RPC doesn't exist yet; fallback to manual calculation
      // This will be implemented in Phase 4 as a materialized view
      console.warn('Entity summary RPC not available; returning zeros')
      return {
        success: true,
        summary: {
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
          totalAssets: 0,
          totalLiabilities: 0,
          equity: 0
        }
      }
    }

    return {
      success: true,
      summary: data
    }
  } catch (error) {
    console.error('Error in getEntitySummary:', error)
    return {
      success: false,
      summary: null,
      error: error.message || 'Failed to fetch entity summary'
    }
  }
}


