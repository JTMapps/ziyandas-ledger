// src/repositories/eventRepository.ts
import { supabase } from "../lib/supabase";

export async function queryEventsByEntity(entityId: string, filters: any = {}) {
  const {
    eventType,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
    orderBy = "event_date",
    order = "desc",
  } = filters;

  let query = supabase
    .from("economic_events_active")
    .select("*", { count: "exact" })
    .eq("entity_id", entityId);

  if (eventType) query = query.eq("event_type", eventType);
  if (startDate) query = query.gte("event_date", startDate);
  if (endDate) query = query.lte("event_date", endDate);

  query = query.order(orderBy, { ascending: order === "asc" }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { data: data ?? [], count: count ?? 0 };
}

export async function getEventWithEffects(eventId: string) {
  const { data: event, error: eventError } = await supabase
    .from("economic_events_active")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError) throw new Error(eventError.message);

  const { data: effects, error: effectsError } = await supabase
    .from("event_effects_active")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (effectsError) throw new Error(effectsError.message);

  return { event, effects: effects ?? [] };
}