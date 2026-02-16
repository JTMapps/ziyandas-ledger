import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export default function EntityGate() {
  const navigate = useNavigate();

  // --- Fetch authenticated user ---
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    }
  });

  const entitiesQuery = useQuery({
    queryKey: ["entities"],
    enabled: !!userQuery.data, // only fetch after user resolved
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name")
        .eq("created_by", userQuery.data!.id);

      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (userQuery.isLoading || entitiesQuery.isLoading) return;

    if (!userQuery.data) {
      navigate("/auth", { replace: true });
      return;
    }

    const entities = entitiesQuery.data;

    if (!entities || entities.length === 0) {
      navigate("/entities/new", { replace: true });
      return;
    }

    // Default to the first entity (common enterprise pattern)
    navigate(`/entities/${entities[0].id}/overview`, { replace: true });
  }, [userQuery, entitiesQuery, navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading entities…</div>
    </div>
  );
}
