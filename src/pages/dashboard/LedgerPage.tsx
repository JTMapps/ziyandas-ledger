// src/pages/dashboard/LedgerPage.tsx
//
// Wired to the actual wizard pages that exist in /src/pages/industryCapture/
// and /src/domain/templates/personalCapture/.
// Reads entity.industry_type via direct supabase query to show the right quick-capture
// actions for the current entity's industry.

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";
import { useEvents } from "../../hooks/useEconomicEvents";
import JournalEntryModal from "../../components/events/JournalEntryModal";

type Category = "income" | "expense" | "asset" | "equity" | "transfer";

interface CaptureAction {
  label: string;
  description: string;
  /** Relative to /entities/:entityId/ */
  route: string;
  icon: string;
  category: Category;
}

/**
 * Helper: keep your routing consistent.
 * - `route` is relative to /entities/:entityId/
 * - Generic capture goes through GeneralCaptureWizard: /capture/general?type=...
 * - Industry capture goes through IndustryRouter: /capture/industry/<industry>/<action>
 */
function makeRoute(path: string) {
  return path.replace(/^\/+/, "");
}

/** ----------------------------
 *  Generic business (NO industry)
 *  GeneralCaptureWizard expects ?type=...
 *  ---------------------------- */
const GENERIC_BUSINESS: CaptureAction[] = [
  {
    label: "Cash Sale",
    description: "Record revenue received in cash",
    route: makeRoute("capture/general?type=CASH_SALE"),
    icon: "💵",
    category: "income",
  },
  {
    label: "Credit Sale",
    description: "Invoice a customer — creates receivable",
    route: makeRoute("capture/general?type=CREDIT_SALE"),
    icon: "🧾",
    category: "income",
  },
  {
    label: "Cash Expense",
    description: "Expense paid directly from cash",
    route: makeRoute("capture/general?type=CASH_EXPENSE"),
    icon: "📤",
    category: "expense",
  },
  {
    label: "Expense on Credit",
    description: "Bill received, not yet paid",
    route: makeRoute("capture/general?type=EXPENSE_ON_CREDIT"),
    icon: "📋",
    category: "expense",
  },
  {
    label: "Asset Purchase",
    description: "Buy a long-term asset for cash",
    route: makeRoute("capture/general?type=ASSET_PURCHASED_CASH"),
    icon: "🏗️",
    category: "asset",
  },
  {
    label: "Depreciation",
    description: "Record period depreciation charge",
    route: makeRoute("capture/general?type=DEPRECIATION"),
    icon: "📉",
    category: "asset",
  },
  {
    label: "Loan Received",
    description: "Borrow funds — creates liability",
    route: makeRoute("capture/general?type=LOAN_RECEIVED"),
    icon: "🏦",
    category: "equity",
  },
  {
    label: "Loan Repaid",
    description: "Repay principal on a loan",
    route: makeRoute("capture/general?type=LOAN_REPAID"),
    icon: "↩️",
    category: "equity",
  },
  {
    label: "Owner Investment",
    description: "Capital contributed by the owner",
    route: makeRoute("capture/general?type=OWNER_INVESTMENT"),
    icon: "💼",
    category: "equity",
  },
  {
    label: "Owner Withdrawal",
    description: "Drawings taken by the owner",
    route: makeRoute("capture/general?type=OWNER_WITHDRAWAL"),
    icon: "💸",
    category: "equity",
  },
];

/** ----------------------------
 *  Industry-specific routes MUST match IndustryRouter.tsx
 *  IndustryRouter paths:
 *    Retail:        retail/sale, retail/purchase
 *    Manufacturing: manufacturing/consume, manufacturing/complete
 *    Services:      services/invoice, services/contractor
 *    Hospitality:   hospitality/room-sale, hospitality/meal-service
 *    RealEstate:    real-estate/rent-income, real-estate/maintenance
 *  ---------------------------- */
