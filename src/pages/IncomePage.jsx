import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PERSONAL_ENTITY_ID = 'REPLACE_WITH_YOUR_ENTITY_ID'

export default function IncomePage() {
  const [entries, setEntries] = useState([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadIncome()
  }, [])

  async function loadIncome() {
    const { data, error } = await supabase
      .from('income_entries')
      .select('*')
      .order('date_received', { ascending: false })

    if (!error) setEntries(data)
  }

  async function addIncome(e) {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('income_entries').insert({
      user_id: user.id,
      entity_id: PERSONAL_ENTITY_ID,
      amount_net: amount,
      description,
      date_received: new Date(),
    })

    setLoading(false)
    setAmount('')
    setDescription('')

    if (!error) loadIncome()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Income</h1>

      <form onSubmit={addIncome} className="flex gap-2 mb-6">
        <input
          type="number"
          required
          placeholder="Amount"
          className="border p-2"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <input
          type="text"
          placeholder="Description"
          className="border p-2 flex-1"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {entries.map(entry => (
          <li key={entry.id} className="border p-2 rounded">
            <div className="font-medium">
              {entry.amount_net}
            </div>
            <div className="text-sm text-gray-600">
              {entry.description}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
