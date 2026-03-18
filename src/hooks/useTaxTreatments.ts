// src/hooks/useTaxTreatments.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type TaxTreatment = string;

export function useTaxTreatments() {
  return useQuery<TaxTreatment[]>({
    queryKey: ["enum", "tax_treatment"],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_enum_values", {
        type_name: "tax_treatment",
      });
      if (error) throw error;

      // RPC returns: [{ value: "ORDINARY_INCOME" }, ...]
      return (data ?? []).map((r: any) => String(r.value));
    },
  });
}