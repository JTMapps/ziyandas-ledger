// src/hooks/useEnsureCoA.ts
//
// ─── THE BUG THIS FIXES ─────────────────────────────────────────────────────
// The previous version had `cachedEntity` (entityQuery.data) in the
// useCallback deps array. Since `cachedEntity` is an object, TanStack Query
// produces a new reference on every render that touches the cache. That means:
//
//   entityQuery.data changes reference
//   → new ensureCoA function created
//   → GeneralCaptureWizard's useEffect sees new ensureCoA in deps
//   → effect re-runs → ensureCoA() called again
//   → repeat until browser collapses (ERR_INSUFFICIENT_RESOURCES)
//
// The fix: never put the entity object in useCallback deps.
// Instead, read it inside the callback via a ref (entityRef), which is always
// stable. The ref is updated in a layout effect so it's always current.
//
// ─── GUARANTEES ─────────────────────────────────────────────────────────────
//   • ensureCoA is referentially stable for the lifetime of the component
//     (only recreated when entityId changes)
//   • No object references in useCallback deps
//   • Safe under React StrictMode double-invoke
//   • ensureError and ensuring are always current

import { useCallback, useLayoutEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useEnsureEntityAccounts } from "./useEnsureEntityAccounts";

type EntityLite = { id: string; type: string; industry_type: string | null };

export function useEnsureCoA(entityId?: string) {
  const ensure = useEnsureEntityAccounts();

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

  // ── Stable ref to the latest entity data ──────────────────────────────────
  // Using a ref means ensureCoA can read the latest value WITHOUT depending
  // on it in the useCallback dep array.
  const entityRef = useRef<EntityLite | undefined>(undefined);

  useLayoutEffect(() => {
    entityRef.current = entityQuery.data;
  });

  // ── Stable refs for the mutation functions ────────────────────────────────
  // mutateAsync and refetch are already stable from TanStack Query but we pin
  // them via refs for absolute safety — no surprises if that changes.
  const mutateAsyncRef = useRef(ensure.mutateAsync);
  const refetchRef = useRef(entityQuery.refetch);

  useLayoutEffect(() => {
    mutateAsyncRef.current = ensure.mutateAsync;
    refetchRef.current = entityQuery.refetch;
  });

  // ── ensureCoA — stable forever (only changes when entityId changes) ───────
  const ensureCoA = useCallback(async () => {
    if (!entityId) throw new Error("Missing entityId.");

    // Read current entity from ref — never causes a dep change
    let entity = entityRef.current;

    if (!entity) {
      const res = await refetchRef.current();
      entity = res.data as EntityLite | undefined;
    }

    if (!entity) throw new Error("Entity could not be loaded.");

    await mutateAsyncRef.current({
      entityId: entity.id,
      entityType: entity.type,
    });
  }, [entityId]); // ← ONLY entityId. No objects. No functions. Stable.

  return {
    entity: entityQuery.data,
    entityLoading: entityQuery.isLoading,
    entityError: entityQuery.error,
    ensuring: ensure.isPending,
    ensureError: ensure.error,
    ensureCoA,
  };
}