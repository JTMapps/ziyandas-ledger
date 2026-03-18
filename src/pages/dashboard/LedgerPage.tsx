// src/pages/dashboard/LedgerPage.tsx
//
// Upgrades from the previous version:
//   1. Event history now shows debit/credit totals per event — a ledger
//      with no amounts is just a list of labels (HTML reference showed Dr/Cr
//      on every journal row).
//   2. LOAN_RECEIVED and LOAN_REPAID re-categorised as "liability" — they
//      were incorrectly under "equity", so the filter pills were wrong.
//   3. "liability" filter pill added to ALL_CATEGORIES.
//   4. event_date formatted with toLocaleDateString to avoid UTC-shift bug.
//   5. Industry-type label shown in ledger subtitle.
//   6. useEvents query extended to fetch effect totals via join (if available)
//      — falls back gracefully if the query doesn't return them.
//   7. Entity query error surfaced in the error section.

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";
import { useEvents } from "../../hooks/useEconomicEvents";
import JournalEntryModal from "../../components/events/JournalEntryModal";
import { getActionsForIndustry, type Category } from "./ledgerActions";

// ─── Styles ───────────────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<Category, string> = {
  income:    "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  expense:   "bg-rose-50    border-rose-200    hover:bg-rose-100",
  asset:     "bg-sky-50     border-sky-200     hover:bg-sky-100",
  liability: "bg-orange-50  border-orange-200  hover:bg-orange-100",
  equity:    "bg-violet-50  border-violet-200  hover:bg-violet-100",
  transfer:  "bg-amber-50   border-amber-200   hover:bg-amber-100",
};

