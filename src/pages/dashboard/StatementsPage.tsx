// src/pages/dashboard/StatementsPage.tsx
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import StatementRenderer from "../../components/statements/StatementRenderer";
import CashFlowIndirect from "../../components/statements/CashFlowIndirect";
import { useReportingPeriods } from "../../hooks/useReportingPeriods";
import { useStatement } from "../../hooks/useStatements";

import {
  UI_STATEMENT_TYPES,
  STATEMENT_TYPE_MAP,
  UI_STATEMENT_LABEL,
  type UiStatementType,
} from "../../domain/statements/statementTypes";

export default function StatementsPage() {
  const { entityId } = useParams<{ entityId: string }>();
  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  const { periods, createIfMissing } = useReportingPeriods(entityId);

  const [uiType, setUiType] = useState<UiStatementType>("SOFP");
  const [periodId, setPeriodId] = useState<string | null>(null);

  // DB-aligned type for RPC
  const dbType = useMemo(() => STATEMENT_TYPE_MAP[uiType], [uiType]);

  const statementQuery = useStatement(entityId, periodId ?? undefined, dbType);

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Financial Statements</h1>

      <div className="flex flex-wrap gap-3">
        {UI_STATEMENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setUiType(t)}
            className={`px-4 py-2 border rounded ${
              uiType === t ? "bg-black text-white" : "bg-white"
            }`}
            type="button"
            title={UI_STATEMENT_LABEL[t]}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
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
          className="px-4 py-2 bg-blue-600 text-white rounded"
          type="button"
        >
          Auto-Create Periods
        </button>
      </div>

      {statementQuery.error && (
        <div className="text-sm text-red-600">
          Failed to load statement:{" "}
          {String((statementQuery.error as any)?.message ?? statementQuery.error)}
        </div>
      )}

      {statementQuery.isLoading && periodId && <div>Loading statement…</div>}

      {statementQuery.data && periodId && (
        <>
          {uiType === "CF" ? (
            <CashFlowIndirect entityId={entityId} periodId={periodId} />
          ) : (
            <StatementRenderer data={statementQuery.data} />
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