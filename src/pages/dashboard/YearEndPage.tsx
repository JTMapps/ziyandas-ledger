// src/pages/dashboard/YearEndPage.tsx
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useYearEnd } from "../../hooks/useYearEnd";

export default function YearEndPage() {
  const { entityId } = useParams<{ entityId: string }>();
  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  const { runFullYearEndClose, postDeferredTax, postECLMovement } = useYearEnd();

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState<number>(currentYear);

  const busy =
    runFullYearEndClose.isPending || postDeferredTax.isPending || postECLMovement.isPending;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Year-End Close</h1>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Financial year</label>
        <input
          type="number"
          className="border rounded p-2 w-32"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          min={2000}
          max={2100}
        />
      </div>

      {(runFullYearEndClose.error || postDeferredTax.error || postECLMovement.error) && (
        <div className="text-sm text-red-600">
          {String(
            (runFullYearEndClose.error as any)?.message ??
              (postDeferredTax.error as any)?.message ??
              (postECLMovement.error as any)?.message ??
              "Unknown error"
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={() => runFullYearEndClose.mutate({ entityId, year })}
        >
          {runFullYearEndClose.isPending ? "Running…" : "Run Full Year-End Close"}
        </button>

        <button
          type="button"
          disabled={busy}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={() => postDeferredTax.mutate({ entityId, year })}
        >
          {postDeferredTax.isPending ? "Posting…" : "Post Deferred Tax"}
        </button>

        <button
          type="button"
          disabled={busy}
          className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
          onClick={() => postECLMovement.mutate({ entityId, year })}
        >
          {postECLMovement.isPending ? "Posting…" : "Post ECL (IFRS 9)"}
        </button>
      </div>

      {runFullYearEndClose.data && (
        <div className="text-sm text-gray-700">
          Year-end completed. Snapshot id: <code>{runFullYearEndClose.data}</code>
        </div>
      )}
    </div>
  );
}