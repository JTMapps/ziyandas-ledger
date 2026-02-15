import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ARCHETYPES } from '../../domain/events/archetypes'

export default function EventModal({ entity, onClose }) {
  const [category, setCategory] = useState('')
  const [archetype, setArchetype] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const selectedItems = category
    ? ARCHETYPES[category]?.items || []
    : []

  const selectedArchetype = selectedItems.find(
    item => item.value === archetype
  )

  const numericAmount = Number(amount)
  const previewEffects =
    selectedArchetype && numericAmount > 0
      ? selectedArchetype.buildEffects(numericAmount)
      : []

  async function handleSubmit() {
    try {
      if (!selectedArchetype || numericAmount <= 0) {
        throw new Error('Complete all fields')
      }

      setLoading(true)
      setError(null)

      const { error: rpcError } = await supabase.rpc(
        'record_economic_event',
        {
          p_entity_id: entity.id,
          p_event_type: selectedArchetype.value,
          p_event_date: today,
          p_description: description || null,
          p_effects: previewEffects
        }
      )

      if (rpcError) throw rpcError

      onClose()

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded p-6 space-y-6">

        <h2 className="text-xl font-bold">Record Event</h2>

        <select
          value={category}
          onChange={e => {
            setCategory(e.target.value)
            setArchetype(null)
          }}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Category</option>
          {Object.entries(ARCHETYPES).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>

        {category && (
          <select
            value={archetype || ''}
            onChange={e => setArchetype(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Event Type</option>
            {selectedItems.map(item => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        )}

        <input
          type="number"
          placeholder="Amount"
          className="w-full border p-2 rounded"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <textarea
          placeholder="Description (optional)"
          className="w-full border p-2 rounded"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {previewEffects.length > 0 && (
          <div className="bg-gray-50 p-4 rounded text-sm space-y-1">
            {previewEffects.map((e, i) => (
              <div key={i} className="flex justify-between">
                <span>{e.effect_type}</span>
                <span>
                  {e.effect_sign > 0 ? '+' : '-'} {e.amount}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex justify-between">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {loading ? 'Posting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
