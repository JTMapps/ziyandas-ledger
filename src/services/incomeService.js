import { supabase } from '../lib/supabase'

export async function getIncomeOverview(entityId) {
  const { data, error } = await supabase
    .from('event_effects')
    .select('amount, effect_sign')
    .eq('effect_type', 'INCOME')
    .in('event_id',
      supabase
        .from('economic_events')
        .select('id')
        .eq('entity_id', entityId)
    )

  if (error) throw error

  const total = data.reduce((sum, row) => {
    return sum + row.amount * row.effect_sign * -1
  }, 0)

  return { total }
}
