// src/hooks/useEconomicEvents.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";

type EffectInput = {
  account_id: string;
  amount: number;
  effect_sign: 1 | -1;
  tax_treatment?: string | null;
  deductible?: boolean;
};

type RecordEconomicEventParams = {
  entityId: string;
  eventType: string; // economic_event_type
  eventDate: string; // yyyy-mm-dd
  description?: string;
  effects: EffectInput[];
};

function toDateYYYYMMDD(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function normalizeEffects(effects: EffectInput[]): EffectInput[] {
  return effects.map((e) => ({
    ...e,
    amount: Math.abs(Number(e.amount) || 0),
    effect_sign: e.effect_sign === -1 ? -1 : 1,
    tax_treatment: e.tax_treatment ?? null,
    deductible: e.deductible ?? false,
  }));
}

export function useEconomicEvents() {
  const qc = useQueryClient();

  const recordEconomicEvent = useMutation({
    mutationFn: async (params: RecordEconomicEventParams): Promise<string> => {
      const { data, error } = await supabase.rpc("record_economic_event", {
        p_entity_id: params.entityId,
        p_event_type: params.eventType,
        p_event_date: toDateYYYYMMDD(params.eventDate),
        p_description: params.description ?? "",
        p_effects: normalizeEffects(params.effects),
      });

      if (error) throw error;
      return data as string; // event_id (uuid)
    },

    onSuccess: async (_eventId, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.economicEvents(vars.entityId) }),
      ]);
    },
  });

  return { recordEconomicEvent };
}