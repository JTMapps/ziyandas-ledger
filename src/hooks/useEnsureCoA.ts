// src/hooks/useEnsureCoA.ts
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useEnsureEntityAccounts } from "./useEnsureEntityAccounts";

type EntityLite = { id: string; type: string; industry_type: string | null };

export function useEnsureCoA(entityId?: string) {
  const ensure = useEnsureEntityAccounts();

  // Keep this query for screens that want entity info/caching.
  const entityQuery = useQuery<EntityLite>({
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
      return data as EntityLite;
    },
  });

  // ✅ ONLY depend on stable primitives/functions
  const mutateAsync = ensure.mutateAsync;
  const refetch = entityQuery.refetch;
  const cachedEntity = entityQuery.data;

  const ensureCoA = useCallback(async () => {
    if (!entityId) throw new Error("Missing entityId.");

    // Prefer cached, otherwise refetch once.
    let entity = cachedEntity;
    if (!entity) {
      const res = await refetch();
      entity = res.data as EntityLite | undefined;
    }

    if (!entity) throw new Error("Entity not loaded yet.");

    await mutateAsync({
      entityId: entity.id,
      entityType: entity.type, // must match DB enum tokens
    });
  }, [entityId, cachedEntity, refetch, mutateAsync]);

  return {
    entity: entityQuery.data,
    entityLoading: entityQuery.isLoading,
    entityError: entityQuery.error,
    ensuring: ensure.isPending,
    ensureError: ensure.error,
    ensureCoA,
  };
}