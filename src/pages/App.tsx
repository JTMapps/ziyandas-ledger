// src/pages/App.tsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

import AuthPage from "./AuthPage";
import EntityGate from "./EntityGate";
import EntityCreatePage from "./entity//EntityCreatePage";
import EntityTemplateSetup from "./entity/EntityTemplateSetup";
import ProfilePage from "./ProfilePage";
import EntityDashboard from "./EntityDashboard";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    // Initial session fetch
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error("getSession error:", error);
        setSession(data.session);
        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        console.error("getSession exception:", e);
        setSession(null);
        setLoading(false);
      });

    // Auth state listener
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  // Unauthenticated app surface:
  // keep /auth routable, but default to AuthPage
  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Authenticated app surface
  return (
    <Routes>
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="/" element={<EntityGate />} />
      <Route path="/entities/new" element={<EntityCreatePage />} />
      <Route path="/entities/:entityId/template" element={<EntityTemplateSetup />} />

      <Route path="/profile" element={<ProfilePage />} />

      {/* Unified enterprise dashboard */}
      <Route path="/entities/:entityId/*" element={<EntityDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
