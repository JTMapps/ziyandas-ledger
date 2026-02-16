import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { EventOrchestrator } from "../../orchestrators/EventOrchestrator";

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
  const [eventDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { account_id: "", amount: 0, effect_sign: 1 },
    { account_id: "", amount: 0, effect_sign: -1 }
  ]);

  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // -------------------------------------------------------
  // Load accounts for account picker
  // -------------------------------------------------------
  const accountsQuery = useQuery({
    queryKey: ["accounts", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, account_code, account_name, account_type")
        .eq("entity_id", entityId)
        .order("account_code");

      if (error) throw error;
      return data;
    }
  });

  // -------------------------------------------------------
  // Add new line item
  // -------------------------------------------------------
  function addLine() {
    setLines([
      ...lines,
      { account_id: "", amount: 0, effect_sign: 1 }
    ]);
  }

  // -------------------------------------------------------
  // Remove line item
  // -------------------------------------------------------
  function removeLine(i: number) {
    const updated = [...lines];
    updated.splice(i, 1);
    setLines(updated);
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

  const isBalanced = debitTotal === creditTotal;

  async function postJournal() {
    try {
      setError(null);

      if (!isBalanced) throw new Error("Journal must balance.");
      if (lines.some((l) => !l.account_id || l.amount <= 0))
        throw new Error("Each line needs an account and amount.");

      setPosting(true);

      await EventOrchestrator.recordEconomicEvent({
        entityId,
        eventType: "GENERAL_JOURNAL",
        eventDate,
        description,
        effects: lines
      });

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

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
              <select
                className="border p-2 rounded col-span-3"
                value={line.account_id}
                onChange={(e) => {
                  const updated = [...lines];
                  updated[i].account_id = e.target.value;
                  setLines(updated);
                }}
              >
                <option value="">Select account…</option>
                {accountsQuery.data?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_code} — {acc.account_name}
                  </option>
                ))}
              </select>

              {/* Amount */}
              <input
                type="number"
                className="border p-2 rounded col-span-2"
                value={line.amount}
                onChange={(e) => {
                  const updated = [...lines];
                  updated[i].amount = Number(e.target.value);
                  setLines(updated);
                }}
              />

              {/* Debit / Credit */}
              <select
                className="border p-2 rounded"
                value={line.effect_sign}
                onChange={(e) => {
                  const updated = [...lines];
                  updated[i].effect_sign = Number(e.target.value) as 1 | -1;
                  setLines(updated);
                }}
              >
                <option value={1}>Debit</option>
                <option value={-1}>Credit</option>
              </select>

              {/* Remove row */}
              {lines.length > 2 && (
                <button
                  className="text-red-600 text-sm"
                  onClick={() => removeLine(i)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addLine}
            className="text-sm underline mt-2 text-blue-600"
          >
            + Add Line
          </button>
        </div>

        {/* BALANCING VALIDATION */}
        <div className="bg-gray-50 p-3 rounded text-sm">
          <div>Debits: {debitTotal}</div>
          <div>Credits: {creditTotal}</div>
          <div
            className={isBalanced ? "text-green-600" : "text-red-600"}
          >
            {isBalanced ? "Balanced ✔" : "Not Balanced ✘"}
          </div>
        </div>

        {error && <div className="text-red-600">{error}</div>}

        {/* SUBMIT */}
        <div className="flex justify-between">
          <button onClick={onClose}>Cancel</button>

          <button
            disabled={posting}
            onClick={postJournal}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {posting ? "Posting…" : "Post Journal Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
