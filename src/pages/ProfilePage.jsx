import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)

        // Load entities
        const { data } = await supabase
          .from('entities')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })

        setEntities(data || [])
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  async function handleDeleteEntity(entityId) {
    if (!confirm('Are you sure you want to delete this entity? This cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('id', entityId)

    if (!error) {
      setEntities(entities.filter(e => e.id !== entityId))
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* User Info */}
        <div className="bg-white rounded border p-6 mb-8">
          <h1 className="text-2xl font-bold mb-4">Profile</h1>

          <div className="space-y-2 mb-6">
            <p className="text-gray-600">
              <strong>Email:</strong> {user?.email}
            </p>
            <p className="text-gray-600">
              <strong>Member Since:</strong>{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'Unknown'}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="text-red-600 hover:text-red-700 underline text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Entities */}
        <div className="bg-white rounded border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">My Entities</h2>
            <button
              onClick={() => navigate('/entities/new')}
              className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
            >
              + Create Entity
            </button>
          </div>

          {entities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No entities yet. Create one to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {entities.map(entity => (
                <li
                  key={entity.id}
                  className="flex items-center justify-between border rounded p-4 hover:bg-gray-50 transition cursor-pointer group"
                  onClick={() => navigate(`/entities/${entity.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{entity.name}</h3>
                    <p className="text-sm text-gray-600">
                      {entity.type} • Created{' '}
                      {entity.created_at
                        ? new Date(entity.created_at).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteEntity(entity.id)
                      }}
                      className="text-red-600 hover:text-red-700 text-sm underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
