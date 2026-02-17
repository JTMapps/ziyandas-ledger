import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

interface Props {
  entityId: string;
  periodId: string;
}

export default function CashFlowIndirect({ entityId, periodId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["cf-indirect", entityId, periodId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "render_financial_statement",
        {
          p_entity_id: entityId,
          p_period_id: periodId,
          p_statement_type: "CF"
        }
      );
      if (error) throw error;
      return data; // contains { entity_id, period_id, lines: [...] }
    }
  });

  if (isLoading) return <div>Loading cash flow…</div>;
  if (!data || !data.lines) return <div>No cash flow data available.</div>;

  const lines = data.lines;

  const operating = lines.filter((x: any) => x.section === "OPERATING");
  const investing = lines.filter((x: any) => x.section === "INVESTING");
  const financing = lines.filter((x: any) => x.section === "FINANCING");

  const sum = (rows: any[]) =>
    rows.reduce((t, r) => t + (Number(r.amount) || 0), 0);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Cash Flow (Indirect Method)</h2>

      {/* OPERATING */}
      <section>
        <h3 className="font-semibold text-gray-700">Operating Activities</h3>
        <div className="space-y-1 mt-2">
          {operating.map((row: any) => (
            <div key={row.code} className="flex justify-between">
              <span>{row.name}</span>
              <span>{row.amount?.toLocaleString()}</span>
            </div>
          ))}
          <div className="font-bold flex justify-between pt-2 border-t">
            <span>Net Cash from Operating Activities</span>
            <span>{sum(operating).toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* INVESTING */}
      <section>
        <h3 className="font-semibold text-gray-700">Investing Activities</h3>
        <div className="space-y-1 mt-2">
          {investing.map((row: any) => (
            <div key={row.code} className="flex justify-between">
              <span>{row.name}</span>
              <span>{row.amount?.toLocaleString()}</span>
            </div>
          ))}
          <div className="font-bold flex justify-between pt-2 border-t">
            <span>Net Cash from Investing Activities</span>
            <span>{sum(investing).toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* FINANCING */}
      <section>
        <h3 className="font-semibold text-gray-700">Financing Activities</h3>
        <div className="space-y-1 mt-2">
          {financing.map((row: any) => (
            <div key={row.code} className="flex justify-between">
              <span>{row.name}</span>
              <span>{row.amount?.toLocaleString()}</span>
            </div>
          ))}
          <div className="font-bold flex justify-between pt-2 border-t">
            <span>Net Cash from Financing Activities</span>
            <span>{sum(financing).toLocaleString()}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
