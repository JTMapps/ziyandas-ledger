// src/pages/dashboard/OverviewPage.tsx

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

interface KPIResult {
  label: string;
  value: number | string | null;
}

interface Props {
  entityId: string;
}

export default function OverviewPage({ entityId }: Props) {
  const {
    data: kpis,
    isLoading,
    isError,
    error
  } = useQuery<KPIResult[]>({
    queryKey: ["overview-kpis", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_entity_snapshot", {
        p_entity_id: entityId
      });

      if (error) throw error;

      // Ensure always an array
      return Array.isArray(data) ? data : [];
    }
  });

  if (isLoading) {
    return <div className="p-4">Loading KPI data…</div>;
  }

  if (isError) {
    return (
      <div className="p-4 text-red-600">
        Failed to load KPIs: {(error as any).message}
      </div>
    );
  }

  if (!kpis || kpis.length === 0) {
    return (
      <div className="p-4 text-gray-600">
        No KPI data available.  
        <br />
        Try generating a snapshot or adding economic events.
      </div>
    );
  }

  // Formatting helper
  const formatValue = (v: any) => {
    if (v === null || v === undefined) return "—";

    if (typeof v === "number") {
      return v.toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    return v;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Key Performance Indicators</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="border rounded p-4 bg-white shadow-sm flex flex-col"
          >
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="text-2xl font-bold mt-1">
              {formatValue(k.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
