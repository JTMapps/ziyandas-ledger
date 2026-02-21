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
  cash_balance: number;
  savings_balance: number;
  net_worth: number;
  as_of?: string; // date
};

type EconomicEventRow = {
  id: string;
  description: string | null;
  event_date: string; // date
  event_type: string | null; // economic_event_type
  created_at: string; // timestamp
};

export default function PersonalDashboard() {
  const { entityId } = useParams<{ entityId: string }>();
  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;
  const id = entityId;

  const [wizard, setWizard] = useState<WizardKind>(null);

  // Personal KPI RPC (DB-supported):contentReference[oaicite:8]{index=8}
  const kpiQuery = useQuery<PersonalKpis>({
    queryKey: ["personal-kpis", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_personal_kpis", {
        p_entity_id: id,
        // p_as_of is optional due to DEFAULT CURRENT_DATE:contentReference[oaicite:9]{index=9}
      });

      if (error) throw error;

      const obj = (data ?? {}) as Partial<PersonalKpis>;
      return {
        cash_balance: Number(obj.cash_balance ?? 0),
        savings_balance: Number(obj.savings_balance ?? 0),
        net_worth: Number(obj.net_worth ?? 0),
        as_of: obj.as_of,
      };
    },
    staleTime: 30_000,
  });

  // Recent activity from active view (soft delete safe):contentReference[oaicite:10]{index=10}
  const eventsQuery = useQuery<EconomicEventRow[]>({
    queryKey: ["recent-events", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("economic_events_active")
        .select("id, description, event_date, event_type, created_at")
        .eq("entity_id", id)
        .order("event_date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data ?? []) as EconomicEventRow[];
    },
  });

  const KPIs = useMemo(() => kpiQuery.data, [kpiQuery.data]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Personal Dashboard</h1>
        <p className="text-sm text-gray-600">
          Track personal cash, savings, and net worth. Record events as double-entry economic events.
        </p>
      </div>

      {kpiQuery.isLoading && <div className="text-sm text-gray-600">Loading KPIs…</div>}
      {kpiQuery.error && (
        <div className="text-sm text-red-600">
          Failed to load KPIs: {String((kpiQuery.error as any)?.message ?? kpiQuery.error)}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Cash Balance" value={KPIs?.cash_balance} />
        <KpiCard label="Savings" value={KPIs?.savings_balance} />
        <KpiCard label="Net Worth" value={KPIs?.net_worth} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setWizard("salary")} className="px-4 py-2 bg-blue-600 text-white rounded">
          + Salary
        </button>
        <button onClick={() => setWizard("expense")} className="px-4 py-2 bg-black text-white rounded">
          + Expense
        </button>
        <button onClick={() => setWizard("transfer")} className="px-4 py-2 bg-green-600 text-white rounded">
          ⇄ Transfer
        </button>
      </div>

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

function KpiCard({ label, value }: { label: string; value?: number }) {
  const num = typeof value === "number" ? value : 0;
  return (
    <div className="p-4 bg-white border rounded shadow-sm">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-xl font-bold">
        {num.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
        <button type="button" className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}