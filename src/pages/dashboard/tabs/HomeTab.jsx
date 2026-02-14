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
  <div className="p-6 space-y-10">

    {/* ============================================================
       HEADER
    ============================================================ */}
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold">
          Financial Overview
        </h1>
        <p className="text-gray-600 text-sm">
          Summary of financial position and performance
        </p>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="bg-black text-white px-4 py-2 rounded hover:opacity-90"
      >
        + Record Event
      </button>
    </div>

    {showModal && (
      <EventModal
        entity={entity}
        onClose={() => setShowModal(false)}
      />
    )}

    {/* ============================================================
       BALANCE SHEET (Statement of Financial Position)
    ============================================================ */}
    {!loadingSnapshot && snapshot && (
      <div className="bg-white border rounded p-6 space-y-6">
        <h2 className="font-semibold text-lg">
          Statement of Financial Position
        </h2>

        <div className="grid md:grid-cols-3 gap-8 text-sm">

          {/* Assets */}
          <div>
            <div className="text-gray-500 text-xs mb-1">Assets</div>
            <div className="font-semibold text-xl">
              {format(snapshot.total_assets)}
            </div>
            <div className="text-gray-500 text-xs mt-2">
              Cash: {format(snapshot.total_cash)}
            </div>
          </div>

          {/* Liabilities */}
          <div>
            <div className="text-gray-500 text-xs mb-1">Liabilities</div>
            <div className="font-semibold text-xl">
              {format(Math.abs(snapshot.total_liabilities))}
            </div>
          </div>

          {/* Equity */}
          <div>
            <div className="text-gray-500 text-xs mb-1">Equity</div>
            <div className="font-semibold text-xl">
              {format(Math.abs(snapshot.total_equity))}
            </div>
          </div>

        </div>

        <div className="border-t pt-4 text-sm text-gray-600">
          Accounting Identity:
          {' '}
          {format(snapshot.total_assets)} =
          {' '}
          {format(Math.abs(snapshot.total_liabilities))}
          {' + '}
          {format(Math.abs(snapshot.total_equity))}
        </div>
      </div>
    )}

    {/* ============================================================
       PROFIT & LOSS
    ============================================================ */}
    {!loadingSnapshot && snapshot && (
      <div className="bg-white border rounded p-6 space-y-6">
        <h2 className="font-semibold text-lg">
          Statement of Profit or Loss
        </h2>

        <div className="grid md:grid-cols-3 gap-8 text-sm">

          <div>
            <div className="text-gray-500 text-xs mb-1">Income</div>
            <div className="font-semibold text-xl text-green-600">
              {format(Math.abs(snapshot.total_income))}
            </div>
          </div>

          <div>
            <div className="text-gray-500 text-xs mb-1">Expenses</div>
            <div className="font-semibold text-xl text-red-600">
              {format(snapshot.total_expenses)}
            </div>
          </div>

          <div>
            <div className="text-gray-500 text-xs mb-1">Net Profit</div>
            <div
              className={`font-semibold text-xl ${
                snapshot.net_profit >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {format(snapshot.net_profit)}
            </div>
          </div>

        </div>
      </div>
    )}

    {/* ============================================================
       KEY RATIOS
    ============================================================ */}
    {!loadingSnapshot && snapshot && (
      <div className="bg-gray-50 border rounded p-6">
        <h2 className="font-semibold mb-4">Key Metrics</h2>

        <div className="grid md:grid-cols-3 gap-6 text-sm">

          <Metric
            label="Debt Ratio"
            value={
              snapshot.total_assets > 0
                ? (
                    Math.abs(snapshot.total_liabilities) /
                    snapshot.total_assets
                  ).toFixed(2)
                : 0
            }
          />

          <Metric
            label="Profit Margin"
            value={
              snapshot.total_income > 0
                ? (
                    snapshot.net_profit /
                    Math.abs(snapshot.total_income)
                  ).toFixed(2)
                : 0
            }
          />

          <Metric
            label="Event Count"
            value={snapshot.event_count}
          />

        </div>
      </div>
    )}

    {/* ============================================================
       RECENT EVENTS
    ============================================================ */}
    <div className="bg-white border rounded p-6">
      <h2 className="font-semibold mb-4">Recent Events</h2>

      {loadingEvents && <p>Loading…</p>}

      {!loadingEvents && events.length === 0 && (
        <p className="text-gray-500 text-sm">
          No events recorded.
        </p>
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
