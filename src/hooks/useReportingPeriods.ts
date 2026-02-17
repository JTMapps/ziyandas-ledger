import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useReportingPeriods(entityId: string) {
  // ------------------------------------------------------------
  // LOAD PERIODS
  // ------------------------------------------------------------
  const { data: periods = [], isLoading, refetch } = useQuery({
    queryKey: ["periods", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reporting_periods")
        .select("*")
        .eq("entity_id", entityId)
        .order("period_start", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // ------------------------------------------------------------
  // CREATE NEXT REPORTING PERIOD
  // Calls RPC: create_next_reporting_period(entity_id)
  // ------------------------------------------------------------
  const createNextPeriod = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc(
        "create_next_reporting_period",
        { p_entity_id: entityId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => refetch()
  });

  // ------------------------------------------------------------
  // IF NO PERIODS → create the first one automatically
  // ------------------------------------------------------------
  async function createIfMissing() {
    if (periods.length === 0) {
      await createNextPeriod.mutateAsync();
    }
  }

  return {
    periods,
    isLoading,
    createNextPeriod,
    createIfMissing,   // <-- This fixes your error
  };
}
