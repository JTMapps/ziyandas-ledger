import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";

type RecordEconomicEventParams = {
  entityId: string;
  eventType: string;   // economic_event_type enum value
  eventDate: string;   // ISO yyyy-mm-dd
  description?: string;
  effects: Array<{
    account_id: string;
    amount: number;
    effect_sign: number; // 1 or -1
    tax_treatment?: string | null;
    deductible?: boolean;
  }>;
};

export function useEconomicEvents() {
  const qc = useQueryClient();

  const recordEconomicEvent = useMutation({
    mutationFn: async (params: RecordEconomicEventParams): Promise<string> => {
      const { data, error } = await supabase.rpc("record_economic_event", {
        p_entity_id: params.entityId,
        p_event_type: params.eventType,
        p_event_date: params.eventDate,
        p_description: params.description ?? "",
        p_effects: params.effects, // jsonb array
      });

      if (error) throw error;
      return data as string; // event_id
    },

    onSuccess: async (_eventId, vars) => {
      // Anything derived from effects should refresh
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),
        // statements are keyed by (entityId, periodId, type) so we can't target a single one safely.
        // If you want a clean sweep, add a higher-level key later like ["statements", entityId].
      ]);
    },
  });

  return { recordEconomicEvent };
}
