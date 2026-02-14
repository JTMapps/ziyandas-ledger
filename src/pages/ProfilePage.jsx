import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../lib/supabase'
import { getMyEntities, getEntitySnapshot } from '../services/entityService'
import { eventEmitter } from '../lib/eventEmitter'

export default function ProfilePage() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [entities, setEntities] = useState([])
  const [entitySnapshots, setEntitySnapshots] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* ============================================================
     LOAD PROFILE
  ============================================================ */

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    const reload = () => loadProfile()

    eventEmitter.on('ENTITY_CREATED', reload)
    eventEmitter.on('ECONOMIC_EVENT_RECORDED', reload)

    return () => {
      eventEmitter.off('ENTITY_CREATED', reload)
      eventEmitter.off('ECONOMIC_EVENT_RECORDED', reload)
    }
  }, [])

  async function loadProfile() {
    setLoading(true)
    setError(null)

    try {
      const { user: currentUser, error: userError } = await getCurrentUser()
      if (userError) throw userError
      if (!currentUser) return

      setUser(currentUser)

      const result = await getMyEntities()
      if (!result.success) throw new Error(result.error)

      const entitiesData = result.data || []
      setEntities(entitiesData)

      const snapshots = {}

      for (const entity of entitiesData) {
        const snapResult = await getEntitySnapshot(entity.id)
        if (snapResult.success) {
          snapshots[entity.id] = snapResult.snapshot
        }
      }

      setEntitySnapshots(snapshots)

    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  /* ============================================================
     DERIVED AGGREGATES
  ============================================================ */

  const totalEntities = entities.length

  const totalEvents = Object.values(entitySnapshots)
    .reduce((sum, s) => sum + (s?.event_count || 0), 0)

  const totalNetPosition = Object.values(entitySnapshots)
    .reduce((sum, s) => sum + (s?.total_equity || 0), 0)

  /* ============================================================
     RENDER
  ============================================================ */

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* ============================================================
           USER DOMAIN SUMMARY
        ============================================================ */}

        <div className="bg-white rounded border p-6">
          <h1 className="text-2xl font-bold mb-4">
            Financial Steward Profile
          </h1>

          <div className="grid grid-cols-3 gap-6 text-sm">
            <Metric label="Entities" value={totalEntities} />
            <Metric label="Total Events" value={totalEvents} />
            <Metric label="Aggregate Equity" value={totalNetPosition} />
          </div>

          <div className="mt-6 text-gray-600 text-sm">
            <p><strong>Email:</strong> {user?.email}</p>
            <p>
              <strong>Member Since:</strong>{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'Unknown'}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-4 text-red-600 hover:text-red-700 underline text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* ============================================================
           ENTITIES
        ============================================================ */}

        <div className="bg-white rounded border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Economic Entities</h2>
            <button
              onClick={() => navigate('/entities/new')}
              className="bg-black text-white px-4 py-2 rounded text-sm hover:opacity-90"
            >
              + Create Entity
            </button>
          </div>

          {entities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No entities yet. Create one to begin recording economic reality.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {entities.map(entity => {
                const snapshot = entitySnapshots[entity.id]

                return (
                  <div
                    key={entity.id}
                    onClick={() => navigate(`/entities/${entity.id}`)}
                    className="border rounded p-5 hover:shadow-sm transition cursor-pointer"
                  >
                    <h3 className="font-semibold text-lg mb-2">
                      {entity.name}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <Metric label="Events" value={snapshot?.event_count} />
                      <Metric label="Net Profit" value={snapshot?.net_profit} />
                      <Metric label="Assets" value={snapshot?.total_assets} />
                      <Metric label="Liabilities" value={snapshot?.total_liabilities} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

/* ============================================================
   UI HELPERS
============================================================ */

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
