// src/components/events/JournalEntryModal.tsx
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";
import AccountPicker from "../pickers/AccountPicker";

interface Props {
  entityId: string;
  eventTypes: string[]; // economic_event_type enum values from DB
  onClose: () => void;
}

interface LineItem {
  account_id: string;
  amount: number;
  effect_sign: 1 | -1;
}

function todayYYYYMMDD() {
  return new Date().toISOString().slice(0, 10);
}

export default function JournalEntryModal({ entityId, eventTypes, onClose }: Props) {
  const qc = useQueryClient();

  const [eventDate, setEventDate] = useState<string>(todayYYYYMMDD());
  const [eventType, setEventType] = useState<string>(eventTypes[0] ?? "");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { account_id: "", amount: 0, effect_sign: 1 },
    { account_id: "", amount: 0, effect_sign: -1 },
  ]);

  const debitTotal = useMemo(
    () => lines.filter((l) => l.effect_sign === 1).reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
    [lines]
  );

  const creditTotal = useMemo(
    () => lines.filter((l) => l.effect_sign === -1).reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
    [lines]
  );

  const isBalanced = Math.abs(debitTotal - creditTotal) < 0.0001;

  function addLine() {
    setLines((prev) => [...prev, { account_id: "", amount: 0, effect_sign: 1 }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const postJournalMutation = useMutation({
    mutationFn: async () => {
      if (!eventType) throw new Error("Select an event type.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) throw new Error("Invalid date format.");
      if (lines.length < 2) throw new Error("At least 2 lines (debit + credit) are required.");
      if (!isBalanced) throw new Error("Journal must balance.");

      if (lines.some((l) => !l.account_id || Number(l.amount) <= 0)) {
        throw new Error("Each line needs an account and an amount > 0.");
      }

      // Normalize for DB constraints: amount > 0, sign ∈ {1,-1}
      const effects = lines.map((l) => ({
        account_id: l.account_id,
        amount: Math.abs(Number(l.amount) || 0),
        effect_sign: l.effect_sign === -1 ? -1 : 1,
        tax_treatment: null,
        deductible: false,
      }));

      const { data, error } = await supabase.rpc("record_economic_event", {
        p_entity_id: entityId,
        p_event_type: eventType,
        p_event_date: eventDate,
        p_description: description || "",
        p_effects: effects,
      });

      if (error) throw error;
      return data as string; // event_id uuid
    },

    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.economicEvents(entityId) }),
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(entityId) }),
      ]);
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-full max-w-2xl space-y-6 shadow-lg">
        <h2 className="text-xl font-bold">Record Journal Entry</h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* DATE */}
          <input
            type="date"
            value={eventDate}
            className="border p-2 rounded w-44"
            disabled={postJournalMutation.isPending}
            onChange={(e) => setEventDate(e.target.value)}
          />

          {/* EVENT TYPE */}
          <select
            className="border p-2 rounded"
            value={eventType}
            disabled={postJournalMutation.isPending || eventTypes.length === 0}
            onChange={(e) => setEventType(e.target.value)}
          >
            {eventTypes.length === 0 ? (
              <option value="">No event types found</option>
            ) : (
              eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))
            )}
          </select>
        </div>

        {/* DESCRIPTION */}
        <textarea
          className="border p-2 w-full rounded"
          placeholder="Description (optional)"
          value={description}
          disabled={postJournalMutation.isPending}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* JOURNAL LINES */}
        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 items-center">
              <AccountPicker
                entityId={entityId}
                value={line.account_id}
                onChange={(val) => {
                  setLines((prev) => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], account_id: val };
                    return updated;
                  });
                }}
                disabled={postJournalMutation.isPending}
              />

              <input
                type="number"
                className="border p-2 rounded col-span-2"
                value={line.amount}
                disabled={postJournalMutation.isPending}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setLines((prev) => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], amount: next };
                    return updated;
                  });
                }}
              />

              <select
                className="border p-2 rounded"
                value={line.effect_sign}
                disabled={postJournalMutation.isPending}
                onChange={(e) => {
                  const sign = Number(e.target.value) as 1 | -1;
                  setLines((prev) => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], effect_sign: sign };
                    return updated;
                  });
                }}
              >
                <option value={1}>Debit</option>
                <option value={-1}>Credit</option>
              </select>

              {lines.length > 2 && (
                <button
                  type="button"
                  className="text-red-600 text-sm"
                  disabled={postJournalMutation.isPending}
                  onClick={() => removeLine(i)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addLine}
            disabled={postJournalMutation.isPending}
            className="text-sm underline mt-2 text-blue-600 disabled:opacity-50"
          >
            + Add Line
          </button>
        </div>

        <div className="bg-gray-50 p-3 rounded text-sm">
          <div>Debits: {debitTotal.toLocaleString()}</div>
          <div>Credits: {creditTotal.toLocaleString()}</div>
          <div className={isBalanced ? "text-green-600" : "text-red-600"}>
            {isBalanced ? "Balanced ✔" : "Not Balanced ✘"}
          </div>
        </div>

        {postJournalMutation.error && (
          <div className="text-red-600">
            {String((postJournalMutation.error as any)?.message ?? postJournalMutation.error)}
          </div>
        )}

        <div className="flex justify-between">
          <button type="button" onClick={onClose} disabled={postJournalMutation.isPending}>
            Cancel
          </button>

          <button
            type="button"
            disabled={postJournalMutation.isPending}
            onClick={() => postJournalMutation.mutate()}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {postJournalMutation.isPending ? "Posting…" : "Post Journal Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}