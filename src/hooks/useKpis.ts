import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";

export function useEntitySnapshot(entityId?: string) {
  const enabled = !!entityId;

  return useQuery({
    queryKey: enabled ? qk.entitySnapshot(entityId!) : ["entity-snapshot", "disabled"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_entity_snapshot", {
        p_entity_id: entityId!,
      });
      if (error) throw error;
      return (data ?? []) as Array<{ label: string; value: number }>;
    },
  });
}

export function usePersonalKpis(entityId?: string, asOf?: string) {
  const enabled = !!entityId && !!asOf;

  return useQuery({
    queryKey: enabled ? qk.personalKpis(entityId!, asOf!) : ["personal-kpis", "disabled"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_personal_kpis", {
        p_entity_id: entityId!,
        p_as_of: asOf!,
      });
      if (error) throw error;
      return data as any;
    },
  });
}
