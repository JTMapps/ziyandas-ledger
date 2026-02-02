import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEntity } from '../context/EntityContext'

export default function ReportsPage() {
  const { entity } = useEntity()

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setReport(null) // reset when entity changes
  }, [entity?.id])

  async function generateReport() {
    if (!from || !to || !entity) return

    setLoading(true)

    const { data: income } = await supabase
      .from('income_entries')
      .select('amount_net')
      .eq('entity_id', entity.id)
      .gte('date_received', from)
      .lte('date_received', to)

    const { data: expenses } = await supabase
      .from('expense_entries')
      .select('amount')
      .eq('entity_id', entity.id)
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

  if (!entity) {
    return <div>Select an entity to generate reports.</div>
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">
        Reports — {entity.name}
      </h1>

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

      {loading && <div>Generating report…</div>}

      {report && !loading && (
        <div className="border rounded p-6 bg-white w-96">
          <ReportRow
            label="Total Income"
            value={report.incomeTotal}
          />
          <ReportRow
            label="Total Expenses"
            value={report.expenseTotal}
          />
          <ReportRow
            label="Net Position"
            value={report.net}
            highlight
          />
        </div>
      )}
    </div>
  )
}

function ReportRow({ label, value, highlight }) {
  return (
    <div className="mb-2">
      <strong>{label}:</strong>{' '}
      <span
        className={
          highlight
            ? value >= 0
              ? 'text-green-600'
              : 'text-red-600'
            : ''
        }
      >
        {value.toFixed(2)}
      </span>
    </div>
  )
}
