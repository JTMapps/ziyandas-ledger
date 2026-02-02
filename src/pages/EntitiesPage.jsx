import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EntitiesPage() {
  const [entities, setEntities] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('entities')
        .select('*')
        .order('created_at')

      setEntities(data || [])
    }

    load()
  }, [])

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Your Entities</h1>

      <ul className="space-y-2">
        {entities.map(e => (
          <li
            key={e.id}
            className="border p-3 rounded cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/entities/${e.id}`)}
          >
            <div className="font-medium">{e.name}</div>
            <div className="text-sm text-gray-600">{e.type}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
