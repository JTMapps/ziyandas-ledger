import { useNavigate } from 'react-router-dom'
import { useEntity } from '../../context/EntityContext'

export default function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const { entity } = useEntity()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r p-4 flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-bold">
            Ziyandas Ledger
          </h1>
        </div>

        {/* Back to Profile */}
        <div>
          <button
            onClick={() => navigate('/profile')}
            className="w-full text-left text-sm text-blue-600 hover:underline"
          >
            ← Back to Profile
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
