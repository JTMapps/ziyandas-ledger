// src/lib/rpc.ts
import { supabase } from "./supabase";

export async function rpc<T>(fn: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    console.error(`[RPC ERROR] ${fn}`, error);
    throw new Error(error.message ?? "RPC failed");
  }
  return data as T;
}

export async function closeFinancialYearEnterprise(entityId: string, year: number) {
  const { data, error } = await supabase.rpc("close_financial_year_enterprise", {
    p_entity_id: entityId,
    p_year: year,
  });

  if (error) throw error;
  return data; // likely UUID of the close event
}