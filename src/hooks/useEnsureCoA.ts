// src/hooks/useEnsureCoA.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useEnsureEntityAccounts } from "./useEnsureEntityAccounts";

export function useEnsureCoA(entityId?: string) {
  const ensure = useEnsureEntityAccounts();

  const entityQuery = useQuery({
    queryKey: ["entity", entityId, "type"],
    enabled: !!entityId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, type, industry_type")
        .eq("id", entityId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  async function run() {
    if (!entityQuery.data) throw new Error("Entity not loaded yet.");
    await ensure.mutateAsync({
      entityId: entityQuery.data.id,
      entityType: entityQuery.data.type, // must match DB enum values: "Business" | "Personal"
    });
  }

  return {
    entity: entityQuery.data,
    entityLoading: entityQuery.isLoading,
    entityError: entityQuery.error,
    ensuring: ensure.isPending,
    ensureError: ensure.error,
    ensureCoA: run,
  };
}