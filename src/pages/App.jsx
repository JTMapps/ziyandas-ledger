import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from '../lib/supabase'

import AuthPage from './AuthPage'
import EntityGate from './EntityGate'
import EntitySetup from './EntitySetup'
import ProfilePage from './ProfilePage'
import EntityDashboard from './EntityDashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading…</div>
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <Routes>
      <Route path="/" element={<EntityGate />} />
      <Route path="/entities/new" element={<EntitySetup />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/entities/:entityId/*" element={<EntityDashboard />} />
    </Routes>
  )
}
