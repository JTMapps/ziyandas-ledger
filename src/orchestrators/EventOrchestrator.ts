// src/orchestrators/EventOrchestrator.ts
import { supabase } from "../lib/supabase";
import { eventEmitter } from "../lib/eventEmitter";

export interface EconomicEventEffect {
  account_id: string;          // uuid
  amount: number;              // must be > 0 (DB CHECK)
  effect_sign: 1 | -1;         // must be 1 or -1
  tax_treatment?: string | null; // DB casts to tax_treatment enum or NULL
  deductible?: boolean;        // DB defaults false if not provided
  metadata?: Record<string, any>;
}

export interface RecordEconomicEventParams {
  entityId: string;
  eventType: string;  // economic_event_type enum value
  eventDate: string;  // yyyy-mm-dd
  description?: string | null;
  effects: EconomicEventEffect[];
}

function toDateYYYYMMDD(d: Date = new Date()) {
  return d.toISOString().slice(0, 10);
}

function normalizeEffect(e: EconomicEventEffect): EconomicEventEffect {
  const amt = Math.abs(Number(e.amount) || 0);
  const sign: 1 | -1 = e.effect_sign === -1 ? -1 : 1;

  return {
    ...e,
    amount: amt,
    effect_sign: sign,
    tax_treatment: e.tax_treatment ?? null,
    deductible: e.deductible ?? false,
  };
}

// RPC wrapper
async function rpc<T>(fn: string, params: any): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    console.error(`[RPC ERROR] ${fn}`, error);
    throw new Error(error.message);
  }
  return data as T;
}

export const EventOrchestrator = {
  async recordEconomicEvent(params: RecordEconomicEventParams) {
    const { entityId, eventType, eventDate, description, effects } = params;

    if (!entityId) throw new Error("entityId is required");
    if (!eventType) throw new Error("eventType is required");
    if (!effects || effects.length < 2) throw new Error("At least 2 effects are required");

    // Ensure yyyy-mm-dd for DB date
    const safeDate =
      /^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? eventDate : toDateYYYYMMDD(new Date(eventDate));

    const normalizedEffects = effects.map(normalizeEffect);

    // Optional: client-side balance check (DB enforces too)
    const sum = normalizedEffects.reduce((acc, e) => acc + e.amount * e.effect_sign, 0);
    // allow tiny float error, though DB uses numeric
    if (Math.abs(sum) > 0.0001) {
      throw new Error(`Event is not balanced (sum=${sum}). Check debits/credits.`);
    }

    const eventId = await rpc<string>("record_economic_event", {
      p_entity_id: entityId,
      p_event_type: eventType,
      p_event_date: safeDate,
      p_description: description ?? "",
      p_effects: normalizedEffects,
    });

    eventEmitter.emit("ECONOMIC_EVENT_RECORDED", { eventId });
    return eventId;
  },
};