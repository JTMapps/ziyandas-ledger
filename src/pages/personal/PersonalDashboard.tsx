// src/pages/personal/PersonalDashboard.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import SalaryWizard from "../../domain/templates/personalCapture/SalaryWizard";
import ExpenseWizard from "../../domain/templates/personalCapture/ExpenseWizard";
import TransferWizard from "../../domain/templates/personalCapture/TransferWizard";

export default function PersonalDashboard() {
  const { entityId } = useParams();
  const [wizard, setWizard] = useState<"salary" | "expense" | "transfer" | null>(null);

  if (!entityId) return <div>No entity found.</div>;

  // ------------------------------------------------------------
  // LOAD KPIs (cash, savings, income, expenses)
  // ------------------------------------------------------------
  const kpiQuery = useQuery({
    queryKey: ["personal-kpis", entityId],
    queryFn: async () => {
      // Note: uses existing accounts + event_effects
      const { data, error } = await supabase.rpc("get_personal_kpis", {
        p_entity_id: entityId,
      });
      if (error) throw error;
      return data;
    },
  });

  // ------------------------------------------------------------
  // Recent Transactions (events)
  // ------------------------------------------------------------
  const eventsQuery = useQuery({
    queryKey: ["recent-events", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("economic_events")
        .select("id, description, event_date, event_type, created_at")
        .eq("entity_id", entityId)
        .order("event_date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  const KPIs = kpiQuery.data || {};

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Personal Dashboard</h1>

      {/* -------------------------------------------------------- */}
      {/* KPI CARDS */}
      {/* -------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Cash Balance" value={KPIs.cash_balance} />
        <KpiCard label="Savings" value={KPIs.savings_balance} />
        <KpiCard label="Net Worth" value={KPIs.net_worth} />
      </div>

      {/* -------------------------------------------------------- */}
      {/* QUICK ACTIONS */}
      {/* -------------------------------------------------------- */}
      <div className="flex space-x-4">
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

      {/* -------------------------------------------------------- */}
      {/* RECENT ACTIVITY */}
      {/* -------------------------------------------------------- */}
      <section className="bg-white border rounded p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Recent Activity</h2>

        <div className="divide-y">
          {eventsQuery.data?.map((ev) => (
            <div key={ev.id} className="py-2 flex justify-between text-sm">
              <span>
                <span className="text-gray-500">{ev.event_date}</span> — {ev.description}
              </span>
              <span className="text-gray-400">{ev.event_type}</span>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- */}
      {/* WIZARD MODALS */}
      {/* -------------------------------------------------------- */}
      {wizard === "salary" && (
        <Modal onClose={() => setWizard(null)}>
          <SalaryWizard entityId={entityId} onClose={() => setWizard(null)} />
        </Modal>
      )}

      {wizard === "expense" && (
        <Modal onClose={() => setWizard(null)}>
          <ExpenseWizard entityId={entityId} onClose={() => setWizard(null)} />
        </Modal>
      )}

      {wizard === "transfer" && (
        <Modal onClose={() => setWizard(null)}>
          <TransferWizard entityId={entityId} onClose={() => setWizard(null)} />
        </Modal>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// KPI CARD COMPONENT
// ------------------------------------------------------------
function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 bg-white border rounded shadow-sm">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-xl font-bold">{Number(value || 0).toLocaleString()}</div>
    </div>
  );
}

// ------------------------------------------------------------
// GENERIC MODAL WRAPPER
// ------------------------------------------------------------
function Modal({ children, onClose }: { children: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-500"
          onClick={onClose}
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}
