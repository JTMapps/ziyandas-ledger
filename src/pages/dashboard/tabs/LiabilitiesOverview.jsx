import { useEffect, useState, useCallback } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { queryEventsByEntity } from '../../../services/eventService'
import { getEntitySnapshot } from '../../../services/entityService'

export default function LiabilitiesOverview() {
  const { entity } = useEntity()
  
  const [snapshot, setSnapshot] = useState(null)
  const [liabilityEvents, setLiabilityEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!entity) return

    setLoading(true)

    const snapResult = await getEntitySnapshot(entity.id)
    if (snapResult.success) {
      setSnapshot(snapResult.snapshot)
    }

    const eventsResult = await queryEventsByEntity(entity.id, {
      eventType: 'LIABILITY_INCURRED'
    })

    if (eventsResult.success) {
      setLiabilityEvents(eventsResult.data)
    }

    setLoading(false)
  }, [entity])

  useEffect(() => {
    load()
  }, [load])

  if (!entity) return null

  return (
    <div className="p-6 space-y-8">

      <div>
        <h2 className="text-xl font-bold mb-4">Liability Overview</h2>

        {loading && <p>Loading…</p>}

        {!loading && snapshot && (
          <div className="text-3xl font-semibold text-green-600">
            R {Math.abs(snapshot.total_liabilities).toLocaleString()}
          </div>
        )}
      </div>

      <div className="bg-white border rounded p-6">
        <h3 className="font-semibold mb-4">Liability Events</h3>

        {liabilityEvents.length === 0 && (
          <p className="text-gray-500 text-sm">No liabilities recorded.</p>
        )}

        <div className="space-y-3">
          {liabilityEvents.map(event => (
            <div key={event.id} className="border-b pb-2 text-sm">
              <div className="flex justify-between">
                <span>{event.description || 'Liability Inccured'}</span>
                <span>
                  {new Date(event.event_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}