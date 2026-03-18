// src/pages/dashboard/YearEndPage.tsx

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useYearEnd } from "../../hooks/useYearEnd";

export default function YearEndPage() {
  const { entityId } = useParams<{ entityId: string }>();

  // ── Narrow early so everything below has `string`, not `string | undefined`
  if (!entityId) return <div className="p-4 text-red-600">Missing entityId in route.</div>;

  const { runFullYearEndClose, postDeferredTax, postECLMovement } = useYearEnd();

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year,       setYear]       = useState<number>(currentYear);
  const [confirming, setConfirming] = useState(false);

  // `entityId` is narrowed to `string` here — no more TS 2322
  const eid: string = entityId;

  const busy =
    runFullYearEndClose.isPending ||
    postDeferredTax.isPending     ||
    postECLMovement.isPending;

  function handleCloseClick() {
    if (busy) return;
    setConfirming(true);
  }

  function handleConfirm() {
    setConfirming(false);
    runFullYearEndClose.mutate({ entityId: eid, year });
  }

  const errors: { label: string; msg: string }[] = [];
  if (runFullYearEndClose.error)
    errors.push({ label: "Year-End Close", msg: String((runFullYearEndClose.error as any)?.message ?? runFullYearEndClose.error) });
  if (postDeferredTax.error)
    errors.push({ label: "Deferred Tax",   msg: String((postDeferredTax.error as any)?.message ?? postDeferredTax.error) });
  if (postECLMovement.error)
    errors.push({ label: "ECL",            msg: String((postECLMovement.error as any)?.message ?? postECLMovement.error) });

  const closedSuccessfully =
    !!runFullYearEndClose.data && !runFullYearEndClose.isPending && !runFullYearEndClose.error;

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Year-End Close</h1>
        <p className="text-sm text-gray-500 mt-1">
          Close the financial year, post adjusting entries, and prepare opening balances.
        </p>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Financial year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          disabled={busy}
          min={2000}
          max={2100}
          className="border rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-1.5">
          {errors.map(({ label, msg }) => (
            <div key={label} className="text-sm text-red-700">
              <span className="font-semibold">{label}:</span> {msg}
            </div>
          ))}
        </div>
      )}

      {/* Success banner */}
      {closedSuccessfully && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="font-semibold text-emerald-800 text-sm">
            ✓ Year {year} closed successfully
          </div>
          <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
            Closing entries have been posted and opening balances for {year + 1} have been generated.
          </p>
        </div>
      )}

      {/* Confirmation prompt */}
      {confirming && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 space-y-4">
          <div>
            <div className="font-semibold text-red-800 text-sm">
              Confirm: Close financial year {year}
            </div>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              This will post closing entries to all income and expense accounts,
              transfer net income to retained earnings, and generate opening
              balances for {year + 1}. This cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm rounded-lg font-semibold transition-colors"
            >
              Confirm — Close Year {year}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!confirming && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleCloseClick}
            className="px-5 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {runFullYearEndClose.isPending ? "Running…" : `Close Year ${year}`}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => postDeferredTax.mutate({ entityId: eid, year })}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {postDeferredTax.isPending ? "Posting…" : "Post Deferred Tax (IAS 12)"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => postECLMovement.mutate({ entityId: eid, year })}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {postECLMovement.isPending ? "Posting…" : "Post ECL (IFRS 9)"}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="border-t pt-4 text-xs text-gray-400 space-y-1">
        <div>
          <span className="font-medium text-gray-500">Close Year</span>
          {" — "}Posts closing entries, generates opening balances for next year.
        </div>
        <div>
          <span className="font-medium text-gray-500">Post Deferred Tax</span>
          {" — "}IAS 12: calculates and posts temporary differences between accounting and tax bases.
        </div>
        <div>
          <span className="font-medium text-gray-500">Post ECL</span>
          {" — "}IFRS 9: posts expected credit loss movement on trade receivables.
        </div>
      </div>
    </div>
  );
}