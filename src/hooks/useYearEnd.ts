// src/hooks/useYearEnd.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";

/**
 * This hook exposes Year-End / Tax posting actions as React Query mutations.
 * Usage:
 *   const { runFullYearEndClose, postDeferredTax, postECLMovement } = useYearEnd();
 *   await runFullYearEndClose.mutateAsync({ entityId, year });
 */
export function useYearEnd() {
  const qc = useQueryClient();

  const runFullYearEndClose = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      // If your DB function name differs, change it here.
      // Examples you might use:
      // - "run_enterprise_year_end"
      // - "close_financial_year_enterprise"
      const { data, error } = await supabase.rpc("run_enterprise_year_end", {
        p_entity_id: vars.entityId,
        p_year: vars.year,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.economicEvents(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.ecl(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.deferredTax(vars.entityId) }),
      ]);
    },
  });

  const postDeferredTax = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      // DB: post_deferred_tax_movement(p_entity uuid, p_year integer)
      const { data, error } = await supabase.rpc("post_deferred_tax_movement", {
        p_entity: vars.entityId,
        p_year: vars.year,
      });

      if (error) throw error;
      return data ?? true;
    },
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.deferredTax(vars.entityId) }),
      ]);
    },
  });

  const postECLMovement = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      // Your DB list shows: post_ecl_year_end(p_entity uuid, p_year integer) returns uuid
      const { data, error } = await supabase.rpc("post_ecl_year_end", {
        p_entity: vars.entityId,
        p_year: vars.year,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.ecl(vars.entityId) }),
      ]);
    },
  });

  return { runFullYearEndClose, postDeferredTax, postECLMovement };
}
