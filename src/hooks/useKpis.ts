// src/hooks/useKpis.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";

export type EntitySnapshotRow = { label: string; value: number };
export type EntitySnapshotMap = Record<string, number>;

function toNum(v: unknown) {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function useEntitySnapshot(entityId?: string) {
  const enabled = !!entityId;

  return useQuery({
    queryKey: enabled ? qk.entitySnapshot(entityId!) : ["entity-snapshot", "disabled"],
    enabled,
    queryFn: async (): Promise<EntitySnapshotMap> => {
      const { data, error } = await supabase.rpc("get_entity_snapshot", { p_entity_id: entityId! });
      if (error) throw error;

      const rows = (data ?? []) as Array<{ label: unknown; value: unknown }>;
      return rows.reduce<EntitySnapshotMap>((acc, r) => {
        acc[String(r.label ?? "")] = toNum(r.value);
        return acc;
      }, {});
    },
  });
}