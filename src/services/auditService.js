/**
 * auditService.js
 * 
 * Service for querying the audit log table.
 * Provides forensic capabilities for compliance, debugging, and accountability.
 * 
 * The audit_log table captures all INSERT/UPDATE/DELETE operations on:
 * - economic_events
 * - event_effects
 * - assets
 * - liabilities
 * - income_recognitions
 * - expense_recognitions
 * - entity_allowed_income_classes (service role)
 * - entity_allowed_expense_natures (service role)
 */

import { supabase, getCurrentUser } from '../lib/supabase'

/**
 * Get audit log entries for a specific table and record
 * 
 * @param {Object} params
 * @param {string} params.tableName - Table name to audit
 * @param {string} params.recordId - Record UUID to track
 * @param {number} [params.limit] - Result limit (default 100)
 * @param {number} [params.offset] - Pagination offset
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<AuditLog>,
 *   count: number,
 *   error?: string
 * }>}
 * 
 * @example
 * const audit = await getAuditTrail({
 *   tableName: 'economic_events',
 *   recordId: 'event-uuid'
 * })
 */
export async function getAuditTrail({ tableName, recordId, limit = 100, offset = 0 }) {
  try {
    if (!tableName || !recordId) {
      throw new Error('Missing required: tableName, recordId')
    }

    const { data, count, error } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: data || [],
      count: count || 0
    }
  } catch (error) {
    console.error('Error in getAuditTrail:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to fetch audit trail'
    }
  }
}

/**
 * Get all audit log entries for a table
 * 
 * @param {string} tableName - Table name
 * @param {Object} [filters]
 * @param {string} [filters.action] - Filter by action ('INSERT', 'UPDATE', 'DELETE')
 * @param {string} [filters.actorUid] - Filter by user ID
 * @param {string} [filters.startDate] - Filter from date
 * @param {string} [filters.endDate] - Filter to date
 * @param {number} [filters.limit] - Result limit (default 100)
 * @param {number} [filters.offset] - Pagination offset
 * 
 * @returns {Promise<{success, data, count, error}>}
 */
