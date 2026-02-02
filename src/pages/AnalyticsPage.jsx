import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AnalyticsPage() {
  const [incomeTotal, setIncomeTotal] = useState(0)
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [recentIncome, setRecentIncome] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    setLoading(true)

    const { data: income } = await supabase
      .from('income_entries')
      .select('amount_net')
    
    const { data: expenses } = await supabase
      .from('expense_entries')
      .select('amount')

    const { data: recentIncome } = await supabase
      .from('income_entries')
      .select('id, amount_net, description, date_received')
      .order('date_received', { ascending: false })
      .limit(5)

    const { data: recentExpenses } = await supabase
      .from('expense_entries')
      .select('id, amount, category, description, date_spent')
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

  if (loading) {
    return <div>Loading analytics…</div>
  }

  const net = incomeTotal - expenseTotal

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Analytics</h1>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded p-4 bg-white">
          <div className="text-sm text-gray-500">Total Income</div>
          <div className="text-xl font-semibold">
            {incomeTotal.toFixed(2)}
          </div>
        </div>

        <div className="border rounded p-4 bg-white">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-xl font-semibold">
            {expenseTotal.toFixed(2)}
          </div>
        </div>

        <div className="border rounded p-4 bg-white">
          <div className="text-sm text-gray-500">Net Position</div>
          <div
            className={`text-xl font-semibold ${
              net >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {net.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Recent Income</h2>
          <ul className="space-y-2">
            {recentIncome.map(i => (
              <li key={i.id} className="border p-2 rounded">
                <div>{i.amount_net}</div>
                <div className="text-sm text-gray-600">
                  {i.description}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Recent Expenses</h2>
          <ul className="space-y-2">
            {recentExpenses.map(e => (
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
      </div>
    </div>
  )
}
