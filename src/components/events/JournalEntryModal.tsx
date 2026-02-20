import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";
import AccountPicker from "../pickers/AccountPicker";

interface Props {
  entityId: string;
  onClose: () => void;
}

interface LineItem {
  account_id: string;
  amount: number;
  effect_sign: 1 | -1;
  description?: string;
}

export default function JournalEntryModal({ entityId, onClose }: Props) {
  const qc = useQueryClient();

  const [eventDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { account_id: "", amount: 0, effect_sign: 1 },
    { account_id: "", amount: 0, effect_sign: -1 },
  ]);

  // -------------------------------------------------------
  // Add new line item
  // -------------------------------------------------------
  function addLine() {
    setLines((prev) => [...prev, { account_id: "", amount: 0, effect_sign: 1 }]);
  }

  // -------------------------------------------------------
  // Remove line item
  // -------------------------------------------------------
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  // -------------------------------------------------------
  // Validate journal
  // -------------------------------------------------------
  const debitTotal = lines
    .filter((l) => l.effect_sign === 1)
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  const creditTotal = lines
    .filter((l) => l.effect_sign === -1)
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  // Better than === for floating point / cents edge cases
  const isBalanced = Math.abs(debitTotal - creditTotal) < 0.0001;

  // -------------------------------------------------------
  // Mutation: Post journal using DB RPC + invalidate queries
  // -------------------------------------------------------
  const postJournalMutation = useMutation({
    mutationFn: async () => {
      if (!isBalanced) throw new Error("Journal must balance.");
      if (lines.some((l) => !l.account_id || l.amount <= 0)) {
        throw new Error("Each line needs an account and amount.");
      }
      if (lines.length < 2) {
        throw new Error("At least 2 lines (debit + credit) are required.");
      }

      const effects = lines.map((l) => ({
        account_id: l.account_id,
        amount: l.amount,
        effect_sign: l.effect_sign,
        // tax_treatment: null,
        // deductible: false,
      }));

      // NOTE: matches your DB signature:
      // record_economic_event(p_entity_id, p_event_type, p_event_date, p_description, p_effects)
      const { data, error } = await supabase.rpc("record_economic_event", {
        p_entity_id: entityId,
        p_event_type: null, // or set to a valid enum value from economic_event_type
        p_event_date: eventDate,
        p_description: description || null,
        p_effects: effects,
      });

      if (error) throw error;
      return data as string; // event_id
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

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-full max-w-2xl space-y-6 shadow-lg">
        <h2 className="text-xl font-bold">Record Journal Entry</h2>

        {/* DATE */}
        <input
          type="date"
          value={eventDate}
          disabled
          className="border p-2 rounded w-40 bg-gray-100"
        />

        {/* DESCRIPTION */}
        <textarea
          className="border p-2 w-full rounded"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* --- JOURNAL LINES --- */}
        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 items-center">
              {/* Account selector */}
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

              {/* Amount */}
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

              {/* Debit / Credit */}
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

              {/* Remove row */}
              {lines.length > 2 && (
                <button
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
            onClick={addLine}
            disabled={postJournalMutation.isPending}
            className="text-sm underline mt-2 text-blue-600 disabled:opacity-50"
          >
            + Add Line
          </button>
        </div>

        {/* BALANCING VALIDATION */}
        <div className="bg-gray-50 p-3 rounded text-sm">
          <div>Debits: {debitTotal}</div>
          <div>Credits: {creditTotal}</div>
          <div className={isBalanced ? "text-green-600" : "text-red-600"}>
            {isBalanced ? "Balanced ✔" : "Not Balanced ✘"}
          </div>
        </div>

        {/* ERROR FROM MUTATION */}
        {postJournalMutation.error && (
          <div className="text-red-600">
            {String((postJournalMutation.error as any)?.message ?? postJournalMutation.error)}
          </div>
        )}

        {/* SUBMIT */}
        <div className="flex justify-between">
          <button onClick={onClose} disabled={postJournalMutation.isPending}>
            Cancel
          </button>

          <button
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
