import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

interface EntityItem {
  id: string;
  name: string;
}

export default function EntitySwitcher() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // -------------------------------
  // Load user + entity list
  // -------------------------------
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
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
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!open) return;
      const el = containerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Escape closes dropdown
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (entitiesQuery.isLoading || userQuery.isLoading) {
    return <div className="px-3 py-2 text-sm text-gray-400">Loading entities…</div>;
  }

  if (entitiesQuery.error) {
    return (
      <div className="px-3 py-2 text-sm text-red-600">
        Failed to load entities:{" "}
        {String((entitiesQuery.error as any)?.message ?? entitiesQuery.error)}
      </div>
    );
  }

  if (!entitiesQuery.data || entitiesQuery.data.length === 0) {
    return <div className="px-3 py-2 text-sm text-gray-400">No entities found</div>;
  }

  const entities = entitiesQuery.data;
  const current = entities.find((e) => e.id === entityId);

  function selectEntity(nextId: string) {
    setOpen(false);
    navigate(`/entities/${nextId}/overview`);
  }

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <button
        type="button"
        className="w-full px-3 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 flex items-center justify-between"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium truncate">
          {current ? current.name : "Select Entity"}
        </span>
        <span className="text-gray-500 shrink-0 ml-2">▾</span>
      </button>

      {open && (
        <div
          className="absolute mt-2 w-full bg-white border shadow-lg rounded z-50 overflow-hidden"
          role="listbox"
        >
          {entities.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => selectEntity(e.id)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                e.id === entityId ? "bg-gray-200 font-semibold" : ""
              }`}
              role="option"
              aria-selected={e.id === entityId}
              title={e.name}
            >
              <span className="truncate block">{e.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
