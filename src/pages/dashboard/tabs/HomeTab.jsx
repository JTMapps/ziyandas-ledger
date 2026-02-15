import { useEffect, useState, useCallback } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { supabase } from '../../../lib/supabase'
import EventModal from '../../../components/events/EventModal'
import { ARCHETYPES } from '../../../domain/events/archetypes'

export default function HomeTab() {
  const { entity } = useEntity()

  const [events, setEvents] = useState([])
  const [snapshot, setSnapshot] = useState(null)
  const [archetypeSummary, setArchetypeSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  /* ============================================================
     DATA LOADER
  ============================================================ */

  const loadData = useCallback(async () => {
    if (!entity) return

    setLoading(true)

    const [
      { data: eventsData },
      { data: snapshotData },
      { data: archetypeData }
    ] = await Promise.all([
      supabase
        .from('economic_events')
        .select('*')
        .eq('entity_id', entity.id)
        .order('event_date', { ascending: false })
        .limit(10),

      supabase.rpc('get_entity_snapshot', {
        p_entity_id: entity.id
      }),

      supabase.rpc('get_archetype_summary', {
        p_entity_id: entity.id
      })
    ])

    setEvents(eventsData || [])
    setSnapshot(snapshotData || null)
    setArchetypeSummary(archetypeData || [])
    setLoading(false)
  }, [entity])

  useEffect(() => {
    loadData()
  }, [loadData])

  function closeModal() {
    setShowModal(false)
    loadData()
  }

  /* ============================================================
     HELPERS
  ============================================================ */

  function getArchetypeLabel(value) {
    for (const category of Object.values(ARCHETYPES)) {
      const found = category.items.find(i => i.value === value)
      if (found) return found.label
    }
    return value
  }

  function format(value) {
    return new Intl.NumberFormat().format(value || 0)
  }

  if (!entity) return <div className="p-6">No entity selected.</div>

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="p-6 space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Financial Overview</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Record Event
        </button>
      </div>

      {showModal && (
        <EventModal entity={entity} onClose={closeModal} />
      )}

      {/* ============================================================
         FINANCIAL POSITION
      ============================================================ */}
      {!loading && snapshot && (
        <div className="bg-white border rounded p-6 space-y-6">
          <h2 className="font-semibold text-lg">
            Statement of Financial Position
          </h2>

          <div className="grid md:grid-cols-3 gap-8 text-sm">
            <Metric label="Assets" value={snapshot.total_assets} />
            <Metric label="Liabilities" value={Math.abs(snapshot.total_liabilities)} />
            <Metric label="Equity" value={snapshot.total_equity} />
          </div>
        </div>
      )}

      {/* ============================================================
         FINANCIAL RATIOS
      ============================================================ */}
      {!loading && snapshot && (
        <div className="bg-gray-50 border rounded p-6">
          <h2 className="font-semibold mb-4">Financial Ratios</h2>

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
              label="Return on Assets"
              value={
                snapshot.total_assets > 0
                  ? (
                      snapshot.net_profit /
                      snapshot.total_assets
                    ).toFixed(2)
                  : 0
              }
            />

          </div>
        </div>
      )}

      {/* ============================================================
         ARCHETYPE ANALYTICS
      ============================================================ */}
      {!loading && archetypeSummary.length > 0 && (
        <div className="bg-white border rounded p-6">
          <h2 className="font-semibold mb-4">Archetype Breakdown</h2>

          <div className="space-y-2 text-sm">
            {archetypeSummary.map(row => (
              <div key={row.event_type} className="flex justify-between">
                <span>{getArchetypeLabel(row.event_type)}</span>
                <span>{format(row.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
         TAX ANALYTICS
      ============================================================ */}
      {!loading && snapshot?.tax_summary && (
        <div className="bg-white border rounded p-6">
          <h2 className="font-semibold mb-4">Tax Summary</h2>

          <div className="space-y-2 text-sm">
            {Object.entries(snapshot.tax_summary).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>{key}</span>
                <span>{format(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
         RECENT EVENTS
      ============================================================ */}
      <div className="bg-white border rounded p-6">
        <h2 className="font-semibold mb-4">Recent Events</h2>

        {events.map(event => (
          <div key={event.id} className="border-b pb-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">
                {getArchetypeLabel(event.event_type)}
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
  )
}

/* ============================================================
   UI HELPER
============================================================ */

function Metric({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="font-semibold text-base">
        {new Intl.NumberFormat().format(value || 0)}
      </span>
    </div>
  )
}
