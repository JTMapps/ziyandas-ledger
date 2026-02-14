import { useEffect, useState, useCallback } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { queryEventsByEntity } from '../../../services/eventService'
import { getEntitySnapshot } from '../../../services/entityService'
import { eventEmitter } from '../../../lib/eventEmitter'
import EventModal from '../../../components/events/EventModal'

export default function HomeTab() {
  const { entity } = useEntity()

  const [events, setEvents] = useState([])
  const [snapshot, setSnapshot] = useState(null)

  const [loadingEvents, setLoadingEvents] = useState(false)
  const [loadingSnapshot, setLoadingSnapshot] = useState(false)
  const [showModal, setShowModal] = useState(false)

  /* ============================================================
     LOADERS
  ============================================================ */

  const loadSnapshot = useCallback(async () => {
    if (!entity) return

    setLoadingSnapshot(true)

    try {
      const result = await getEntitySnapshot(entity.id)

      if (result.success) {
        setSnapshot(result.snapshot)
      } else {
        console.error(result.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSnapshot(false)
    }
  }, [entity])

  const loadEvents = useCallback(async () => {
    if (!entity) return

    setLoadingEvents(true)

    try {
      const result = await queryEventsByEntity(entity.id, { limit: 10 })

      if (result.success) {
        setEvents(result.data)
      } else {
        console.error(result.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEvents(false)
    }
  }, [entity])

  const loadAll = useCallback(async () => {
    if (!entity) return
    await Promise.all([loadSnapshot(), loadEvents()])
  }, [entity, loadSnapshot, loadEvents])

  /* ============================================================
     EFFECTS
  ============================================================ */

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    const handler = () => loadAll()

    eventEmitter.on('ECONOMIC_EVENT_RECORDED', handler)

    return () => {
      eventEmitter.off('ECONOMIC_EVENT_RECORDED', handler)
    }
  }, [loadAll])

  if (!entity) {
    return <div className="p-6">No entity selected.</div>
  }

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{entity.name}</h1>
          <p className="text-gray-600 text-sm">
            Entity Financial Overview
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded hover:opacity-90"
        >
          + Record Event
        </button>
      </div>

      {/* SNAPSHOT */}
      <div className="bg-white border rounded p-6">
        <h2 className="font-semibold mb-6">Financial Snapshot</h2>

        {loadingSnapshot && <p>Loading snapshot…</p>}

        {!loadingSnapshot && snapshot && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">

            <Metric label="Income" value={Math.abs(snapshot.total_income)} />
            <Metric label="Expenses" value={snapshot.total_expenses} />
            <Metric label="Net Profit" value={snapshot.net_profit} />

            <Metric label="Cash" value={snapshot.total_cash} />
            <Metric label="Assets" value={snapshot.total_assets} />
            <Metric label="Liabilities" value={Math.abs(snapshot.total_liabilities)} />
            <Metric label="Equity" value={Math.abs(snapshot.total_equity)} />
            <Metric label="Events" value={snapshot.event_count} />

          </div>
        )}
      </div>

      {/* ACCOUNTING IDENTITY */}
      {!loadingSnapshot && snapshot && (
        <div className="bg-gray-50 border rounded p-4 text-sm">
          <strong>Accounting Identity:</strong>{' '}
          {format(snapshot.total_assets)} =
          {format(Math.abs(snapshot.total_liabilities))} +
          {format(Math.abs(snapshot.total_equity))}
        </div>
      )}

      {/* RECENT EVENTS */}
      <div className="bg-white border rounded p-6">
        <h2 className="font-semibold mb-4">Recent Events</h2>

        {loadingEvents && <p>Loading…</p>}

        {!loadingEvents && events.length === 0 && (
          <p className="text-gray-500 text-sm">No events recorded.</p>
        )}

        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="border-b pb-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">
                  {event.event_type}
                </span>
                <span className="text-gray-500">
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

      {showModal && (
        <EventModal
          entity={entity}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

/* UI HELPERS */

function Metric({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="font-semibold text-base">
        {format(value)}
      </span>
    </div>
  )
}

function format(value) {
  if (!value) return '0'
  return new Intl.NumberFormat().format(value)
}
