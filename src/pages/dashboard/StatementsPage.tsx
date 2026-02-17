import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

import StatementRenderer from "../../components/statements/StatementRenderer";
import CashFlowIndirect from "../../components/statements/CashFlowIndirect";

import { useReportingPeriods } from "../../hooks/useReportingPeriods";

interface Props {
  entityId: string;
}

export default function StatementsPage({ entityId }: Props) {
  const { periods, createIfMissing } = useReportingPeriods(entityId);

  const [statementType, setStatementType] = useState<"SOFP" | "P&L" | "OCI" | "CF">("SOFP");
  const [periodId, setPeriodId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load statement from backend RPC
  // ---------------------------------------------------------------------------
  const { data: statementData, isLoading } = useQuery({
    queryKey: ["statement", entityId, periodId, statementType],
    queryFn: async () => {
      if (!periodId) return null;

      const { data, error } = await supabase.rpc("render_financial_statement", {
        p_entity_id: entityId,
        p_period_id: periodId,
        p_statement_type: statementType
      });

      if (error) throw error;
      return data;
    },
    enabled: !!periodId
  });

  // ---------------------------------------------------------------------------
  // UI Rendering
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Financial Statements</h1>

      {/* Statement type selector */}
      <div className="flex space-x-3">
        {["SOFP", "P&L", "OCI", "CF"].map((st) => (
          <button
            key={st}
            onClick={() => setStatementType(st as any)}
            className={`px-4 py-2 border rounded ${
              statementType === st ? "bg-black text-white" : "bg-white"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Period selector */}
      <div>
        <select
          className="border p-2"
          onChange={(e) => setPeriodId(e.target.value)}
        >
          <option value="">Select period…</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.period_start} → {p.period_end}
            </option>
          ))}
        </select>

        <button
          onClick={() => createIfMissing()}
          className="ml-3 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Auto-Create Periods
        </button>
      </div>

      {/* Render statement */}
      {isLoading && <div>Loading statement…</div>}

      {statementData && (
        <>
          {statementType === "CF" ? (
            <CashFlowIndirect entityId={entityId} periodId={periodId!} />
          ) : (
            <StatementRenderer data={statementData} />
          )}
        </>
      )}
    </div>
  );
}
