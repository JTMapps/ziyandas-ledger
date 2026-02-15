import { useEffect, useState, useCallback } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { supabase } from '../../../lib/supabase'
import { ARCHETYPES } from '../../../domain/events/archetypes'

export default function IncomeOverview() {
  const { entity } = useEntity()

  const [snapshot, setSnapshot] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!entity) return

    setLoading(true)

    const [{ data: snap }, { data: eventData }] = await Promise.all([
      supabase.rpc('get_entity_snapshot', {
        p_entity_id: entity.id
      }),
      supabase
        .from('economic_events')
        .select('*')
        .eq('entity_id', entity.id)
        .in('event_type', [
          'CASH_SALE',
          'CREDIT_SALE',
          'REVENUE_REFUND'
        ])
        .order('event_date', { ascending: false })
    ])

    setSnapshot(snap || null)
    setEvents(eventData || [])
    setLoading(false)
  }, [entity])

  useEffect(() => {
    load()
  }, [load])

  function getLabel(value) {
    for (const group of Object.values(ARCHETYPES)) {
      const found = group.items.find(i => i.value === value)
      if (found) return found.label
    }
    return value
  }

  if (!entity) return null
  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-8">

      <div>
        <h2 className="text-xl font-bold mb-4">Income Overview</h2>

        <div className="text-3xl font-semibold text-green-600">
          R {Math.abs(snapshot?.total_income || 0).toLocaleString()}
        </div>

        <div className="text-sm text-gray-600 mt-2">
          Net Profit: R {snapshot?.net_profit?.toLocaleString() || 0}
        </div>
      </div>

      <div className="bg-white border rounded p-6">
        <h3 className="font-semibold mb-4">Income Events</h3>

        {events.length === 0 && (
          <p className="text-gray-500 text-sm">
            No income activity.
          </p>
        )}

        {events.map(event => (
          <div key={event.id} className="border-b pb-2 text-sm">
            <div className="flex justify-between">
              <span>
                {getLabel(event.event_type)}
              </span>
              <span>
                {new Date(event.event_date).toLocaleDateString()}
              </span>
            </div>
            <div className="text-gray-600">
              {event.description || 'No description'}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
