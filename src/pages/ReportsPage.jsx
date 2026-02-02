import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  async function generateReport() {
    if (!from || !to) return

    setLoading(true)

    const { data: income } = await supabase
      .from('income_entries')
      .select('amount_net')
      .gte('date_received', from)
      .lte('date_received', to)

    const { data: expenses } = await supabase
      .from('expense_entries')
      .select('amount')
      .gte('date_spent', from)
      .lte('date_spent', to)

    const incomeTotal =
      income?.reduce((sum, i) => sum + Number(i.amount_net), 0) || 0

    const expenseTotal =
      expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

    setReport({
      incomeTotal,
      expenseTotal,
      net: incomeTotal - expenseTotal,
    })

    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Reports</h1>

      {/* Date Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="date"
          className="border p-2"
          value={from}
          onChange={e => setFrom(e.target.value)}
        />

        <input
          type="date"
          className="border p-2"
          value={to}
          onChange={e => setTo(e.target.value)}
        />

        <button
          onClick={generateReport}
          className="bg-black text-white px-4"
        >
          Generate
        </button>
      </div>

      {/* Report Output */}
      {loading && <div>Generating report…</div>}

      {report && !loading && (
        <div className="border rounded p-6 bg-white w-96">
          <div className="mb-2">
            <strong>Total Income:</strong>{' '}
            {report.incomeTotal.toFixed(2)}
          </div>

          <div className="mb-2">
            <strong>Total Expenses:</strong>{' '}
            {report.expenseTotal.toFixed(2)}
          </div>

          <div>
            <strong>Net Position:</strong>{' '}
            <span
              className={
                report.net >= 0 ? 'text-green-600' : 'text-red-600'
              }
            >
              {report.net.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
