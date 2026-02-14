import { supabase } from '../../lib/supabase'
import { eventEmitter } from '../../lib/eventEmitter'

export async function recordEconomicEvent({
  entityId,
  eventType,
  eventDate,
  description,
  effects
}) {
  if (!entityId) {
    throw new Error('entityId is required')
  }

  if (!effects || effects.length < 2) {
    throw new Error('At least two effects are required')
  }

  // 🔐 Get authenticated user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // 🔥 Call Postgres function (atomic transaction)
  const { data, error } = await supabase.rpc('record_economic_event', {
    p_user_id: user.id,
    p_entity_id: entityId,
    p_event_type: eventType,
    p_event_date: eventDate,
    p_description: description || null,
    p_effects: effects
  })

  if (error) {
    console.error('RPC record_economic_event failed:', error)
    throw error
  }

  // 🔄 Refresh UI
  eventEmitter.emit('ECONOMIC_EVENT_RECORDED')

  return data // returns event_id (uuid)
}
