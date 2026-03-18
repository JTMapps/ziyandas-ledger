// src/pages/dashboard/TaxECLPage.tsx
//
// Upgrades from previous version:
//   1. Same entityId narrowing fix as YearEndPage — `eid: string` extracted
//      before any mutation call so TypeScript sees string, not string|undefined.
//   2. Raw JSON <pre> blocks replaced with structured tables. The HTML
//      reference never exposed raw JSON to a user — it always rendered
//      structured rows with labels.
//   3. Empty states explain WHY the section is empty and what to do.
//   4. Year input matches app styling (rounded-lg, focus:ring-2).
//   5. Both action buttons are visually distinct (blue vs green).
//   6. Per-section error banners instead of one pre-formatted error dump.
//   7. Loading skeletons per section.

import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useYearEnd } from "../../hooks/useYearEnd";
import { qk } from "../../hooks/queryKeys";

// ─── Types ────────────────────────────────────────────────────────────────────
// Both tables have unknown shape — we render whatever columns exist.
type DeferredTaxItem = Record<string, unknown>;
type EclItem        = Record<string, unknown>;

// ─── Generic data table ───────────────────────────────────────────────────────
// Introspects columns from the first row and renders them.
function DataTable({ rows, label }: { rows: Record<string, unknown>[]; label: string }) {
  if (rows.length === 0) return null;

  // Derive columns from union of all row keys, but put common ones first
  const PRIORITY = ["id", "entity_id", "account_id", "year", "amount", "temporary_difference",
    "tax_rate", "deferred_tax_asset", "deferred_tax_liability", "exposure",
    "ecl_amount", "stage", "pd", "lgd", "ead", "created_at", "updated_at"];

  const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const columns = [
    ...PRIORITY.filter((k) => allKeys.includes(k)),
    ...allKeys.filter((k) => !PRIORITY.includes(k)),
  ];

  // Format a cell value for display
  function fmt(v: unknown): string {
    if (v === null || v === undefined) return "—";
    if (typeof v === "number") {
      return Number.isInteger(v)
        ? v.toLocaleString("en-ZA")
        : v.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
    if (typeof v === "boolean") return v ? "Yes" : "No";
    const s = String(v);
    // Truncate UUIDs for readability
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(s)) return `${s.slice(0, 8)}…`;
    // Truncate ISO timestamps to date+time
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 16).replace("T", " ");
    return s;
  }

  // Human-readable column headers
  function colLabel(k: string): string {
    return k
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\bId\b/, "ID")
      .replace(/\bEcl\b/, "ECL")
      .replace(/\bPd\b/, "PD")
      .replace(/\bLgd\b/, "LGD")
      .replace(/\bEad\b/, "EAD");
  }

  return (
    <div className="overflow-x-auto rounded-lg border shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
              >
                {colLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={col} className="px-4 py-3 text-gray-700 whitespace-nowrap font-mono text-xs">
                  {fmt(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-8 bg-gray-100 rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-6 bg-gray-50 rounded" />
      ))}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title,
  subtitle,
  count,
  isLoading,
  error,
  children,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  count: number;
  isLoading: boolean;
  error: Error | null;
  children: ReactNode;
  emptyMessage: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {count > 0 && (
          <span className="text-xs text-gray-400">{count} row{count !== 1 ? "s" : ""}</span>
        )}
      </div>

      {!!error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {isLoading && <TableSkeleton />}

      {!isLoading && !error && count === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
          <div className="text-2xl mb-2">📭</div>
          <p className="leading-relaxed text-xs">{emptyMessage}</p>
        </div>
      )}

      {!isLoading && !error && count > 0 && children}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TaxECLPage() {
  const { entityId } = useParams<{ entityId: string }>();

  // Narrow early — same fix as YearEndPage
  if (!entityId) return <div className="p-4 text-red-600">Missing entityId in route.</div>;

  const eid: string = entityId;

  const [year, setYear] = useState<number>(new Date().getFullYear());

  const { postDeferredTax, postECLMovement } = useYearEnd();

  // ── Deferred Tax Items ────────────────────────────────────────────────────
  const dtiQuery = useQuery<DeferredTaxItem[]>({
    queryKey: qk.deferredTax(eid, year),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deferred_tax_items")
        .select("*")
        .eq("entity_id", eid)
        .eq("financial_year", year)           // filter to the selected year
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DeferredTaxItem[];
    },
  });

  // ── ECL Items ─────────────────────────────────────────────────────────────
  const eclQuery = useQuery<EclItem[]>({
    queryKey: qk.ecl(eid, year),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expected_credit_losses")
        .select("*")
        .eq("entity_id", eid)
        .eq("financial_year", year)           // filter to the selected year
        .order("assessment_date", { ascending: false }); // sort by existing column
      if (error) throw error;
      return (data ?? []) as EclItem[];
    },
  });

  const isBusy =
    dtiQuery.isLoading    ||
    eclQuery.isLoading    ||
    postDeferredTax.isPending ||
    postECLMovement.isPending;

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tax & Expected Credit Losses</h2>
        <p className="text-sm text-gray-500 mt-1">
          IAS 12 deferred tax positions and IFRS 9 ECL allowances for this entity.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2000}
            max={2100}
            disabled={isBusy}
            className="border rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => postDeferredTax.mutate({ entityId: eid, year })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {postDeferredTax.isPending ? "Posting…" : "Post Deferred Tax (IAS 12)"}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => postECLMovement.mutate({ entityId: eid, year })}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {postECLMovement.isPending ? "Posting…" : "Post ECL (IFRS 9)"}
        </button>
      </div>

      {/* Mutation success banners */}
      {postDeferredTax.isSuccess && !postDeferredTax.isPending && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          ✓ Deferred tax posted for {year}. Refresh to see updated rows.
        </div>
      )}
      {postECLMovement.isSuccess && !postECLMovement.isPending && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          ✓ ECL movement posted for {year}. Refresh to see updated rows.
        </div>
      )}

      {/* ── Deferred Tax ── */}
      <Section
        title="Deferred Tax Items"
        subtitle="IAS 12 — temporary differences between accounting and tax carrying values"
        count={dtiQuery.data?.length ?? 0}
        isLoading={dtiQuery.isLoading}
        error={dtiQuery.error}
        emptyMessage={`No deferred tax items found for this entity. Use "Post Deferred Tax (IAS 12)" above to calculate temporary differences for ${year}.`}
      >
        <DataTable rows={dtiQuery.data ?? []} label="Deferred Tax" />
      </Section>

      {/* ── ECL ── */}
      <Section
        title="Expected Credit Loss Items"
        subtitle="IFRS 9 — impairment allowances on trade receivables and financial assets"
        count={eclQuery.data?.length ?? 0}
        isLoading={eclQuery.isLoading}
        error={eclQuery.error}
        emptyMessage={`No ECL items found for this entity. Use "Post ECL (IFRS 9)" above to calculate expected credit losses for ${year}.`}
      >
        <DataTable rows={eclQuery.data ?? []} label="ECL" />
      </Section>

    </div>
  );
}