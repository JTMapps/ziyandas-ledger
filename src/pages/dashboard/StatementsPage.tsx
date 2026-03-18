// src/pages/dashboard/StatementsPage.tsx
//
// Upgrades from previous version:
//   1. Auto-selects the latest period on load so users never land on a
//      blank "Select a period" message when periods already exist.
//   2. Guided empty state when no periods exist — explains what to do,
//      with a prominent "Create Periods" CTA instead of a disabled select.
//   3. Statement type tabs show full names on hover (title attr already
//      existed), plus a visible subtitle below the tab bar.
//   4. Loading shown as a skeleton bar rather than plain text.
//   5. Empty statement (0 lines) gives contextual hints per statement type.
//   6. Auto-create button shows a loading spinner inline.

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

function pickLatestPeriodId(periods: { id: string; period_end: string }[]): string | null {
  if (!periods.length) return null;
  return [...periods].sort((a, b) => (a.period_end < b.period_end ? 1 : -1))[0].id;
}

// ─── Empty period state ───────────────────────────────────────────────────────

function NoPeriodsCTA({ onCreatePeriods, creating }: { onCreatePeriods: () => void; creating: boolean }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="text-3xl leading-none">📅</div>
      <div className="flex-1">
        <div className="font-semibold text-blue-900 text-sm">No reporting periods found</div>
        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
          Reporting periods divide your activity into fiscal intervals (months, quarters, or annual).
          Auto-create generates them from your event dates automatically.
        </p>
      </div>
      <button
        onClick={onCreatePeriods}
        disabled={creating}
        className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg shadow disabled:opacity-50 transition-colors"
      >
        {creating ? "Creating…" : "Auto-Create Periods"}
      </button>
    </div>
  );
}

// ─── Statement type hint messages ─────────────────────────────────────────────

const EMPTY_HINTS: Partial<Record<UiStatementType, string>> = {
  OCI:    "No accounts are tagged with statement_type = OTHER_COMPREHENSIVE_INCOME in your chart of accounts.",
  EQUITY: "The Statement of Changes in Equity requires accounts tagged with statement_type = EQUITY, or the DB function may not yet be implemented.",
  CF:     "The Cash Flow statement is generated from accounts with cash_flow_category set. Ensure your cash accounts have the correct tags.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatementsPage() {
  const { entityId } = useParams<{ entityId: string }>();
  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  const { periods, createIfMissing } = useReportingPeriods(entityId);

  const [uiType,       setUiType]       = useState<UiStatementType>("SOFP");
  const [periodId,     setPeriodId]     = useState<string | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);

  // Auto-select latest period whenever periods list changes
  useEffect(() => {
    if (periodId) return; // don't override user selection
    const latest = pickLatestPeriodId(periods);
    if (latest) setPeriodId(latest);
  }, [periods, periodId]);

  const dbType = useMemo(() => STATEMENT_TYPE_MAP[uiType], [uiType]);
  const statementQuery = useStatement(entityId, periodId ?? undefined, dbType);

  const hasLines = (statementQuery.data?.lines?.length ?? 0) > 0;
  const showStatement = Boolean(periodId && statementQuery.data && hasLines);
  const showEmpty     = Boolean(periodId && statementQuery.data && !hasLines);

  async function handleAutoCreate() {
    try {
      setAutoCreating(true);
      await createIfMissing();
      // Let the effect pick the latest period after periods refreshes
    } finally {
      setAutoCreating(false);
    }
  }

  const currentLabel = UI_STATEMENT_LABEL[uiType];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Statements</h1>
        <p className="text-sm text-gray-500 mt-1">
          IFRS-compliant statements generated from posted economic events
        </p>
      </div>

      {/* Statement type tabs */}
      <div className="space-y-1">
        <div className="flex flex-wrap gap-2">
          {UI_STATEMENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setUiType(t)}
              type="button"
              title={UI_STATEMENT_LABEL[t]}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                uiType === t
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 pl-1">{currentLabel}</p>
      </div>

      {/* Period selection row */}
      {periods.length > 0 && (
        <div className="flex items-center gap-3">
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
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
            type="button"
            className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {autoCreating ? "Creating…" : "Refresh Periods"}
          </button>
        </div>
      )}

      {/* No periods yet */}
      {periods.length === 0 && (
        <NoPeriodsCTA onCreatePeriods={handleAutoCreate} creating={autoCreating} />
      )}

      {/* Error */}
      {statementQuery.error && (
        <div className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-200 p-3">
          Failed to load statement:{" "}
          {String((statementQuery.error as any)?.message ?? statementQuery.error)}
        </div>
      )}

      {/* Loading skeleton */}
      {statementQuery.isLoading && periodId && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      )}

      {/* Statement output */}
      {showStatement && (
        uiType === "CF"
          ? <CashFlowIndirect entityId={entityId} periodId={periodId!} />
          : <StatementRenderer data={statementQuery.data!} />
      )}

      {/* Empty lines hint */}
      {showEmpty && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 space-y-1">
          <div className="font-medium text-gray-700">No lines returned for this statement.</div>
          {EMPTY_HINTS[uiType] && (
            <p className="text-xs text-gray-500 leading-relaxed">{EMPTY_HINTS[uiType]}</p>
          )}
        </div>
      )}

      {/* No period selected (but periods exist) */}
      {!periodId && periods.length > 0 && (
        <p className="text-sm text-gray-500">Select a reporting period above to render a statement.</p>
      )}

    </div>
  );
}