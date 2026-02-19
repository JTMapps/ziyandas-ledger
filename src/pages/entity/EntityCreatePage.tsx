// src/pages/entity/EntityCreatePage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

type EntityType = "Business" | "Personal";

type CreateEntityInput = {
  name: string;
  type: EntityType;
};

export default function EntityCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>("Business");

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  const createEntityMutation = useMutation({
    mutationFn: async (input: CreateEntityInput) => {
      const trimmed = input.name.trim();
      if (!trimmed) throw new Error("Entity name is required.");

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!auth.user) throw new Error("Not authenticated.");

      const { data, error } = await supabase
        .from("entities")
        .insert([
          {
            name: trimmed,
            type: input.type,
            created_by: auth.user.id,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error("Entity created but no id returned.");

      return data.id as string;
    },

    onSuccess: async (entityId) => {
      // ✅ keep EntitySwitcher + EntityGate + any list in sync
      await queryClient.invalidateQueries({ queryKey: ["entities"] });

      // Next step: template selection
      navigate(`/entities/${entityId}/template`, { replace: true });
    },
  });

  function handleCreate() {
    if (!canSubmit || createEntityMutation.isPending) return;
    createEntityMutation.mutate({ name, type });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white border rounded shadow-sm p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Entity</h1>
          <p className="text-sm text-gray-600 mt-1">
            Next you’ll select a chart-of-accounts template and Ziyanda’s Ledger will configure the entity automatically.
          </p>
        </div>

        {createEntityMutation.error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
            {String((createEntityMutation.error as any)?.message ?? createEntityMutation.error)}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-gray-600">Entity Name</label>
          <input
            className="border rounded p-2 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ziyanda Consulting (Pty) Ltd"
            autoFocus
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
          disabled={!canSubmit || createEntityMutation.isPending}
          className="w-full py-3 rounded text-white font-bold bg-black disabled:opacity-50"
          type="button"
        >
          {createEntityMutation.isPending ? "Creating…" : "Create Entity"}
        </button>
      </div>
    </div>
  );
}
