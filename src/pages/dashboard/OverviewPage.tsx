// src/pages/dashboard/OverviewPage.tsx
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";

type KPIResult = {
  label: string;
  value: number | string | null;
};

function toNumber(v: number | string | null): number | null {
  if (v === null) return null;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatValue(v: number | string | null) {
  const n = toNumber(v);
  if (n === null) return "—";
  return n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OverviewPage() {
  const { entityId } = useParams<{ entityId: string }>();
  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  const kpisQuery = useQuery<KPIResult[]>({
    queryKey: qk.entitySnapshot(entityId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_entity_snapshot", {
        p_entity_id: entityId,
      });
      if (error) throw error;

      // DB returns TABLE(label text, value numeric) => array rows
      return Array.isArray(data) ? (data as KPIResult[]) : [];
    },
    staleTime: 15_000,
  });

  if (kpisQuery.isLoading) return <div className="p-4">Loading KPI data…</div>;

  if (kpisQuery.isError) {
    return (
      <div className="p-4 text-red-600">
        Failed to load KPIs: {String((kpisQuery.error as any)?.message ?? kpisQuery.error)}
      </div>
    );
  }

  const kpis = kpisQuery.data ?? [];
  if (kpis.length === 0) {
    return (
      <div className="p-4 text-gray-600">
        No KPI data available.
        <br />
        Try adding economic events.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Key Performance Indicators</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="border rounded p-4 bg-white shadow-sm flex flex-col">
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="text-2xl font-bold mt-1">{formatValue(k.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}