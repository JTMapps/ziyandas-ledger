import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "../lib/supabase";

import AuthPage from "../pages/AuthPage";
import EntityGate from "../pages/EntityGate";
import EntitySetup from "./entity/EntityTemplateSetup";
import ProfilePage from "../pages/ProfilePage";
import EntityDashboard from "../pages/EntityDashboard";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Routes>
      {/* Authentication */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Initial landing → determines whether entity exists */}
      <Route path="/" element={<EntityGate />} />

      {/* Create new entity */}
      <Route path="/entities/new" element={<EntitySetup />} />

      {/* User profile */}
      <Route path="/profile" element={<ProfilePage />} />

      {/* Entity workspace (dashboard + industry operations + statements + accounts…) */}
      <Route path="/entities/:entityId/*" element={<EntityDashboard />} />
    </Routes>
  );
}
