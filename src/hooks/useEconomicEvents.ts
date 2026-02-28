// src/hooks/useEconomicEvents.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";
import type { EconomicEventType } from "../domain/events/eventTypes";
import {
  type EffectInput,
  toDateYYYYMMDD,
  normalizeEffects,
  assertBalanced,
} from "../lib/eventUtils";

export type { EffectInput };

export type RecordEconomicEventParams = {
  entityId: string;
  eventType: EconomicEventType;       // typed union, not loose string
  eventDate: string;                  // yyyy-mm-dd
  description?: string | null;
  effects: EffectInput[];
};

export type LedgerEventRow = {
  id: string;
  event_date: string;
  description: string | null;
  event_type: EconomicEventType | null;
  created_at: string;
};

// ─── Query: fetch events for an entity ───────────────────────────────────────
export function useEvents(entityId?: string) {
  return useQuery<LedgerEventRow[]>({
    queryKey: entityId ? qk.economicEvents(entityId) : ["economic-events", "disabled"],
    enabled: !!entityId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("economic_events_active")
        .select("id, event_date, description, event_type, created_at")
        .eq("entity_id", entityId!)
        .order("event_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as LedgerEventRow[];
    },
  });
}

// ─── Mutation: record a new economic event ───────────────────────────────────
export function useRecordEconomicEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: RecordEconomicEventParams): Promise<string> => {
      // Client-side validation — fail fast with clear messages before hitting DB
      if (!params.entityId)    throw new Error("entityId is required.");
      if (!params.eventType)   throw new Error("eventType is required.");
      if (params.effects.length < 2)
        throw new Error("At least 2 effect lines (debit + credit) are required.");

      const normalizedEffects = normalizeEffects(params.effects); // throws on bad lines
      assertBalanced(normalizedEffects);                          // throws if unbalanced

      const { data, error } = await supabase.rpc("record_economic_event", {
        p_entity_id:  params.entityId,
        p_event_type: params.eventType,
        p_event_date: toDateYYYYMMDD(params.eventDate),
        p_description: params.description ?? "",
        p_effects: normalizedEffects,
      });

      if (error) throw new Error(error.message);
      return data as string; // uuid of new event
    },

    onSuccess: async (_eventId, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.economicEvents(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),
      ]);
    },
  });
}

// ─── Legacy export: keep existing callers working ────────────────────────────
// Remove once all call sites are migrated to useRecordEconomicEvent()
export function useEconomicEvents() {
  return { recordEconomicEvent: useRecordEconomicEvent() };
}