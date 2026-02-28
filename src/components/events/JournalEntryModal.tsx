// src/components/events/JournalEntryModal.tsx
//
// ARCHITECTURE NOTE:
// This modal is the ESCAPE HATCH for power users / accountants.
// Normal users should never reach here — they use the industry wizards
// (RetailSaleWizard, ServicesClientInvoiceWizard, etc.) which call
// TemplateJournalEngine and construct journal entries automatically.
//
// This raw form is intentionally restricted to GENERAL_JOURNAL only
// to signal that intent: if you know what accounts to debit/credit,
// you may post here. All other event types belong in their wizards.
//
// The parent account error ("Cannot post to parent account") is enforced
// by the DB trigger prevent_posting_to_parent_account. This modal now
// surfaces that constraint clearly in the UI by showing account hierarchy.

import { useMemo, useState } from "react";
import AccountPicker from "../pickers/AccountPicker";
import { useRecordEconomicEvent } from "../../hooks/useEconomicEvents";

interface Props {
  entityId: string;
  onClose: () => void;
}

type EffectSign = 1 | -1;

interface LineItem {
  account_id: string;
  account_label: string; // display name to catch parent accounts visually
  amount: string;        // string for controlled input, parse on submit
  effect_sign: EffectSign;
}

function todayYYYYMMDD(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeBlankLine(sign: EffectSign = 1): LineItem {
  return { account_id: "", account_label: "", amount: "", effect_sign: sign };
}

export default function JournalEntryModal({ entityId, onClose }: Props) {
  const [eventDate, setEventDate]     = useState(todayYYYYMMDD());
  const [description, setDescription] = useState("");
  const [lines, setLines]             = useState<LineItem[]>([
    makeBlankLine(1),   // debit
    makeBlankLine(-1),  // credit
  ]);

  const recordEvent = useRecordEconomicEvent();

  // ── Totals ──────────────────────────────────────────────────────────────
  const debitTotal  = useMemo(() =>
    lines.filter(l => l.effect_sign === 1)
         .reduce((s, l) => s + (parseFloat(l.amount) || 0), 0), [lines]);

  const creditTotal = useMemo(() =>
    lines.filter(l => l.effect_sign === -1)
         .reduce((s, l) => s + (parseFloat(l.amount) || 0), 0), [lines]);

  const isBalanced  = debitTotal > 0 && Math.abs(debitTotal - creditTotal) < 0.0001;
  const allFilled   = lines.every(l => !!l.account_id && parseFloat(l.amount) > 0);
  const canSubmit   = !recordEvent.isPending && lines.length >= 2 && isBalanced && allFilled;

  // ── Line management ─────────────────────────────────────────────────────
  function updateLine<K extends keyof LineItem>(i: number, key: K, value: LineItem[K]) {
    setLines(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next;
    });
  }

  function setLineAccount(i: number, id: string, label: string) {
    setLines(prev => {
      const next = [...prev];
      next[i] = { ...next[i], account_id: id, account_label: label };
      return next;
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    await recordEvent.mutateAsync(
      {
        entityId,
        eventType: "GENERAL_JOURNAL",
        eventDate,
        description: description.trim() || null,
        effects: lines.map(l => ({
          account_id:    l.account_id,
          amount:        parseFloat(l.amount),
          effect_sign:   l.effect_sign,
          tax_treatment: null,
          deductible:    false,
        })),
      },
      { onSuccess: onClose }
    );
  }

  const isPending = recordEvent.isPending;
  const errorMsg  = recordEvent.error
    ? String((recordEvent.error as any)?.message ?? recordEvent.error)
    : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">General Journal Entry</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Advanced · Post directly to leaf accounts
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 leading-relaxed">
            <strong>This is a manual journal entry form.</strong> For common transactions —
            sales, expenses, payroll, rent — use the activity wizards in the sidebar instead.
            They auto-generate correct double-entry journals from intent.
          </div>

          {/* Date + Description row */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Date</label>
              <input
                type="date"
                value={eventDate}
                disabled={isPending}
                onChange={e => setEventDate(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-gray-500">Description</label>
              <input
                type="text"
                value={description}
                disabled={isPending}
                placeholder="Narration (optional)"
                onChange={e => setDescription(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Journal lines */}
          <div>
            <div className="grid grid-cols-[1fr_120px_100px_24px] gap-2 mb-1 px-1">
              <span className="text-xs font-medium text-gray-500">Account</span>
              <span className="text-xs font-medium text-gray-500">Amount</span>
              <span className="text-xs font-medium text-gray-500">Dr / Cr</span>
              <span />
            </div>

            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_100px_24px] gap-2 items-center">

                  <AccountPicker
                    entityId={entityId}
                    value={line.account_id}
                    onChange={(id, label) => setLineAccount(i, id, label ?? "")}
                    disabled={isPending}
                    leafOnly
                  />

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={line.amount}
                    disabled={isPending}
                    onChange={e => updateLine(i, "amount", e.target.value)}
                    className="border rounded px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-black"
                  />

                  <select
                    value={line.effect_sign}
                    disabled={isPending}
                    onChange={e => updateLine(i, "effect_sign", Number(e.target.value) as EffectSign)}
                    className="border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value={1}>Debit</option>
                    <option value={-1}>Credit</option>
                  </select>

                  {lines.length > 2 ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-gray-300 hover:text-red-500 text-lg leading-none"
                      aria-label="Remove line"
                    >
                      ×
                    </button>
                  ) : <span />}
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => setLines(prev => [...prev, makeBlankLine(1)])}
              className="mt-3 text-xs text-blue-600 hover:underline disabled:opacity-40"
            >
              + Add line
            </button>
          </div>

          {/* Balance summary */}
          <div className={`rounded p-3 text-sm flex justify-between items-center ${
            isBalanced ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}>
            <div className="space-y-0.5">
              <div className="text-xs text-gray-500">
                Debits: <span className="font-mono font-medium text-gray-800">
                  {debitTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Credits: <span className="font-mono font-medium text-gray-800">
                  {creditTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <span className={`text-sm font-medium ${isBalanced ? "text-green-700" : "text-red-600"}`}>
              {isBalanced ? "✔ Balanced" : "✘ Not balanced"}
            </span>
          </div>

          {/* DB error */}
          {errorMsg && (
            <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errorMsg.includes("parent account")
                ? <>
                    <strong>Cannot post to a parent account.</strong>
                    {" "}Select a child (leaf) account — e.g. "1100 — Cash" not "1000 — Assets".
                    Parent accounts are summary headers only.
                  </>
                : errorMsg
              }
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-sm text-gray-600 hover:text-black disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="bg-black text-white text-sm px-5 py-2 rounded shadow hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {isPending ? "Posting…" : "Post Journal Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}