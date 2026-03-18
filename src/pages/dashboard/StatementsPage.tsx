// src/pages/dashboard/StatementsPage.tsx
import { useEffect, useMemo, useState } from "react";
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

function pickLatestPeriodId(periods: { id: string; period_end: string }[]) {
  if (!periods.length) return null;
  // assumes ISO date string sorting works (YYYY-MM-DD)
  const sorted = [...periods].sort((a, b) => (a.period_end < b.period_end ? 1 : -1));
  return sorted[0].id;
}

export default function StatementsPage() {
  const { entityId } = useParams<{ entityId: string }>();
  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  const { periods, createIfMissing } = useReportingPeriods(entityId);

  const [uiType, setUiType] = useState<UiStatementType>("SOFP");
  const [periodId, setPeriodId] = useState<string | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);

  // Auto-select latest period when periods load
  useEffect(() => {
    if (periodId) return;
    const latest = pickLatestPeriodId(periods);
    if (latest) setPeriodId(latest);
  }, [periods, periodId]);

  const dbType = useMemo(() => STATEMENT_TYPE_MAP[uiType], [uiType]);

  const statementQuery = useStatement(entityId, periodId ?? undefined, dbType);

  // Optional UX: hide tabs that are “not implemented yet”.
  // Toggle this ON if you don't want OCI/EQUITY shown until you implement them in DB.
  const HIDE_UNIMPLEMENTED = false;

  const visibleTabs = useMemo(() => {
    if (!HIDE_UNIMPLEMENTED) return UI_STATEMENT_TYPES;

    // Heuristic: hide OCI + EQUITY if they consistently come back empty.
    // (You can replace this with a cheap "counts by statement_type" query later.)
    return UI_STATEMENT_TYPES.filter((t) => t !== "OCI" && t !== "EQUITY");
  }, [HIDE_UNIMPLEMENTED]);

  async function handleAutoCreate() {
    try {
      setAutoCreating(true);
      await createIfMissing();
      // after creation, choose latest
      const latest = pickLatestPeriodId(periods);
      if (latest) setPeriodId(latest);
      // If your hook updates periods asynchronously, the effect above will also catch it.
    } finally {
      setAutoCreating(false);
    }
  }

  const showStatement = Boolean(periodId && statementQuery.data);

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Financial Statements</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        {visibleTabs.map((t) => (
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

      {/* Period selection */}
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
          onClick={handleAutoCreate}
          disabled={autoCreating}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          type="button"
        >
          {autoCreating ? "Creating…" : "Auto-Create Periods"}
        </button>
      </div>

      {/* Errors */}
      {statementQuery.error && (
        <div className="text-sm text-red-600">
          Failed to load statement:{" "}
          {String((statementQuery.error as any)?.message ?? statementQuery.error)}
        </div>
      )}

      {/* Loading */}
      {statementQuery.isLoading && periodId && <div>Loading statement…</div>}

      {/* Render */}
      {showStatement && (
        <>
          {uiType === "CF" ? (
            <CashFlowIndirect entityId={entityId} periodId={periodId!} />
          ) : (
            <StatementRenderer data={statementQuery.data!} />
          )}
        </>
      )}

      {/* Empty state */}
      {!periodId && (
        <div className="text-sm text-gray-600">
          Select a reporting period to render a statement.
        </div>
      )}

      {periodId && statementQuery.data && (statementQuery.data.lines?.length ?? 0) === 0 && (
        <div className="text-sm text-gray-600">
          No lines returned for this statement.
          {uiType === "OCI" && (
            <div className="text-xs text-gray-500 mt-1">
              This usually means no accounts are tagged with statement_type = OTHER_COMPREHENSIVE_INCOME.
            </div>
          )}
          {uiType === "EQUITY" && (
            <div className="text-xs text-gray-500 mt-1">
              This usually means the Statement of Changes in Equity is not implemented in the DB yet,
              or no accounts are tagged with statement_type = EQUITY.
            </div>
          )}
        </div>
      )}
    </div>
  );
}