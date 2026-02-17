import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useReportingPeriods(entityId: string) {
  const periods = useQuery({
    queryKey: ["periods", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_reporting_periods", {
        p_entity_id: entityId,
      });
      if (error) throw error;
      return data || [];
    },
  });

  const createNextPeriod = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_or_create_current_period",
        { p_entity_id: entityId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => periods.refetch(),
  });

  return {
    periods: periods.data,
    isLoading: periods.isLoading,
    createNextPeriod,
  };
}
