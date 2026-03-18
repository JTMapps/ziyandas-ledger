// src/pages/dashboard/OverviewPage.tsx
//
// Upgrades from the previous version:
//   1. KPI cards are colour-coded by accounting semantics — green for
//      positive-is-good (Net Income, Total Assets, Cash), amber for
//      positive-is-warning (Liabilities), neutral for Equity.
//   2. Negative Net Income renders a red card — immediately visible.
//   3. All amounts prefixed with "R" (ZAR) for consistency.
//   4. "No events" empty state includes a direct link to the Ledger.
//   5. Skeleton loading instead of plain text spinner.
//   6. Derived from HTML reference: tinted bg-color/10 + border-color/30
//      pattern with colored value text, exactly as the HTML dashboard uses.

import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";

type KPIResult = { label: string; value: number | string | null };

// ─── Display config per known KPI label ──────────────────────────────────────
// goodWhen: "positive" = green when value > 0, red when < 0
//           "negative" = amber when value > 0 (liabilities — lower is safer)
//           "neutral"  = always slate/grey

type KPIConfig = {
  icon: string;
  goodWhen: "positive" | "negative" | "neutral";
};

const KPI_CONFIG: Record<string, KPIConfig> = {
  "Total Assets":       { icon: "🏛️", goodWhen: "positive" },
  "Total Liabilities":  { icon: "⚠️", goodWhen: "negative" },
  "Total Equity":       { icon: "📊", goodWhen: "neutral"  },
  "Net Income":         { icon: "📈", goodWhen: "positive" },
  "Gross Profit":       { icon: "💰", goodWhen: "positive" },
  "Revenue":            { icon: "💵", goodWhen: "positive" },
  "Total Expenses":     { icon: "📤", goodWhen: "negative" },
  "Cash Balance":       { icon: "🏦", goodWhen: "positive" },
  "Cash":               { icon: "🏦", goodWhen: "positive" },
};

function toNumber(v: number | string | null): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatZAR(v: number | string | null): string {
  const n = toNumber(v);
  if (n === null) return "—";
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Returns Tailwind classes for the card based on value health
function getCardTheme(cfg: KPIConfig | undefined, n: number | null) {
  if (!cfg || n === null) {
    return {
      card: "bg-slate-50 border-slate-200",
      value: "text-slate-800",
    };
  }

  if (cfg.goodWhen === "positive") {
    if (n > 0)  return { card: "bg-emerald-50  border-emerald-200", value: "text-emerald-700" };
    if (n < 0)  return { card: "bg-red-50      border-red-200",     value: "text-red-700"     };
    return       { card: "bg-slate-50     border-slate-200",    value: "text-slate-600"   };
  }

  if (cfg.goodWhen === "negative") {
    if (n > 0)  return { card: "bg-amber-50   border-amber-200",  value: "text-amber-700"  };
    return       { card: "bg-slate-50    border-slate-200",   value: "text-slate-600"  };
  }

  // neutral
  return { card: "bg-slate-50 border-slate-200", value: "text-slate-800" };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-xl p-5 bg-white shadow-sm animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-7 bg-gray-200 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  const kpisQuery = useQuery<KPIResult[]>({
    queryKey: qk.entitySnapshot(entityId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_entity_snapshot", {
        p_entity_id: entityId,
      });
      if (error) throw error;
      return Array.isArray(data) ? (data as KPIResult[]) : [];
    },
    staleTime: 15_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Key Performance Indicators</h2>
        {kpisQuery.isFetching && !kpisQuery.isLoading && (
          <span className="text-xs text-gray-400 animate-pulse">Refreshing…</span>
        )}
      </div>

      {/* Loading */}
      {kpisQuery.isLoading && <KPISkeleton />}

      {/* Error */}
      {kpisQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load KPIs:{" "}
          {String((kpisQuery.error as any)?.message ?? kpisQuery.error)}
        </div>
      )}

      {/* Empty state */}
      {!kpisQuery.isLoading && !kpisQuery.isError && (kpisQuery.data ?? []).length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center space-y-3">
          <div className="text-2xl">📭</div>
          <div className="font-semibold text-gray-700">No financial data yet</div>
          <p className="text-sm text-gray-500">
            Record your first economic event to see KPIs appear here.
          </p>
          <button
            onClick={() => navigate(`/entities/${entityId}/ledger`)}
            className="inline-block mt-2 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Ledger →
          </button>
        </div>
      )}

      {/* KPI grid */}
      {!kpisQuery.isLoading && (kpisQuery.data ?? []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(kpisQuery.data ?? []).map((k) => {
            const n = toNumber(k.value);
            const cfg = KPI_CONFIG[k.label];
            const theme = getCardTheme(cfg, n);

            return (
              <div
                key={k.label}
                className={`border rounded-xl p-5 shadow-sm flex flex-col gap-1 transition-shadow hover:shadow-md ${theme.card}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {k.label}
                  </span>
                  {cfg?.icon && (
                    <span className="text-lg leading-none opacity-60">{cfg.icon}</span>
                  )}
                </div>
                <div className={`text-2xl font-bold tabular-nums mt-1 ${theme.value}`}>
                  {formatZAR(k.value)}
                </div>
                {/* Health indicator */}
                {n !== null && n !== 0 && cfg?.goodWhen === "positive" && n < 0 && (
                  <div className="text-xs text-red-500 font-medium mt-0.5">
                    ↓ Negative — review expenses
                  </div>
                )}
                {n !== null && n !== 0 && cfg?.goodWhen === "negative" && n > 0 && (
                  <div className="text-xs text-amber-600 font-medium mt-0.5">
                    Outstanding obligations
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}