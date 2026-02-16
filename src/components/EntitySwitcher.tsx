import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

interface EntityItem {
  id: string;
  name: string;
}

export default function EntitySwitcher() {
  const navigate = useNavigate();
  const { entityId } = useParams(); // read entity from URL
  const [open, setOpen] = useState(false);

  // -------------------------------
  // Load user + entity list
  // -------------------------------
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
    enabled: !!userQuery.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name")
        .eq("created_by", userQuery.data!.id)
        .order("name");

      if (error) throw error;
      return data as EntityItem[];
    }
  });

  if (entitiesQuery.isLoading || userQuery.isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-400">
        Loading entities…
      </div>
    );
  }

  if (!entitiesQuery.data || entitiesQuery.data.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-400">
        No entities found
      </div>
    );
  }

  const entities = entitiesQuery.data;
  const current = entities.find((e) => e.id === entityId);

  // -----------------------------------------
  // Handle selection of another entity
  // -----------------------------------------
  function selectEntity(id: string) {
    setOpen(false);
    navigate(`/entities/${id}/overview`);
  }

  return (
    <div className="relative inline-block text-left">
      {/* Current entity button */}
      <button
        className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 flex items-center space-x-2"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-medium">
          {current ? current.name : "Select Entity"}
        </span>
        <span className="text-gray-500">▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute mt-2 w-56 bg-white border shadow-lg rounded z-50">
          {entities.map((e) => (
            <button
              key={e.id}
              onClick={() => selectEntity(e.id)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                e.id === entityId ? "bg-gray-200 font-semibold" : ""
              }`}
            >
              {e.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
