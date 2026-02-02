import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useEntity } from '../../context/EntityContext'

export default function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const { entities, entity, setEntity, loading } = useEntity()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    isActive
      ? 'font-semibold text-black'
      : 'text-gray-600 hover:text-black'

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r p-4 flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-bold">
            Ziyandas Ledger
          </h1>
        </div>

        {/* Entity Switcher */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Active Entity
          </label>

          {loading ? (
            <div className="text-sm text-gray-400">
              Loading…
            </div>
          ) : (
            <select
              value={entity?.id || ''}
              onChange={e => setEntity(e.target.value)}
              className="w-full border p-2 text-sm rounded"
            >
              {entities.map(ent => (
                <option key={ent.id} value={ent.id}>
                  {ent.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3">
          <NavLink to="/income" className={linkClass}>
            Income
          </NavLink>
          <NavLink to="/expenses" className={linkClass}>
            Expenses
          </NavLink>
          <NavLink to="/analytics" className={linkClass}>
            Analytics
          </NavLink>
          <NavLink to="/reports" className={linkClass}>
            Reports
          </NavLink>
        </nav>

        <div className="mt-auto pt-6 border-t">
          <button
            onClick={handleSignOut}
            className="text-sm text-red-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
