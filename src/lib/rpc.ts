// src/lib/rpc.ts
import { supabase } from "./supabase";

type RpcArgs = Record<string, unknown>;

/** Typed RPC wrapper (throws on Supabase error) */
export async function rpc<T>(
  fn: string,
  args: RpcArgs = {}
): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
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