import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EntitySetup() {
  const [name, setName] = useState('')
  const [type, setType] = useState('Personal')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
      navigate(`/entities/${data.id}`, { replace: true })
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
          <option value="Personal">Personal</option>
          <option value="Trust">Trust</option>
          <option value="Holding">Holding</option>
          <option value="Business">Business</option>
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