export async function getTableAuditLog(tableName, filters = {}) {
  try {
    const {
      action,
      actorUid,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = filters

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('table_name', tableName)

    if (action) {
      query = query.eq('action', action)
    }

    if (actorUid) {
      query = query.eq('actor_uid', actorUid)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: data || [],
      count: count || 0
    }
  } catch (error) {
    console.error('Error in getTableAuditLog:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to fetch audit log'
    }
  }
}

/**
 * Get all mutations performed by a specific user
 * 
 * @param {string} userId - User UUID
 * @param {Object} [filters]
 * @param {string} [filters.tableName] - Filter by table
 * @param {string} [filters.action] - Filter by action
 * @param {string} [filters.startDate] - From date
 * @param {string} [filters.endDate] - To date
 * @param {number} [filters.limit] - Result limit
 * @param {number} [filters.offset] - Pagination offset
 * 
 * @returns {Promise<{success, data, count, error}>}
 */
export async function getUserActivity(userId, filters = {}) {
  try {
    const {
      tableName,
      action,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = filters

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('actor_uid', userId)
      .eq('actor_role', 'user')

    if (tableName) {
      query = query.eq('table_name', tableName)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: data || [],
      count: count || 0
    }
  } catch (error) {
    console.error('Error in getUserActivity:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to fetch user activity'
    }
  }
}

/**
 * Get all service-role operations (e.g., entity rule updates)
 * 
 * @param {Object} [filters]
 * @param {string} [filters.tableName] - Filter by table
 * @param {string} [filters.startDate] - From date
 * @param {string} [filters.endDate] - To date
 * @param {number} [filters.limit] - Result limit (default 100)
 * @param {number} [filters.offset] - Pagination offset
 * 
 * @returns {Promise<{success, data, count, error}>}
 */
export async function getServiceActivity(filters = {}) {
  try {
    const {
      tableName,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = filters

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('actor_role', 'service')

    if (tableName) {
      query = query.eq('table_name', tableName)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: data || [],
      count: count || 0
    }
  } catch (error) {
    console.error('Error in getServiceActivity:', error)
    return {
      success: false,
      data: [],
      count: 0,
      error: error.message || 'Failed to fetch service activity'
    }
  }
}

/**
 * Compare before/after state of a record mutation
 * 
 * @param {string} auditLogId - Audit log entry ID
 * @returns {Promise<{
 *   success: boolean,
 *   change: {
 *     field: string,
 *     oldValue: any,
 *     newValue: any
 *   }[],
 *   error?: string
 * }>}
 */
export async function getRecordChanges(auditLogId) {
  try {
    if (!auditLogId) throw new Error('Audit log ID required')

    const { data: entry, error: entryError } = await supabase
      .from('audit_log')
      .select('before_state, after_state, action')
      .eq('id', auditLogId)
      .single()

    if (entryError) throw entryError
    if (!entry) throw new Error('Audit entry not found')

    const changes = []
    const before = entry.before_state || {}
    const after = entry.after_state || {}

    // For INSERT: show new fields
    if (entry.action === 'INSERT') {
      Object.entries(after).forEach(([field, value]) => {
        changes.push({
          field,
          oldValue: null,
          newValue: value
        })
      })
    }
    // For UPDATE: show changed fields
    else if (entry.action === 'UPDATE') {
      Object.entries(after).forEach(([field, newValue]) => {
        const oldValue = before[field]
        if (oldValue !== newValue) {
          changes.push({
            field,
            oldValue,
            newValue
          })
        }
      })
    }
    // For DELETE: show removed fields
    else if (entry.action === 'DELETE') {
      Object.entries(before).forEach(([field, value]) => {
        changes.push({
          field,
          oldValue: value,
          newValue: null
        })
      })
    }

    return {
      success: true,
      changes
    }
  } catch (error) {
    console.error('Error in getRecordChanges:', error)
    return {
      success: false,
      changes: [],
      error: error.message || 'Failed to fetch record changes'
    }
  }
}

/**
 * Generate compliance report
 * Shows all changes to a table in a date range
 * 
 * @param {string} tableName - Table name
 * @param {string} startDate - ISO date
 * @param {string} endDate - ISO date
 * @returns {Promise<{success, report, stats, error}>}
 */
export async function getComplianceReport(tableName, startDate, endDate) {
  try {
    const auditResult = await getTableAuditLog(tableName, {
      startDate,
      endDate,
      limit: 10000 // All records for analysis
    })

    if (!auditResult.success) {
      throw new Error(auditResult.error)
    }

    // Aggregate statistics
    const stats = {
      totalOperations: auditResult.count,
      insertions: 0,
      updates: 0,
      deletions: 0,
      userOperations: 0,
      serviceOperations: 0,
      uniqueUsers: new Set(),
      recordsAffected: new Set()
    }

    auditResult.data.forEach(entry => {
      switch (entry.action) {
        case 'INSERT':
          stats.insertions++
          break
        case 'UPDATE':
          stats.updates++
          break
        case 'DELETE':
          stats.deletions++
          break
      }

      if (entry.actor_role === 'user') {
        stats.userOperations++
        if (entry.actor_uid) {
          stats.uniqueUsers.add(entry.actor_uid)
        }
      } else {
        stats.serviceOperations++
      }

      stats.recordsAffected.add(entry.record_id)
    })

    stats.uniqueUsers = stats.uniqueUsers.size
    stats.recordsAffected = stats.recordsAffected.size

    return {
      success: true,
      report: auditResult.data,
      stats
    }
  } catch (error) {
    console.error('Error in getComplianceReport:', error)
    return {
      success: false,
      report: [],
      stats: null,
      error: error.message || 'Failed to generate compliance report'
    }
  }
}


