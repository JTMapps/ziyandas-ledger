import { useEffect, useState } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { addExpense, getExpenseByEntity, getExpensesByCategory } from '../../../services/expenseService'
import { eventEmitter } from '../../../lib/eventEmitter'

const DEFAULT_CATEGORIES = [
  'OFFICE_SUPPLIES',
  'TRAVEL',
  'MEALS',
  'UTILITIES',
  'PROFESSIONAL_FEES',
  'VEHICLE_EXPENSES',
  'RENT',
  'INSURANCE',
  'EQUIPMENT',
  'OTHER'
]

export default function ExpensesTab() {
  const { entity, loading: entityLoading } = useEntity()

  const [entries, setEntries] = useState([])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [isTaxDeductible, setIsTaxDeductible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (entity) {
      loadExpenses()
    }
  }, [entity])

  // Subscribe to expense added events
  useEffect(() => {
    const unsubscribe = eventEmitter.on('EXPENSE_ADDED', () => {
      loadExpenses()
    })
    return () => unsubscribe()
  }, [entity])

  async function loadExpenses() {
    if (!entity) return
    
    const result = await getExpenseByEntity(entity.id, { limit: 100 })
    if (result.success) {
      setEntries(result.data)
      setError(null)
    } else {
      setError(result.error)
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await addExpense({
      entityId: entity.id,
      dateSpent: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount),
      category,
      isTaxDeductible,
      description: description || category,
      deductionTiming: isTaxDeductible ? 'IMMEDIATE' : 'NONE'
    })

    setLoading(false)

    if (result.success) {
      setAmount('')
      setCategory(DEFAULT_CATEGORIES[0])
      setDescription('')
      setIsTaxDeductible(false)
      // loadExpenses will be called via EXPENSE_ADDED event listener
    } else {
      setError(result.error)
    }
  }

  if (entityLoading) {
    return <div>Loading entity…</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        Expenses — {entity.name}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleAddExpense} className="space-y-4 mb-6 border rounded p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            required
            placeholder="Amount (ZAR)"
            className="border p-2 rounded"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />

          <select
            className="border p-2 rounded"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {DEFAULT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Description (optional)"
          className="border p-2 rounded w-full"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isTaxDeductible}
            onChange={e => setIsTaxDeductible(e.target.checked)}
            className="rounded"
          />
          <span>Tax Deductible</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 w-full"
        >
          {loading ? 'Adding…' : 'Add Expense'}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Recent Expenses</h2>
        {(entries || []).length === 0 ? (
          <p className="text-gray-500">No expense entries yet</p>
        ) : (
          <ul className="space-y-2">
            {(entries || []).map(({ event, recognition }) => (
              <li key={event?.id || Math.random()} className="border p-4 rounded hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">
                      R {(recognition?.amount || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {recognition?.expense_nature || 'OTHER'} • {event?.event_date || 'N/A'}
                    </div>
                    {event?.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {event.description}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    recognition?.deductible 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {recognition?.deductible ? 'Deductible' : 'Non-Deductible'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
