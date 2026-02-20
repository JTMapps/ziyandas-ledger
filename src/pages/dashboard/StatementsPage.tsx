import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import StatementRenderer from "../../components/statements/StatementRenderer";
import CashFlowIndirect from "../../components/statements/CashFlowIndirect";
import { useReportingPeriods } from "../../hooks/useReportingPeriods";

type StatementType = "SOFP" | "P&L" | "OCI" | "CF";

export default function StatementsPage() {
  const { entityId } = useParams<{ entityId: string }>();

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  const { periods, createIfMissing } = useReportingPeriods(entityId);

  const [statementType, setStatementType] = useState<StatementType>("SOFP");
  const [periodId, setPeriodId] = useState<string | null>(null);

  const { data: statementData, isLoading, error } = useQuery({
    queryKey: ["statement", entityId, periodId, statementType],
    enabled: !!entityId && !!periodId,
    queryFn: async () => {
      if (!periodId) return null;

      const { data, error } = await supabase.rpc("render_financial_statement", {
        p_entity_id: entityId,
        p_period_id: periodId,
        p_statement_type: statementType,
      });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Financial Statements</h1>

      <div className="flex space-x-3">
        {(["SOFP", "P&L", "OCI", "CF"] as StatementType[]).map((st) => (
          <button
            key={st}
            onClick={() => setStatementType(st)}
            className={`px-4 py-2 border rounded ${
              statementType === st ? "bg-black text-white" : "bg-white"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div>
        <select
        className="border p-2"
        value={periodId ?? ""}
        onChange={(e) => setPeriodId(e.target.value || null)}
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

      {error && (
        <div className="text-sm text-red-600">
          Failed to load statement: {String((error as any)?.message ?? error)}
        </div>
      )}

      {isLoading && <div>Loading statement…</div>}

      {statementData && periodId && (
        <>
          {statementType === "CF" ? (
            <CashFlowIndirect entityId={entityId} periodId={periodId} />
          ) : (
            <StatementRenderer data={statementData} />
          )}
        </>
      )}

      {!periodId && (
        <div className="text-sm text-gray-600">
          Select a reporting period to render a statement.
        </div>
      )}
    </div>
  );
}
