import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

import AuthPage from './AuthPage'
import EntityGate from './EntityGate'
import EntitySetup from './EntitySetup'
import ProfilePage from './ProfilePage'
import EntityDashboard from './EntityDashboard'

export default function App() {
  const [session, setSession] = useState<null | any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => authListener.subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading…</div>
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<EntityGate />} />

      <Route path="/entities/new" element={<EntitySetup />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/entities/:entityId/*" element={<EntityDashboard />} />
    </Routes>
  )
}
