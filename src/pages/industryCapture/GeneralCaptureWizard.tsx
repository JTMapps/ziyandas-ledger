// src/pages/industryCapture/GeneralCaptureWizard.tsx

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";
import AccountPicker from "../../components/pickers/AccountPicker";

// ─── Config ───────────────────────────────────────────────────────────────────

type WizardType =
  | "cash-sale"
  | "credit-sale"
  | "cash-expense"
  | "credit-expense"
  | "asset-purchase"
  | "depreciation"
  | "loan-received"
  | "loan-repaid"
  | "owner-investment"
  | "owner-withdrawal";

interface WizardConfig {
  title: string;
  subtitle: string;
  eventType: string;
  debitLabel: string;
  creditLabel: string;
}

const WIZARD_CONFIG: Record<WizardType, WizardConfig> = {
  "cash-sale": {
    title: "Cash Sale",
    subtitle: "Revenue received immediately in cash.",
    eventType: "CASH_SALE",
    debitLabel: "Cash account (receives money)",
    creditLabel: "Revenue account (income recognised)",
  },
  "credit-sale": {
    title: "Credit Sale",
    subtitle: "Invoice a customer — creates a receivable, paid later.",
    eventType: "CREDIT_SALE",
    debitLabel: "Trade receivables (asset created)",
    creditLabel: "Revenue account (income recognised)",
  },
  "cash-expense": {
    title: "Cash Expense",
    subtitle: "Expense paid immediately from cash.",
    eventType: "CASH_EXPENSE",
    debitLabel: "Expense account (cost incurred)",
    creditLabel: "Cash account (pays out)",
  },
  "credit-expense": {
    title: "Expense on Credit",
    subtitle: "Bill received but not yet paid — creates a payable.",
    eventType: "EXPENSE_ON_CREDIT",
    debitLabel: "Expense account (cost incurred)",
    creditLabel: "Trade payables (liability created)",
  },
  "asset-purchase": {
    title: "Asset Purchase",
    subtitle: "Buy a long-term asset for cash.",
    eventType: "ASSET_PURCHASED_CASH",
    debitLabel: "Asset account (new asset acquired)",
    creditLabel: "Cash account (pays out)",
  },
  depreciation: {
    title: "Depreciation",
    subtitle: "Record the period depreciation charge.",
    eventType: "DEPRECIATION",
    debitLabel: "Depreciation expense account",
    creditLabel: "Accumulated depreciation account",
  },
  "loan-received": {
    title: "Loan Received",
    subtitle: "Borrow funds — increases cash and creates a liability.",
    eventType: "LOAN_RECEIVED",
    debitLabel: "Cash account (receives funds)",
    creditLabel: "Loan liability account",
  },
  "loan-repaid": {
    title: "Loan Repaid",
    subtitle: "Repay principal on a loan.",
    eventType: "LOAN_REPAID",
    debitLabel: "Loan liability account (reduces)",
    creditLabel: "Cash account (pays out)",
  },
  "owner-investment": {
    title: "Owner Investment",
    subtitle: "Capital contributed by the owner.",
    eventType: "OWNER_INVESTMENT",
    debitLabel: "Cash account (receives funds)",
    creditLabel: "Equity / capital account",
  },
  "owner-withdrawal": {
    title: "Owner Withdrawal",
    subtitle: "Drawings taken by the owner.",
    eventType: "OWNER_WITHDRAWAL",
    debitLabel: "Equity / drawings account",
    creditLabel: "Cash account (pays out)",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayYYYYMMDD() {
  return new Date().toISOString().slice(0, 10);
}

function isWizardType(x: string): x is WizardType {
  return x in WIZARD_CONFIG;
}

function parsePositiveAmount(input: string): number | null {
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function backHref(entityId?: string) {
  return entityId ? `/entities/${entityId}/ledger` : `/entities`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GeneralCaptureWizard() {
  const { entityId, wizardType } = useParams<{
    entityId?: string;
    wizardType?: string;
  }>();

  const navigate = useNavigate();
  const qc = useQueryClient();

  const config = useMemo<WizardConfig | null>(() => {
    if (!wizardType) return null;
    return isWizardType(wizardType) ? WIZARD_CONFIG[wizardType] : null;
  }, [wizardType]);

  // ── Guard ────────────────────────────────────────────────────────────────
  if (!entityId || !wizardType || !config) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <div className="rounded bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Unknown capture type:</strong> "{wizardType ?? "undefined"}"
        </div>
        <button
          className="text-sm text-gray-500 hover:text-black underline"
          onClick={() => navigate(backHref(entityId))}
        >
          ← Back to Ledger
        </button>
      </div>
    );
  }

  // ✅ Freeze narrowed values so TS keeps them inside closures too
  const eid = entityId; // string
  const cfg = config;   // WizardConfig

  const backToLedger = () => navigate(`/entities/${eid}/ledger`);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(todayYYYYMMDD());
  const [debitAccId, setDebitAccId] = useState("");
  const [creditAccId, setCreditAccId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amt = parsePositiveAmount(amount);
  const hasAccounts =
    !!debitAccId && !!creditAccId && debitAccId !== creditAccId;

  const hasPreview = amt !== null && hasAccounts;
  const canSubmit = !loading && hasPreview;

  async function handleSubmit() {
    setError(null);

    const parsed = parsePositiveAmount(amount);
    if (parsed === null) return setError("Amount must be greater than 0.");
    if (!debitAccId) return setError("Select the debit account.");
    if (!creditAccId) return setError("Select the credit account.");
    if (debitAccId === creditAccId)
      return setError("Debit and credit accounts must be different.");

    setLoading(true);
    try {
      const { error: rpcErr } = await supabase.rpc("record_economic_event", {
        p_entity_id: eid,
        p_event_type: cfg.eventType,
        p_event_date: eventDate,
        p_description: description.trim() || cfg.subtitle,
        p_effects: [
          {
            account_id: debitAccId,
            amount: parsed,
            effect_sign: 1,
            tax_treatment: null,
            deductible: false,
          },
          {
            account_id: creditAccId,
            amount: parsed,
            effect_sign: -1,
            tax_treatment: null,
            deductible: false,
          },
        ],
      });

      if (rpcErr) throw new Error(rpcErr.message);

      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.economicEvents(eid) }),
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(eid) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(eid) }),
        qc.invalidateQueries({ queryKey: qk.periods(eid) }),
      ]);

      backToLedger();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to post. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <button
        className="text-xs text-gray-400 hover:text-gray-700"
        onClick={backToLedger}
      >
        ← Ledger
      </button>

      <div>
        <h2 className="text-xl font-semibold">{cfg.title}</h2>
        <p className="text-sm text-gray-500 mt-1">{cfg.subtitle}</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Date</label>
        <input
          type="date"
          value={eventDate}
          disabled={loading}
          onChange={(e) => setEventDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Amount</label>
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          value={amount}
          disabled={loading}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">
          Description (optional)
        </label>
        <input
          type="text"
          placeholder={cfg.subtitle}
          value={description}
          disabled={loading}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">
          Debit — <span className="text-gray-400 font-normal">{cfg.debitLabel}</span>
        </label>
        <AccountPicker
          entityId={eid}
          value={debitAccId}
          onChange={setDebitAccId}
          disabled={loading}
          leafOnly
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">
          Credit — <span className="text-gray-400 font-normal">{cfg.creditLabel}</span>
        </label>
        <AccountPicker
          entityId={eid}
          value={creditAccId}
          onChange={setCreditAccId}
          disabled={loading}
          leafOnly
        />
      </div>

      {hasPreview && (
        <div className="rounded bg-gray-50 border p-3 text-xs font-mono space-y-1">
          <div className="text-gray-400 mb-1 text-[10px] uppercase tracking-wide">
            Journal preview
          </div>
          <div className="text-gray-700">
            DR &nbsp;{debitAccId.slice(0, 8)}…&emsp;
            {amt?.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-gray-700 pl-8">
            CR &nbsp;{creditAccId.slice(0, 8)}…&emsp;
            {amt?.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          disabled={loading}
          onClick={backToLedger}
          className="text-sm text-gray-500 hover:text-black disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="bg-black text-white text-sm px-5 py-2 rounded shadow hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          {loading ? "Posting…" : `Post ${cfg.title}`}
        </button>
      </div>
    </div>
  );
}