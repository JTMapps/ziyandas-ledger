import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import AuthPage from './AuthPage.jsx'
import IncomePage from './IncomePage'
import ExpensePage from './ExpensePage'
import AnalyticsPage from './AnalyticsPage'
import ReportsPage from './ReportsPage'
import DashboardLayout from '../components/layout/DashboardLayout'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading…
      </div>
    )
  }

  // Not logged in → auth page
  if (!session) {
    return <AuthPage />
  }

  // Logged in → app
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/income" replace />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/expenses" element={<ExpensePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </DashboardLayout>
  )
}