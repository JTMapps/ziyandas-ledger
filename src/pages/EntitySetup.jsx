import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EntitySetup() {
  const [name, setName] = useState('')
  const DEFAULT_TYPES = ['Personal', 'Trust', 'Holding', 'Business']
  const [types, setTypes] = useState(DEFAULT_TYPES)
  const [type, setType] = useState(DEFAULT_TYPES[0])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadTypes() {
      // Try RPC first (authoritative enum labels)
      try {
        const { data, error } = await supabase.rpc('get_enum_values', { type_name: 'entity_type' })
        if (!error && data && data.length > 0) {
          const vals = data.map(d => d.value)
          setTypes(vals)
          setType(vals[0])
          return
        }
      } catch (e) {
        // fallthrough to defaults
      }

      // Fallback: keep DEFAULT_TYPES
      setTypes(DEFAULT_TYPES)
      setType(DEFAULT_TYPES[0])
    }

    loadTypes()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('entities')
      .insert({
            created_by: user.id,
            name,
            type,
        })
        .select()
        .single()

    setLoading(false)

    if (!error && data) {
      navigate('/profile', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleCreate} className="w-96 border p-6 rounded space-y-4">
        <h1 className="text-xl font-bold">Create your first entity</h1>

        <input
          required
          placeholder="Entity name"
          className="w-full border p-2"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <select
          className="w-full border p-2"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          {types.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button
          disabled={loading}
          className="w-full bg-black text-white p-2"
        >
          {loading ? 'Creating…' : 'Create Entity'}
        </button>
      </form>
    </div>
  )
}
