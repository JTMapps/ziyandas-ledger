import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PERSONAL_ENTITY_ID = 'REPLACE_WITH_YOUR_ENTITY_ID'

const CATEGORIES = [
  'Food',
  'Transport',
  'Medical',
  'Clothing',
  'Business Equipment',
  'Education',
  'Housing',
  'Travel',
  'Donations',
  'Debt Payment',
  'Other',
]

export default function ExpensePage() {
  const [entries, setEntries] = useState([])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    const { data, error } = await supabase
      .from('expense_entries')
      .select('*')
      .order('date_spent', { ascending: false })

    if (!error) setEntries(data)
  }

  async function addExpense(e) {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('expense_entries').insert({
      user_id: user.id,
      entity_id: PERSONAL_ENTITY_ID,
      amount,
      category,
      description,
      date_spent: new Date(),
    })

    setLoading(false)
    setAmount('')
    setDescription('')
    setCategory('Food')

    if (!error) loadExpenses()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Expenses</h1>

      <form onSubmit={addExpense} className="flex gap-2 mb-6">
        <input
          type="number"
          required
          placeholder="Amount"
          className="border p-2"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <select
          className="border p-2"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

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
              {entry.amount} — {entry.category}
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
