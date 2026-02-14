import { useEffect, useState } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { supabase } from '../../../lib/supabase'

export default function AnalyticsOverview() {
  const { entity } = useEntity()
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (entity) load()
  }, [entity])

  async function load() {
    setLoading(true)

    const { data } = await supabase
      .from('v_entity_financial_snapshot')
      .select('*')
      .eq('entity_id', entity.id)
      .single()

    setSnapshot(data)
    setLoading(false)
  }

  if (!entity) return null
  if (loading) return <div className="p-6">Loading...</div>
  if (!snapshot) return <div className="p-6">No data</div>

  return (
    <div className="p-6 grid grid-cols-3 gap-4">

      <Metric label="Income" value={snapshot.total_income} />
      <Metric label="Expenses" value={snapshot.total_expenses} />
      <Metric label="Net Profit" value={snapshot.net_profit} />

      <Metric label="Cash" value={snapshot.total_cash} />
      <Metric label="Assets" value={snapshot.total_assets} />
      <Metric label="Liabilities" value={snapshot.total_liabilities} />

      <Metric label="Equity" value={snapshot.total_equity} />
      <Metric label="Events" value={snapshot.event_count} />

    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="text-gray-600 text-sm">{label}</div>
      <div className="text-xl font-bold">
        {(value || 0)}
      </div>
    </div>
  )
}
