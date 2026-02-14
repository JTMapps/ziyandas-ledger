import { useState } from 'react'
import { recordEconomicEvent } from '../../domain/events/eventOrchestrator'
import {
  revenueEarned,
  expenseIncurred,
  assetAcquiredWithCash,
  liabilityIncurred
} from '../../domain/events/eventTemplates'

export default function EventModal({ entity, onClose }) {
  const [step, setStep] = useState(1)
  const [eventType, setEventType] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  function buildTemplate(numericAmount) {
    switch (eventType) {
      case 'REVENUE_EARNED':
        return revenueEarned({ amount: numericAmount })
      case 'EXPENSE_INCURRED':
        return expenseIncurred({ amount: numericAmount })
      case 'ASSET_ACQUIRED':
        return assetAcquiredWithCash({ amount: numericAmount })
      case 'LIABILITY_INCURRED':
        return liabilityIncurred({ amount: numericAmount })
      default:
        throw new Error('Please select an event type')
    }
  }

  function generatePreview() {
    try {
      const numericAmount = parseFloat(amount)

      if (!numericAmount || numericAmount <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      const template = buildTemplate(numericAmount)
      setPreview(template)
      setStep(3)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSubmit() {
    try {
      setLoading(true)
      setError(null)

      await recordEconomicEvent({
        entityId: entity.id,
        eventType: preview.eventType,
        eventDate: today,
        description,
        effects: preview.effects
      })

      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded p-6 space-y-6">

        <h2 className="text-xl font-bold">Record Economic Event</h2>

        {step === 1 && (
          <>
            <select
              className="w-full border rounded p-2"
              value={eventType}
              onChange={e => setEventType(e.target.value)}
            >
              <option value="">Select Event Type</option>
              <option value="REVENUE_EARNED">Revenue Earned</option>
              <option value="EXPENSE_INCURRED">Expense Incurred</option>
              <option value="ASSET_ACQUIRED">Asset Acquired</option>
              <option value="LIABILITY_INCURRED">Liability Incurred</option>
            </select>

            <div className="flex justify-end">
              <button
                disabled={!eventType}
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-black text-white rounded"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="number"
              placeholder="Amount"
              className="w-full border rounded p-2"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />

            <textarea
              placeholder="Description (optional)"
              className="w-full border rounded p-2"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border rounded"
              >
                Back
              </button>
              <button
                onClick={generatePreview}
                className="px-4 py-2 bg-black text-white rounded"
              >
                Preview Impact
              </button>
            </div>
          </>
        )}

        {step === 3 && preview && (
          <>
            <div className="border rounded p-4 space-y-2 text-sm bg-gray-50">
              <div className="font-medium">
                {preview.eventType}
              </div>

              {preview.effects.map((effect, i) => (
                <div key={i} className="flex justify-between">
                  <span>{effect.effect_type}</span>
                  <span>
                    {effect.effect_sign > 0 ? '+' : '-'}
                    {new Intl.NumberFormat().format(effect.amount)}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border rounded"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-black text-white rounded"
              >
                {loading ? 'Recording…' : 'Confirm & Record'}
              </button>
            </div>
          </>
        )}

        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}
