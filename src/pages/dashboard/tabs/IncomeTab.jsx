import { useEffect, useState } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { addIncome, getIncomeByEntity } from '../../../services/incomeService'
import { eventEmitter } from '../../../lib/eventEmitter'

export default function IncomeTab() {
  const { entity, loading: entityLoading } = useEntity()

  const [entries, setEntries] = useState([])
  const [amountNet, setAmountNet] = useState('')
  const [incomeClass, setIncomeClass] = useState('SALARY')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (entity) {
      loadIncome()
    }
  }, [entity])

  // Subscribe to income added events
  useEffect(() => {
    const unsubscribe = eventEmitter.on('INCOME_ADDED', () => {
      loadIncome()
    })
    return () => unsubscribe()
  }, [entity])

  async function loadIncome() {
    if (!entity) return
    
    const result = await getIncomeByEntity(entity.id, { limit: 100 })
    if (result.success) {
      setEntries(result.data)
      setError(null)
    } else {
      setError(result.error)
    }
  }

  async function handleAddIncome(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await addIncome({
      entityId: entity.id,
      dateReceived: new Date().toISOString().split('T')[0],
      amountNet: parseFloat(amountNet),
      incomeClass,
      description: description || incomeClass,
      taxTreatment: 'TAXABLE'
    })

    setLoading(false)

    if (result.success) {
      setAmountNet('')
      setIncomeClass('SALARY')
      setDescription('')
      // loadIncome will be called via INCOME_ADDED event listener
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
        Income — {entity.name}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleAddIncome} className="space-y-4 mb-6 border rounded p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            required
            placeholder="Amount (ZAR)"
            className="border p-2 rounded"
            step="0.01"
            min="0"
            value={amountNet}
            onChange={e => setAmountNet(e.target.value)}
          />

          <select
            value={incomeClass}
            onChange={e => setIncomeClass(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="SALARY">Salary</option>
            <option value="BUSINESS_INCOME">Business Income</option>
            <option value="INVESTMENT_INCOME">Investment Income</option>
            <option value="RENTAL_INCOME">Rental Income</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Description (optional)"
          className="border p-2 rounded w-full"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 w-full"
        >
          {loading ? 'Adding…' : 'Add Income'}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Recent Income</h2>
        {(entries || []).length === 0 ? (
          <p className="text-gray-500">No income entries yet</p>
        ) : (
          <ul className="space-y-2">
            {(entries || []).map(({ event, recognition }) => (
              <li key={event?.id || Math.random()} className="border p-4 rounded hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">
                      R {(recognition?.gross_amount || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {recognition?.income_class || 'OTHER'} • {event?.event_date || 'N/A'}
                    </div>
                    {event?.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {event.description}
                      </div>
                    )}
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Recorded
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
