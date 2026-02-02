import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEntity } from '../context/EntityContext'

export default function AnalyticsPage() {
  const { entity } = useEntity()

  const [incomeTotal, setIncomeTotal] = useState(0)
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [recentIncome, setRecentIncome] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (entity?.id) {
      loadAnalytics()
    }
  }, [entity?.id])

  async function loadAnalytics() {
    setLoading(true)

    // Totals
    const { data: income } = await supabase
      .from('income_entries')
      .select('amount_net')
      .eq('entity_id', entity.id)

    const { data: expenses } = await supabase
      .from('expense_entries')
      .select('amount')
      .eq('entity_id', entity.id)

    // Recent
    const { data: recentIncome } = await supabase
      .from('income_entries')
      .select('id, amount_net, description, date_received')
      .eq('entity_id', entity.id)
      .order('date_received', { ascending: false })
      .limit(5)

    const { data: recentExpenses } = await supabase
      .from('expense_entries')
      .select('id, amount, category, description, date_spent')
      .eq('entity_id', entity.id)
      .order('date_spent', { ascending: false })
      .limit(5)

    setIncomeTotal(
      income?.reduce((sum, i) => sum + Number(i.amount_net), 0) || 0
    )

    setExpenseTotal(
      expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
    )

    setRecentIncome(recentIncome || [])
    setRecentExpenses(recentExpenses || [])
    setLoading(false)
  }

  if (!entity) {
    return <div>Select an entity to view analytics.</div>
  }

  if (loading) {
    return <div>Loading analytics…</div>
  }

  const net = incomeTotal - expenseTotal

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">
        Analytics — {entity.name}
      </h1>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Total Income" value={incomeTotal} />
        <Stat label="Total Expenses" value={expenseTotal} />
        <Stat
          label="Net Position"
          value={net}
          positive={net >= 0}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        <RecentIncome items={recentIncome} />
        <RecentExpenses items={recentExpenses} />
      </div>
    </div>
  )
}

/* ---------- Small helpers (optional but clean) ---------- */

function Stat({ label, value, positive = true }) {
  return (
    <div className="border rounded p-4 bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div
        className={`text-xl font-semibold ${
          label === 'Net Position'
            ? positive
              ? 'text-green-600'
              : 'text-red-600'
            : ''
        }`}
      >
        {value.toFixed(2)}
      </div>
    </div>
  )
}

function RecentIncome({ items }) {
  return (
    <div>
      <h2 className="font-semibold mb-2">Recent Income</h2>
      <ul className="space-y-2">
        {items.map(i => (
          <li key={i.id} className="border p-2 rounded">
            <div>{i.amount_net}</div>
            <div className="text-sm text-gray-600">
              {i.description}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RecentExpenses({ items }) {
  return (
    <div>
      <h2 className="font-semibold mb-2">Recent Expenses</h2>
      <ul className="space-y-2">
        {items.map(e => (
          <li key={e.id} className="border p-2 rounded">
            <div>
              {e.amount} — {e.category}
            </div>
            <div className="text-sm text-gray-600">
              {e.description}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
