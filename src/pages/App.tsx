import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import AuthPage from "./AuthPage";
import EntityGate from "./EntityGate";
import EntityTemplateSetup from "./entity/EntityTemplateSetup";
import ProfilePage from "./ProfilePage";
import EntityDashboard from "./EntityDashboard";
import type { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      {/* Home / Entity selector */}
      <Route path="/" element={<EntityGate />} />

      {/* Create entity */}
      <Route path="/entities/new" element={<EntityTemplateSetup />} />

      {/* User profile */}
      <Route path="/profile" element={<ProfilePage />} />

      {/* Entity dashboard with nested routes */}
      <Route path="/entities/:entityId/*" element={<EntityDashboard />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
