// src/pages/dashboard/LedgerPage.tsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";
import { useEvents } from "../../hooks/useEconomicEvents";
import JournalEntryModal from "../../components/events/JournalEntryModal";

import { getActionsForIndustry, type Category } from "./ledgerActions";

const CATEGORY_STYLE: Record<Category, string> = {
  income: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  expense: "bg-rose-50 border-rose-200 hover:bg-rose-100",
  asset: "bg-sky-50 border-sky-200 hover:bg-sky-100",
  equity: "bg-violet-50 border-violet-200 hover:bg-violet-100",
  transfer: "bg-amber-50 border-amber-200 hover:bg-amber-100",
};

const CATEGORY_LABEL_STYLE: Record<Category, string> = {
  income: "text-emerald-700",
  expense: "text-rose-700",
  asset: "text-sky-700",
  equity: "text-violet-700",
  transfer: "text-amber-700",
};

export default function LedgerPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

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

  const industryType =
    entityQuery.data?.type === "Personal"
      ? "Personal"
      : entityQuery.data?.industry_type ?? "Generic";

  const actions = useMemo(() => getActionsForIndustry(industryType), [industryType]);

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

  const eventsQuery = useEvents(entityId);
  const events = eventsQuery.data ?? [];

  const visibleActions =
    activeCategory === "all"
      ? actions
      : actions.filter((a) => a.category === activeCategory);

  const availableCategories = useMemo(() => {
    return ["all", ...new Set(actions.map((a) => a.category))] as Array<Category | "all">;
  }, [actions]);

  const go = (relativeRoute: string) => {
    const cleaned = relativeRoute.replace(/^\/+/, "");
    navigate(`/entities/${entityId}/${cleaned}`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Ledger</h2>
          <p className="text-sm text-gray-500 mt-1">
            {industryType !== "Generic" && industryType !== "Personal" ? `${industryType} entity · ` : ""}
            Record activity · View event history
          </p>
        </div>

        {hasAccounts && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            title="Manual general journal entry — for accountants"
          >
            General Journal ↗
          </button>
        )}
      </div>

      {!accountsCountQuery.isLoading && !hasAccounts && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-3 text-sm">
          <div className="font-semibold text-yellow-900">No chart of accounts found.</div>
          <p className="text-yellow-800 text-xs leading-relaxed">
            A chart of accounts is required before recording any events. Go to template setup to apply one for
            this entity.
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

      {hasAccounts && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Capture</h3>

            <div className="flex gap-1.5">
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
                <div className="font-semibold text-sm text-gray-900 leading-tight">{action.label}</div>
                <div className={`text-xs mt-0.5 leading-snug opacity-80 ${CATEGORY_LABEL_STYLE[action.category]}`}>
                  {action.description}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Event history unchanged (keep yours) */}
      {/* ... */}

      {(eventsQuery.error || accountsCountQuery.error || entityQuery.error) && (
        <div className="text-xs rounded bg-red-50 border border-red-200 p-3 text-red-600 space-y-1">
          {entityQuery.error && <div>Entity: {String((entityQuery.error as any)?.message)}</div>}
          {eventsQuery.error && <div>Events: {String((eventsQuery.error as any)?.message)}</div>}
          {accountsCountQuery.error && <div>Accounts: {String((accountsCountQuery.error as any)?.message)}</div>}
        </div>
      )}

      {showModal && <JournalEntryModal entityId={entityId} onClose={() => setShowModal(false)} />}
    </div>
  );
}