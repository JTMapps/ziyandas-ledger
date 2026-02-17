import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

import StatementRenderer from "../../components/statements/StatementRenderer";
import CashFlowIndirect from "../../components/statements/CashFlowIndirect";

interface Props {
  entityId: string;
}

export default function StatementsPage({ entityId }: Props) {
  const [statementType, setStatementType] = useState<"SOFP" | "P&L" | "OCI" | "CF">("SOFP");
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // Load reporting periods
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

  // Fetch non-CF statements through render_financial_statement RPC
  const { data: statement, isLoading } = useQuery({
    queryKey: ["statement", entityId, selectedPeriod, statementType],
    enabled: !!selectedPeriod && statementType !== "CF",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("render_financial_statement", {
        p_entity_id: entityId,
        p_period_id: selectedPeriod,
        p_statement_type: statementType
      });
      if (error) throw error;
      return data; // returns { statement_type, lines: [...] }
    }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Financial Statements</h2>

      {/* ------------------------------ */}
      {/* STATEMENT TYPE TABS */}
      {/* ------------------------------ */}
      <div className="flex space-x-4">
        {(["SOFP", "P&L", "OCI", "CF"] as const).map((type) => (
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

      {/* ------------------------------ */}
      {/* PERIOD SELECTOR */}
      {/* ------------------------------ */}
      <select
        onChange={(e) => setSelectedPeriod(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">Select period…</option>
        {periods?.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.period_start} → {p.period_end}
          </option>
        ))}
      </select>

      {/* ------------------------------ */}
      {/* DISPLAY STATEMENT */}
      {/* ------------------------------ */}
      {selectedPeriod ? (
        statementType === "CF" ? (
          <CashFlowIndirect entityId={entityId} periodId={selectedPeriod} />
        ) : (
          <>
            {isLoading && <div>Loading statement…</div>}

            {statement && (
              <StatementRenderer data={statement} />
            )}
          </>
        )
      ) : (
        <div className="text-gray-500 text-sm">Select a reporting period.</div>
      )}
    </div>
  );
}
