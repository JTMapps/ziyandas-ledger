import { useNavigate } from 'react-router-dom'
import { useEntity } from '../../context/EntityContext'

export default function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const { entity } = useEntity()

  return (
    <div className="min-h-screen bg-gray-50">

      {/* GLOBAL HEADER */}
      <div className="bg-white border-b px-6 py-4 space-y-2">

        <h1 className="text-xl font-bold">
          Ziyandas Ledger
        </h1>

        {entity && (
          <>
            <div className="text-lg font-semibold">
              {entity.name}{' '}
              <span className="text-gray-500">
                ({entity.type})
              </span>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Profile
            </button>
          </>
        )}
      </div>

      {/* MAIN CONTENT */}
      <main className="p-6">
        {children}
      </main>

    </div>
  )
}
