import { useEffect, useState, useCallback } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { getEntitySnapshot } from '../../../services/entityService'
import { queryEventsByEntity } from '../../../services/eventService'

export default function AssetsOverview() {
  const { entity } = useEntity()

  const [snapshot, setSnapshot] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!entity) return
    setLoading(true)

    const snapResult = await getEntitySnapshot(entity.id)
    if (snapResult.success) setSnapshot(snapResult.snapshot)

    const eventsResult = await queryEventsByEntity(entity.id)
    if (eventsResult.success) {
      const assetRelated = eventsResult.data.filter(e =>
        ['ASSET_ACQUIRED', 'ASSET_DISPOSED'].includes(e.event_type)
      )
      setEvents(assetRelated)
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
        <h2 className="text-xl font-bold mb-4">Assets Overview</h2>

        {loading && <p>Loading…</p>}

        {!loading && snapshot && (
          <div className="space-y-2">
            <div className="text-2xl font-semibold">
              Total Assets: R {snapshot.total_assets.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              Cash: R {snapshot.total_cash.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              Non-Cash Assets: R {snapshot.total_non_cash_assets.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border rounded p-6">
        <h3 className="font-semibold mb-4">Asset Events</h3>

        {events.length === 0 && (
          <p className="text-gray-500 text-sm">No asset activity.</p>
        )}

        {events.map(event => (
          <div key={event.id} className="border-b pb-2 text-sm">
            {event.event_type} –{' '}
            {new Date(event.event_date).toLocaleDateString()}
          </div>
        ))}

      </div>
    </div>
  )
}