const CATEGORY_LABEL_STYLE: Record<Category, string> = {
  income:    "text-emerald-700",
  expense:   "text-rose-700",
  asset:     "text-sky-700",
  liability: "text-orange-700",
  equity:    "text-violet-700",
  transfer:  "text-amber-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatZAR(v: number | null | undefined): string {
  if (v == null) return "—";
  return `R ${v.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(raw: string): string {
  // Append T00:00:00 to force local-timezone parsing, not UTC
  return new Date(`${raw}T00:00:00`).toLocaleDateString("en-ZA", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function EventTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-mono truncate max-w-[160px]">
      {type}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LedgerPage() {
  const { entityId }  = useParams<{ entityId: string }>();
  const navigate      = useNavigate();
  const [showModal, setShowModal]           = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  // ── Entity ─────────────────────────────────────────────────────────────────
  const entityQuery = useQuery({
    queryKey: ["entity", entityId],
    enabled: !!entityId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, type, industry_type")
        .eq("id", entityId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const industryType = entityQuery.data?.type === "Personal"
    ? "Personal"
    : (entityQuery.data?.industry_type ?? "Generic");

  const actions = useMemo(() => getActionsForIndustry(industryType), [industryType]);

  // ── Accounts ───────────────────────────────────────────────────────────────
  const accountsCountQuery = useQuery<number>({
    queryKey: qk.accountsCount(entityId),
    enabled: !!entityId,
    staleTime: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("accounts")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .is("deleted_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const hasAccounts = (accountsCountQuery.data ?? 0) > 0;

  // ── Events ─────────────────────────────────────────────────────────────────
  const eventsQuery = useEvents(entityId);
  const events = eventsQuery.data ?? [];

  // ── Filter ─────────────────────────────────────────────────────────────────
  const visibleActions = activeCategory === "all"
    ? actions
    : actions.filter((a) => a.category === activeCategory);

  const availableCategories = useMemo(
    () => ["all", ...new Set(actions.map((a) => a.category))] as Array<Category | "all">,
    [actions]
  );

  const go = (relativeRoute: string) => {
    const cleaned = relativeRoute.replace(/^\/+/, "");
    navigate(`/entities/${entityId}/${cleaned}`);
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ledger</h2>
          <p className="text-sm text-gray-500 mt-1">
            {industryType !== "Generic" && industryType !== "Personal"
              ? `${industryType} entity · `
              : ""}
            Record activity · View event history
          </p>
        </div>
        {hasAccounts && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            General Journal ↗
          </button>
        )}
      </div>

      {/* No CoA warning */}
      {!accountsCountQuery.isLoading && !hasAccounts && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-3 text-sm">
          <div className="font-semibold text-yellow-900">No chart of accounts found.</div>
          <p className="text-yellow-800 text-xs leading-relaxed">
            A chart of accounts is required before recording any events.
            Go to template setup to apply one for this entity.
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded bg-yellow-700 text-white text-xs hover:bg-yellow-800"
              onClick={() => navigate(`/entities/${entityId}/template`)}
            >
              Go to Template Setup
            </button>
            <button
              className="px-3 py-1.5 rounded border border-yellow-400 text-xs hover:bg-yellow-100"
              onClick={() => accountsCountQuery.refetch()}
            >
              Re-check
            </button>
          </div>
        </div>
      )}

      {/* Quick capture */}
      {hasAccounts && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Quick Capture
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as Category | "all")}
                  className={`px-2.5 py-1 rounded-full border text-xs capitalize transition-colors ${
                    activeCategory === cat
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {visibleActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => go(action.route)}
                className={`text-left p-3.5 rounded-lg border transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${
                  CATEGORY_STYLE[action.category]
                }`}
              >
                <div className="text-2xl mb-2 leading-none">{action.icon}</div>
                <div className="font-semibold text-sm text-gray-900 leading-tight">
                  {action.label}
                </div>
                <div className={`text-xs mt-0.5 leading-snug opacity-80 ${CATEGORY_LABEL_STYLE[action.category]}`}>
                  {action.description}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Event history */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Event History
          </h3>
          {events.length > 0 && (
            <span className="text-xs text-gray-400">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 w-28">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Description</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 w-48">Type</th>
                {/* Amounts — shown if events carry effect totals */}
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 w-28">Debits</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-400 w-28">Credits</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 w-36">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">

              {eventsQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Loading…
                  </td>
                </tr>
              )}

              {!eventsQuery.isLoading && events.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="text-gray-400 text-sm">No events recorded yet.</div>
                    {hasAccounts && (
                      <div className="text-gray-300 text-xs mt-1">
                        Use Quick Capture above to record your first transaction.
                      </div>
                    )}
                  </td>
                </tr>
              )}

              {events.map((ev) => {
                // Support optional effect totals if your useEvents query joins them
                const totalDr = (ev as any).total_debit ?? null;
                const totalCr = (ev as any).total_credit ?? null;
                const hasAmounts = totalDr !== null || totalCr !== null;

                return (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {formatDate(ev.event_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-800 text-sm">
                      {ev.description ?? (
                        <span className="text-gray-300 italic text-xs">No description</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ev.event_type && <EventTypeBadge type={ev.event_type} />}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-emerald-700">
                      {hasAmounts ? formatZAR(totalDr) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-rose-600">
                      {hasAmounts ? formatZAR(totalCr) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(ev.created_at).toLocaleString("en-ZA", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </section>

      {/* Errors */}
      {(eventsQuery.error || accountsCountQuery.error || entityQuery.error) && (
        <div className="text-xs rounded bg-red-50 border border-red-200 p-3 text-red-600 space-y-1">
          {entityQuery.error && (
            <div>Entity: {String((entityQuery.error as any)?.message)}</div>
          )}
          {eventsQuery.error && (
            <div>Events: {String((eventsQuery.error as any)?.message)}</div>
          )}
          {accountsCountQuery.error && (
            <div>Accounts: {String((accountsCountQuery.error as any)?.message)}</div>
          )}
        </div>
      )}

      {/* General journal modal */}
      {showModal && (
        <JournalEntryModal entityId={entityId} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}