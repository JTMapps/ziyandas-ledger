// src/pages/entity/EntityCreatePage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type EntityType = "Business" | "Personal";

export default function EntityCreatePage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>("Business");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    try {
      setError(null);

      if (!name.trim()) throw new Error("Entity name is required.");

      setCreating(true);

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!auth.user) throw new Error("Not authenticated.");

      const { data, error } = await supabase
        .from("entities")
        .insert([
          {
            name: name.trim(),
            type,
            created_by: auth.user.id,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      const entityId = data.id as string;

      // Next step: template selection
      navigate(`/entities/${entityId}/template`, { replace: true });
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white border rounded shadow-sm p-6 space-y-6">
        <h1 className="text-2xl font-bold">Create Entity</h1>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Entity Name</label>
          <input
            className="border rounded p-2 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ziyanda Consulting (Pty) Ltd"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Entity Type</label>
          <select
            className="border rounded p-2 w-full"
            value={type}
            onChange={(e) => setType(e.target.value as EntityType)}
          >
            <option value="Business">Business</option>
            <option value="Personal">Personal</option>
          </select>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full py-3 rounded text-white font-bold bg-black disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create Entity"}
        </button>

        <div className="text-xs text-gray-500">
          Next you’ll select a chart-of-accounts template and Ziyanda’s Ledger will configure the entity automatically.
        </div>
      </div>
    </div>
  );
}