const RETAIL_ACTIONS: CaptureAction[] = [
  {
    label: "Retail Sale",
    description: "Record a retail sale with COGS",
    route: makeRoute("capture/industry/retail/sale"),
    icon: "🛒",
    category: "income",
  },
  {
    label: "Purchase Inventory",
    description: "Buy inventory from a supplier",
    route: makeRoute("capture/industry/retail/purchase"),
    icon: "📦",
    category: "expense",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Asset Purchase", "Depreciation", "Loan Received", "Loan Repaid", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

const MANUFACTURING_ACTIONS: CaptureAction[] = [
  {
    label: "Consume Raw Materials",
    description: "Move materials to WIP",
    route: makeRoute("capture/industry/manufacturing/consume"),
    icon: "⚙️",
    category: "expense",
  },
  {
    label: "Complete Production Batch",
    description: "Move WIP to finished goods",
    route: makeRoute("capture/industry/manufacturing/complete"),
    icon: "🏭",
    category: "income",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Cash Sale", "Credit Sale", "Asset Purchase", "Depreciation", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

const SERVICES_ACTIONS: CaptureAction[] = [
  {
    label: "Client Invoice",
    description: "Invoice a client for services rendered",
    route: makeRoute("capture/industry/services/invoice"),
    icon: "📨",
    category: "income",
  },
  {
    label: "Pay Contractor",
    description: "Pay an external contractor",
    route: makeRoute("capture/industry/services/contractor"),
    icon: "🤝",
    category: "expense",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Cash Expense", "Expense on Credit", "Loan Received", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

const REAL_ESTATE_ACTIONS: CaptureAction[] = [
  {
    label: "Rent Income",
    description: "Tenant rental payment received",
    route: makeRoute("capture/industry/real-estate/rent-income"),
    icon: "🏠",
    category: "income",
  },
  {
    label: "Maintenance Expense",
    description: "Property maintenance or repair cost",
    route: makeRoute("capture/industry/real-estate/maintenance"),
    icon: "🔧",
    category: "expense",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Asset Purchase", "Depreciation", "Loan Received", "Loan Repaid", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

const HOSPITALITY_ACTIONS: CaptureAction[] = [
  {
    label: "Room Sale",
    description: "Room night revenue",
    route: makeRoute("capture/industry/hospitality/room-sale"),
    icon: "🛏️",
    category: "income",
  },
  {
    label: "Meal Service",
    description: "Food & beverage service revenue",
    route: makeRoute("capture/industry/hospitality/meal-service"),
    icon: "🍽️",
    category: "income",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Cash Expense", "Expense on Credit", "Asset Purchase", "Depreciation", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

/** Personal routes (these are real pages you have) */
const PERSONAL_ACTIONS: CaptureAction[] = [
  {
    label: "Salary / Income",
    description: "Record a salary or income received",
    route: makeRoute("capture/personal/salary"),
    icon: "💰",
    category: "income",
  },
  {
    label: "Expense",
    description: "Record a personal expense",
    route: makeRoute("capture/personal/expense"),
    icon: "🧾",
    category: "expense",
  },
  {
    label: "Transfer",
    description: "Move money between your accounts",
    route: makeRoute("capture/personal/transfer"),
    icon: "↔️",
    category: "transfer",
  },
];

const ACTIONS_BY_INDUSTRY: Record<string, CaptureAction[]> = {
  Generic: GENERIC_BUSINESS,
  Retail: RETAIL_ACTIONS,
  Manufacturing: MANUFACTURING_ACTIONS,
  Services: SERVICES_ACTIONS,
  RealEstate: REAL_ESTATE_ACTIONS,
  Hospitality: HOSPITALITY_ACTIONS,
  Personal: PERSONAL_ACTIONS,
};

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

  // Fetch entity row directly — avoids depending on EntityProvider being in scope
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

  // Derive industry — falls back to "Generic" while loading or if unset
  const industryType =
    entityQuery.data?.type === "Personal"
      ? "Personal"
      : entityQuery.data?.industry_type ?? "Generic";

  const actions = ACTIONS_BY_INDUSTRY[industryType] ?? GENERIC_BUSINESS;

  // Accounts check
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

  // Events
  const eventsQuery = useEvents(entityId);
  const events = eventsQuery.data ?? [];

  // Filtered actions
  const visibleActions =
    activeCategory === "all" ? actions : actions.filter((a) => a.category === activeCategory);

  const availableCategories = useMemo(() => {
    return ["all", ...new Set(actions.map((a) => a.category))] as Array<Category | "all">;
  }, [actions]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
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

      {/* No accounts warning */}
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

      {/* Quick capture */}
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
                onClick={() => navigate(`/entities/${entityId}/${action.route}`)}
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

      {/* Event history */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Event History</h3>
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
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 w-36">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {eventsQuery.isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Loading…
                  </td>
                </tr>
              )}

              {!eventsQuery.isLoading && events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <div className="text-gray-400 text-sm">No events recorded yet.</div>
                    {hasAccounts && (
                      <div className="text-gray-300 text-xs mt-1">
                        Use Quick Capture above to record your first transaction.
                      </div>
                    )}
                  </td>
                </tr>
              )}

              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{ev.event_date}</td>
                  <td className="px-4 py-3 text-gray-800 text-sm">
                    {ev.description ?? <span className="text-gray-300 italic text-xs">No description</span>}
                  </td>
                  <td className="px-4 py-3">
                    {ev.event_type && (
                      <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-mono">
                        {ev.event_type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(ev.created_at).toLocaleString("en-ZA", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Errors */}
      {(eventsQuery.error || accountsCountQuery.error || entityQuery.error) && (
        <div className="text-xs rounded bg-red-50 border border-red-200 p-3 text-red-600 space-y-1">
          {entityQuery.error && <div>Entity: {String((entityQuery.error as any)?.message)}</div>}
          {eventsQuery.error && <div>Events: {String((eventsQuery.error as any)?.message)}</div>}
          {accountsCountQuery.error && <div>Accounts: {String((accountsCountQuery.error as any)?.message)}</div>}
        </div>
      )}

      {/* General journal escape hatch */}
      {showModal && <JournalEntryModal entityId={entityId} onClose={() => setShowModal(false)} />}
    </div>
  );
}