// src/domain/templates/personalCapture/ExpenseWizard.tsx

import { useState, useEffect } from "react";
import { loadAppliedAccounts } from "../TemplateOrchestrator";
import { TemplateJournalEngine } from "../TemplateOrchestrator";

interface Props {
  entityId: string;
  onClose: () => void;
}

export default function ExpenseWizard({ entityId, onClose }: Props) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppliedAccounts(entityId).then((data) => {
      const expenseAccounts = data.filter(
        (a) => a.account_type === "EXPENSE"
      );
      setAccounts(expenseAccounts);
    });
  }, [entityId]);

  async function submit() {
    try {
      setError(null);
      setLoading(true);

      if (!category) throw new Error("Choose an expense category.");
      if (amount <= 0) throw new Error("Amount must be positive.");

      await TemplateJournalEngine.personal.expense(entityId, amount, category);

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Record Expense</h2>

      <input
        type="number"
        className="border p-2 w-full rounded"
        placeholder="Amount spent"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <select
        className="border p-2 w-full rounded"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Select expense category…</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.account_code}>
            {a.account_name}
          </option>
        ))}
      </select>

      {error && <div className="text-red-600">{error}</div>}

      <button
        onClick={submit}
        disabled={loading}
        className="bg-black text-white w-full py-2 rounded"
      >
        {loading ? "Posting…" : "Post Expense"}
      </button>
    </div>
  );
}
