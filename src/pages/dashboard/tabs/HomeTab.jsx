import { useEffect, useState } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { getTotalIncome } from '../../../services/incomeService'
import { getTotalExpense } from '../../../services/expenseService'
import { queryEventsByEntity } from '../../../services/eventService'
import { eventEmitter } from '../../../lib/eventEmitter'

export default function HomeTab() {
  const { entity } = useEntity()
  const [summary, setSummary] = useState({
    cashBalance: 0,
    lastTransaction: null,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalIncome: 0,
    totalExpenses: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!entity) return

    loadSummary()
  }, [entity])

  // Subscribe to income/expense changes
  useEffect(() => {
    const unsubIncome = eventEmitter.on('INCOME_ADDED', loadSummary)
    const unsubExpense = eventEmitter.on('EXPENSE_ADDED', loadSummary)
    return () => {
      unsubIncome()
      unsubExpense()
    }
  }, [entity])

  async function loadSummary() {
    if (!entity) return
    setLoading(true)

    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      // Get total income and expenses all time
      const incomeResult = await getTotalIncome(entity.id)
      const expenseResult = await getTotalExpense(entity.id)

      // Get this month's income and expenses
      const monthlyIncomeResult = await getTotalIncome(entity.id, monthStart, monthEnd)
      const monthlyExpenseResult = await getTotalExpense(entity.id, monthStart, monthEnd)

      // Get last transaction
      const eventsResult = await queryEventsByEntity(entity.id, {
        limit: 1
      })

      const lastEvent = eventsResult.data?.[0]
      let lastTransaction = null
      if (lastEvent) {
        const eventType = lastEvent.event_type
        const isIncome = eventType === 'REVENUE_EARNED'
        lastTransaction = {
          id: lastEvent.id,
          type: isIncome ? 'income' : 'expense',
          amount: isIncome ? monthlyIncomeResult.total : monthlyExpenseResult.total,
          description: lastEvent.description || eventType,
          date: lastEvent.event_date
        }
      }

      const totalIncome = incomeResult.total || 0
      const totalExpenses = expenseResult.total || 0

      setSummary({
        cashBalance: totalIncome - totalExpenses,
        lastTransaction,
        monthlyIncome: monthlyIncomeResult.total || 0,
        monthlyExpenses: monthlyExpenseResult.total || 0,
        totalIncome,
        totalExpenses
      })
    } catch (error) {
      console.error('Error loading summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading summary…</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{entity?.name || 'Unknown Entity'}</h1>
        <p className="text-gray-600 text-sm">{entity?.type || 'Unknown'} Entity</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <p className="text-gray-600 text-sm mb-1">Cash Balance</p>
          <p className={`text-3xl font-bold ${(summary?.cashBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R {(summary?.cashBalance || 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Income: R {(summary?.totalIncome || 0).toFixed(2)} | Expenses: R {(summary?.totalExpenses || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white border rounded p-4">
          <p className="text-gray-600 text-sm mb-1">This Month</p>
          <div className="space-y-1">
            <p className="text-lg font-semibold">
              <span className="text-green-600">+R {(summary?.monthlyIncome || 0).toFixed(2)}</span>
            </p>
            <p className="text-lg font-semibold">
              <span className="text-orange-600">-R {(summary?.monthlyExpenses || 0).toFixed(2)}</span>
            </p>
            <p className="text-sm font-semibold mt-2">
              <span className={(summary?.monthlyIncome || 0) - (summary?.monthlyExpenses || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                = R {(((summary?.monthlyIncome || 0) - (summary?.monthlyExpenses || 0))).toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Last Transaction */}
      {summary?.lastTransaction && (
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-3">Last Transaction</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Type:</strong>{' '}
              <span className={summary?.lastTransaction?.type === 'income' ? 'text-green-600' : 'text-orange-600'}>
                {summary?.lastTransaction?.type === 'income' ? 'Income' : 'Expense'}
              </span>
            </p>
            <p>
              <strong>Amount:</strong> R {(summary?.lastTransaction?.amount || 0).toFixed(2)}
            </p>
            <p>
              <strong>Description:</strong> {summary?.lastTransaction?.description || 'N/A'}
            </p>
            <p className="text-gray-500">
              {new Date(summary?.lastTransaction?.date || new Date()).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
        <p className="text-blue-900">
          <strong>Event-Driven Ledger:</strong> All transactions are recorded as immutable economic events with full audit trail.
        </p>
      </div>
    </div>
  )
}
