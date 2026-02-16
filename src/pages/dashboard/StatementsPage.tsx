import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

interface Props {
  entityId: string;
}

export default function StatementsPage({ entityId }: Props) {
  const [statementType, setStatementType] = useState("SOFP");

  const { data: periods } = useQuery({
    queryKey: ["periods", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reporting_periods")
        .select("id, period_start, period_end")
        .eq("entity_id", entityId)
        .order("period_end", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  const { data: statement } = useQuery({
    queryKey: ["statement", entityId, selectedPeriod, statementType],
    queryFn: async () => {
      if (!selectedPeriod) return null;

      const { data, error } = await supabase.rpc(
        "render_financial_statement",
        {
          p_entity_id: entityId,
          p_period_id: selectedPeriod,
          p_statement_type: statementType
        }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPeriod
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Financial Statements</h2>

      <div className="flex space-x-4">
        {["SOFP", "P&L", "OCI", "CF"].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 border rounded ${
              statementType === type ? "bg-black text-white" : "bg-white"
            }`}
            onClick={() => setStatementType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <select
        onChange={(e) => setSelectedPeriod(e.target.value)}
        className="border p-2"
      >
        <option>Select period…</option>
        {periods?.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.period_start} → {p.period_end}
          </option>
        ))}
      </select>

      {statement && (
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm">
          {JSON.stringify(statement, null, 2)}
        </pre>
      )}
    </div>
  );
}
