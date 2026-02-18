// src/pages/personal/PersonalDashboard.tsx

import React, { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import SalaryWizard from "../../domain/templates/personalCapture/SalaryWizard";
import ExpenseWizard from "../../domain/templates/personalCapture/ExpenseWizard";
import TransferWizard from "../../domain/templates/personalCapture/TransferWizard";

type WizardKind = "salary" | "expense" | "transfer" | null;

type PersonalKpis = {
  cash_balance?: number | null;
  savings_balance?: number | null;
  net_worth?: number | null;
};

type SnapshotRow = {
  label: string;
  value: number | string | null;
};

type EconomicEventRow = {
  id: string;
  description: string | null;
  event_date: string;
  event_type: string | null;
  created_at: string;
};

export default function PersonalDashboard() {
  const params = useParams();
  const entityId = params.entityId;

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;
  const id: string = entityId; // TS narrowing (string, not undefined)

  const [wizard, setWizard] = useState<WizardKind>(null);

  // ------------------------------------------------------------
  // KPIs
  // Prefer get_personal_kpis if it exists; otherwise fallback to get_entity_snapshot
  // ------------------------------------------------------------
  const kpiQuery = useQuery<PersonalKpis>({
    queryKey: ["personal-kpis", id],
    enabled: !!id,
    queryFn: async () => {
      // Attempt personal KPI RPC (if you created it)
      const { data: personalData, error: personalErr } = await supabase.rpc(
        "get_personal_kpis",
        { p_entity_id: id }
      );

      if (!personalErr && personalData) {
        // Accept either object or first row of array
        if (Array.isArray(personalData)) return (personalData[0] ?? {}) as PersonalKpis;
        return personalData as PersonalKpis;
      }

      // Fallback to generic snapshot RPC you already use elsewhere
      const { data: snapData, error: snapErr } = await supabase.rpc("get_entity_snapshot", {
        p_entity_id: id,
      });

      if (snapErr) {
        // If personal_kpis doesn't exist, Postgres may return error; we fallback and still might fail.
        // Throw the fallback error so UI shows something useful.
        throw snapErr;
      }

      const rows: SnapshotRow[] = Array.isArray(snapData) ? (snapData as SnapshotRow[]) : [];

      // Map “snapshot rows” into a small personal KPI object
      // (Adjust labels if your RPC returns different strings.)
      const byLabel = new Map(rows.map((r) => [String(r.label).toLowerCase(), r.value]));
      const num = (v: unknown) => (typeof v === "number" ? v : v == null ? null : Number(v));

      return {
        cash_balance: num(byLabel.get("cash") ?? byLabel.get("cash balance")),
        savings_balance: num(byLabel.get("savings") ?? byLabel.get("savings balance")),
        net_worth: num(byLabel.get("net worth") ?? byLabel.get("net_worth")),
      };
    },
  });

  // ------------------------------------------------------------
  // Recent events
  // ------------------------------------------------------------
  const eventsQuery = useQuery<EconomicEventRow[]>({
    queryKey: ["recent-events", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("economic_events")
        .select("id, description, event_date, event_type, created_at")
        .eq("entity_id", id)
        .order("event_date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data ?? []) as EconomicEventRow[];
    },
  });

  const KPIs = useMemo<PersonalKpis>(() => kpiQuery.data ?? {}, [kpiQuery.data]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Personal Dashboard</h1>
        <p className="text-sm text-gray-600">
          Track personal cash, savings, and net worth. Record events as double-entry economic events.
        </p>
      </div>

      {/* KPI loading / error */}
      {kpiQuery.isLoading && <div className="text-sm text-gray-600">Loading KPIs…</div>}
      {kpiQuery.error && (
        <div className="text-sm text-red-600">
          Failed to load KPIs: {String((kpiQuery.error as any)?.message ?? kpiQuery.error)}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Cash Balance" value={KPIs.cash_balance} />
        <KpiCard label="Savings" value={KPIs.savings_balance} />
        <KpiCard label="Net Worth" value={KPIs.net_worth} />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setWizard("salary")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          + Salary
        </button>

        <button
          onClick={() => setWizard("expense")}
          className="px-4 py-2 bg-black text-white rounded"
        >
          + Expense
        </button>

        <button
          onClick={() => setWizard("transfer")}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          ⇄ Transfer
        </button>
      </div>

      {/* Recent activity */}
      <section className="bg-white border rounded p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent Activity</h2>
          {eventsQuery.isLoading && <span className="text-xs text-gray-500">Loading…</span>}
        </div>

        {eventsQuery.error && (
          <div className="text-sm text-red-600 mt-2">
            Failed to load activity: {String((eventsQuery.error as any)?.message ?? eventsQuery.error)}
          </div>
        )}

        <div className="divide-y mt-2">
          {(eventsQuery.data ?? []).map((ev) => (
            <div key={ev.id} className="py-2 flex justify-between gap-4 text-sm">
              <span className="min-w-0">
                <span className="text-gray-500">{ev.event_date}</span>
                <span className="text-gray-400"> — </span>
                <span className="truncate">{ev.description ?? "No description"}</span>
              </span>
              <span className="text-gray-400 whitespace-nowrap">{ev.event_type ?? "—"}</span>
            </div>
          ))}

          {!eventsQuery.isLoading && (eventsQuery.data?.length ?? 0) === 0 && (
            <div className="py-3 text-sm text-gray-500">No activity yet.</div>
          )}
        </div>
      </section>

      {/* Wizard modals */}
      {wizard === "salary" && (
        <Modal onClose={() => setWizard(null)}>
          <SalaryWizard entityId={id} onClose={() => setWizard(null)} />
        </Modal>
      )}

      {wizard === "expense" && (
        <Modal onClose={() => setWizard(null)}>
          <ExpenseWizard entityId={id} onClose={() => setWizard(null)} />
        </Modal>
      )}

      {wizard === "transfer" && (
        <Modal onClose={() => setWizard(null)}>
          <TransferWizard entityId={id} onClose={() => setWizard(null)} />
        </Modal>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// KPI CARD
// ------------------------------------------------------------
function KpiCard({ label, value }: { label: string; value?: number | null }) {
  const num = typeof value === "number" ? value : 0;

  return (
    <div className="p-4 bg-white border rounded shadow-sm">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-xl font-bold">{num.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </div>
  );
}

// ------------------------------------------------------------
// MODAL WRAPPER
// ------------------------------------------------------------
function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
