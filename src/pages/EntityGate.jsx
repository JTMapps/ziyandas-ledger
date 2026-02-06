import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EntityGate() {
  const navigate = useNavigate()

  useEffect(() => {
    async function checkEntities() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('entities')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)

      if (error || !data || data.length === 0) {
        navigate('/entities/new', { replace: true })
      } else {
        navigate('/entities', { replace: true })
      }
    }

    checkEntities()
  }, [navigate])

  return <div className="p-6">Loading…</div>
}
