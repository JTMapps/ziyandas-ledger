import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

interface Props {
  entityId: string;
}

export default function OverviewPage({ entityId }: Props) {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["overview-kpis", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_entity_snapshot", {
        p_entity_id: entityId
      });
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>Loading KPI data…</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Key Performance Indicators</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis?.map((k: any) => (
          <div key={k.label} className="border rounded p-4 bg-white shadow-sm">
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
