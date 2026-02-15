import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProfilePage() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [entities, setEntities] = useState([])
  const [snapshots, setSnapshots] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) return

      setUser(user)

      const { data: entityData, error: entityError } =
        await supabase
          .from('entities')
          .select('*')
          .eq('created_by', user.id)

      if (entityError) throw entityError

      setEntities(entityData || [])

      const snapshotMap = {}

      for (const entity of entityData || []) {
        const { data: snapshot } =
          await supabase.rpc('get_entity_snapshot', {
            p_entity_id: entity.id
          })

        snapshotMap[entity.id] = snapshot
      }

      setSnapshots(snapshotMap)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  /* ============================================================
     AGGREGATES
  ============================================================ */

  const totalEntities = entities.length

  const totalEvents = Object.values(snapshots)
    .reduce((sum, s) => sum + (s?.event_count || 0), 0)

  const aggregateEquity = Object.values(snapshots)
    .reduce((sum, s) => sum + (s?.total_equity || 0), 0)

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

        {/* PROFILE SUMMARY */}

        <div className="bg-white rounded border p-6">
          <h1 className="text-2xl font-bold mb-4">
            Financial Steward Profile
          </h1>

          <div className="grid grid-cols-3 gap-6 text-sm">
            <Metric label="Entities" value={totalEntities} />
            <Metric label="Total Events" value={totalEvents} />
            <Metric label="Aggregate Equity" value={aggregateEquity} />
          </div>

          <div className="mt-6 text-gray-600 text-sm">
            <p><strong>Email:</strong> {user?.email}</p>
            <p>
              <strong>Member Since:</strong>{' '}
              {new Date(user?.created_at).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-4 text-red-600 underline text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* ENTITIES */}

        <div className="bg-white rounded border p-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-bold">Economic Entities</h2>
            <button
              onClick={() => navigate('/entities/new')}
              className="bg-black text-white px-4 py-2 rounded text-sm"
            >
              + Create Entity
            </button>
          </div>

          {entities.length === 0 ? (
            <p className="text-gray-500">
              No entities yet.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {entities.map(entity => {
                const s = snapshots[entity.id] || {}

                return (
                  <div
                    key={entity.id}
                    onClick={() => navigate(`/entities/${entity.id}`)}
                    className="border rounded p-5 cursor-pointer hover:shadow-sm"
                  >
                    <h3 className="font-semibold text-lg mb-2">
                      {entity.name}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <Metric label="Events" value={s.event_count} />
                      <Metric label="Net Profit" value={s.net_profit} />
                      <Metric label="Assets" value={s.total_assets} />
                      <Metric label="Liabilities" value={s.total_liabilities} />
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
