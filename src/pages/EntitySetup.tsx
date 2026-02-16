import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export default function EntitySetup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<string>("Business");

  // --- Load enum types (entity_type) ---
  const entityTypesQuery = useQuery({
    queryKey: ["entity-types"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_enum_values", {
        type_name: "entity_type"
      });
      if (error) throw error;
      return data.map((d: any) => d.value);
    }
  });

  // --- Load user ---
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    }
  });

  // --- Entity creation mutation ---
  const createEntity = useMutation({
    mutationFn: async () => {
      if (!userQuery.data) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("entities")
        .insert({
          name,
          type: selectedType,
          created_by: userQuery.data.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (entity) => {
      navigate(`/entities/${entity.id}/overview`, { replace: true });
    }
  });

  // --- Pre-select first enum when loaded ---
  useEffect(() => {
    if (entityTypesQuery.data && entityTypesQuery.data.length > 0) {
      setSelectedType(entityTypesQuery.data[0]);
    }
  }, [entityTypesQuery.data]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createEntity.mutate();
        }}
        className="bg-white shadow-md border rounded p-6 w-96 space-y-4"
      >
        <h1 className="text-xl font-bold">Create Your Entity</h1>

        {/* ENTITY NAME */}
        <input
          required
          placeholder="Entity name"
          className="w-full border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* ENTITY TYPE */}
        <select
          className="w-full border p-2 rounded"
          disabled={entityTypesQuery.isLoading}
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {entityTypesQuery.data?.map((t: string) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* SUBMIT BUTTON */}
        <button
          disabled={createEntity.isPending}
          className="w-full bg-black text-white p-2 rounded"
        >
          {createEntity.isPending ? "Creating…" : "Create Entity"}
        </button>
      </form>
    </div>
  );
}
