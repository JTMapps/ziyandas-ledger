import { useEffect, useState, useCallback } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { supabase } from '../../../lib/supabase'

export default function AnalyticsOverview() {
  const { entity } = useEntity()

  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!entity) return

    setLoading(true)

    const { data } = await supabase.rpc('get_entity_snapshot', {
      p_entity_id: entity.id
    })

    setSnapshot(data)
    setLoading(false)
  }, [entity])

  useEffect(() => {
    load()
  }, [load])

  if (!entity) return null
  if (loading) return <div className="p-6">Loading...</div>
  if (!snapshot) return <div className="p-6">No data</div>

  return (
    <div className="p-6 grid grid-cols-3 gap-4">

      <Metric label="Income" value={Math.abs(snapshot.total_income)} />
      <Metric label="Expenses" value={snapshot.total_expense} />
      <Metric label="Net Profit" value={snapshot.net_profit} />

      <Metric label="Assets" value={snapshot.total_assets} />
      <Metric label="Liabilities" value={Math.abs(snapshot.total_liabilities)} />
      <Metric label="Equity" value={snapshot.total_equity} />

    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="text-gray-600 text-sm">{label}</div>
      <div className="text-xl font-bold">
        {new Intl.NumberFormat().format(value || 0)}
      </div>
    </div>
  )
}
