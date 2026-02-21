// src/lib/auth.ts
import { supabase } from "./supabase";

export async function requireAuth() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("User not authenticated");
  return data.user;
}