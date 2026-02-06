import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useEntity } from '../../context/EntityContext'

export default function HomeTab() {
  const { entity } = useEntity()
  const [summary, setSummary] = useState({
    cashBalance: 0,
    lastTransaction: null,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!entity) return

    async function loadSummary() {
      setLoading(true)

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]

      // Total income (all time)
      const { data: incomeData } = await supabase
        .from('income_entries')
        .select('amount_net')
        .eq('entity_id', entity.id)

      // Total expenses (all time)
      const { data: expenseData } = await supabase
        .from('expense_entries')
        .select('amount')
        .eq('entity_id', entity.id)

      // This month income
      const { data: monthlyIncomeData } = await supabase
        .from('income_entries')
        .select('amount_net')
        .eq('entity_id', entity.id)
        .gte('date_received', monthStart)

      // This month expenses
      const { data: monthlyExpenseData } = await supabase
        .from('expense_entries')
        .select('amount')
        .eq('entity_id', entity.id)
        .gte('date_spent', monthStart)

      // Last transaction
      const { data: allTransactions } = await supabase
        .from('income_entries')
        .select('id, amount_net as amount, description, date_received as date, type:cast(\'income\' as text)')
        .eq('entity_id', entity.id)
        .order('date_received', { ascending: false })
        .limit(1)

      const { data: expenseTransactions } = await supabase
        .from('expense_entries')
        .select('id, amount, category as description, date_spent as date, type:cast(\'expense\' as text)')
        .eq('entity_id', entity.id)
        .order('date_spent', { ascending: false })
        .limit(1)

      const allTx = [
        ...(allTransactions || []),
        ...(expenseTransactions || []),
      ].sort((a, b) => new Date(b.date) - new Date(a.date))[0]

      const totalIncome = incomeData?.reduce((sum, i) => sum + Number(i.amount_net), 0) || 0
      const totalExpenses = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      const monthlyIncome = monthlyIncomeData?.reduce((sum, i) => sum + Number(i.amount_net), 0) || 0
      const monthlyExpenses = monthlyExpenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

      setSummary({
        cashBalance: totalIncome - totalExpenses,
        lastTransaction: allTx,
        monthlyIncome,
        monthlyExpenses,
      })

      setLoading(false)
    }

    loadSummary()
  }, [entity])

  if (loading) {
    return <div className="p-6">Loading summary…</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{entity.name}</h1>
        <p className="text-gray-600 text-sm">{entity.type} Entity</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4">
          <p className="text-gray-600 text-sm mb-1">Cash Balance</p>
          <p className={`text-2xl font-bold ${summary.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary.cashBalance.toFixed(2)}
          </p>
        </div>

        <div className="bg-white border rounded p-4">
          <p className="text-gray-600 text-sm mb-1">This Month Income</p>
          <p className="text-2xl font-bold text-blue-600">
            ${summary.monthlyIncome.toFixed(2)}
          </p>
        </div>

        <div className="bg-white border rounded p-4">
          <p className="text-gray-600 text-sm mb-1">This Month Expenses</p>
          <p className="text-2xl font-bold text-orange-600">
            ${summary.monthlyExpenses.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Last Transaction */}
      {summary.lastTransaction && (
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-3">Last Transaction</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Type:</strong>{' '}
              <span className={summary.lastTransaction.type === 'income' ? 'text-green-600' : 'text-orange-600'}>
                {summary.lastTransaction.type === 'income' ? 'Income' : 'Expense'}
              </span>
            </p>
            <p>
              <strong>Amount:</strong> ${summary.lastTransaction.amount.toFixed(2)}
            </p>
            <p>
              <strong>Description:</strong> {summary.lastTransaction.description}
            </p>
            <p className="text-gray-500">
              {new Date(summary.lastTransaction.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
