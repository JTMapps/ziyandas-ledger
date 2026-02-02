import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function DashboardLayout({ children }) {
  const navigate = useNavigate()

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
      <aside className="w-56 bg-white border-r p-4 flex flex-col">
        <h1 className="text-lg font-bold mb-6">
          Ziyandas Ledger
        </h1>

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

      {/* Main content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
