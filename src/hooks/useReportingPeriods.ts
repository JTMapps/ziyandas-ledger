// src/hooks/useReportingPeriods.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";

export type ReportingPeriod = {
  id: string;
  entity_id: string;
  period_start: string;
  period_end: string;
  is_closed: boolean;
};

type PeriodType = "MONTHLY" | "QUARTERLY" | "ANNUAL";

export function useReportingPeriods(entityId?: string, periodType: PeriodType = "MONTHLY") {
  const qc = useQueryClient();
  const enabled = !!entityId;

  const periodsQuery = useQuery<ReportingPeriod[]>({
    queryKey: enabled ? qk.periods(entityId!) : ["periods", "disabled"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reporting_periods")
        .select("id, entity_id, period_start, period_end, is_closed")
        .eq("entity_id", entityId!)
        .order("period_start", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ReportingPeriod[];
    },
  });

  const createNextPeriod = useMutation({
    mutationFn: async () => {
      if (!entityId) throw new Error("Missing entityId");

      // ✅ DB signature: create_next_reporting_period(p_entity_id uuid, p_period_type text)
      const { data, error } = await supabase.rpc("create_next_reporting_period", {
        p_entity_id: entityId,
        p_period_type: periodType,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      if (!entityId) return;
      await qc.invalidateQueries({ queryKey: qk.periods(entityId) });
    },
  });

  const ensureCurrentPeriod = useMutation({
    mutationFn: async () => {
      if (!entityId) throw new Error("Missing entityId");
      const { data, error } = await supabase.rpc("get_or_create_current_period", {
        p_entity_id: entityId,
      });
      if (error) throw error;
      return data as string; // period_id
    },
    onSuccess: async () => {
      if (!entityId) return;
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.periods(entityId) }),
        qc.invalidateQueries({ queryKey: qk.currentPeriod(entityId) }),
      ]);
    },
  });

  async function createIfMissing() {
    const periods = periodsQuery.data ?? [];
    if (periods.length === 0) {
      await createNextPeriod.mutateAsync();
      return true;
    }
    return false;
  }

  return {
    periodsQuery,
    periods: periodsQuery.data ?? [],
    createNextPeriod,
    createIfMissing,
    ensureCurrentPeriod,
  };
}