import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useEntity } from '../../../context/EntityContext'

const DEFAULT_CATEGORIES = [
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

export default function ExpensesTab() {
  const { entity, loading: entityLoading } = useEntity()

  const [entries, setEntries] = useState([])
  const [amount, setAmount] = useState('')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (entity) {
      loadExpenses()
    }
  }, [entity])

  useEffect(() => {
    async function loadCategories() {
      // Try RPC for enum values first
      try {
        const { data, error } = await supabase.rpc('get_enum_values', { type_name: 'expense_category' })
        if (!error && data && data.length > 0) {
          const vals = data.map(d => d.value)
          setCategories(vals)
          setCategory(vals[0])
          return
        }
      } catch (e) {
        // fallthrough
      }

      // Fallback: try to derive from existing expense entries
      try {
        const { data } = await supabase
          .from('expense_entries')
          .select('category')
          .neq('category', null)
          .order('category')

        if (data && data.length > 0) {
          const unique = Array.from(new Set(data.map(d => d.category))).sort()
          setCategories(unique)
          setCategory(unique[0])
          return
        }
      } catch (e) {
        // fallthrough to defaults
      }

      setCategories(DEFAULT_CATEGORIES)
      setCategory(DEFAULT_CATEGORIES[0])
    }

    loadCategories()
  }, [])

  async function loadExpenses() {
    const { data, error } = await supabase
      .from('expense_entries')
      .select('*')
      .eq('entity_id', entity.id)
      .order('date_spent', { ascending: false })

    if (!error) {
      setEntries(data || [])
    }
  }

  async function addExpense(e) {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('expense_entries').insert({
      user_id: user.id,
      entity_id: entity.id,
      amount,
      category,
      description,
      date_spent: new Date().toISOString().split('T')[0],
    })

    setLoading(false)
    setAmount('')
    setDescription('')
    setCategory(categories?.[0] || DEFAULT_CATEGORIES[0])

    if (!error) {
      loadExpenses()
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
          {categories.map(cat => (
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
          {loading ? 'Adding…' : 'Add'}
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
