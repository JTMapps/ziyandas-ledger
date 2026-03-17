import { useState, useEffect } from "react";
import { loadAppliedAccounts, TemplateJournalEngine } from "../TemplateOrchestrator";
import { useEnsureCoA } from "../../../hooks/useEnsureCoA";

interface Props {
  entityId: string;
  onClose: () => void;
}

export default function ExpenseWizard({ entityId, onClose }: Props) {
  const { ensureCoA, ensuring, ensureError } = useEnsureCoA(entityId);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setError(null);
        await ensureCoA();

        const data = await loadAppliedAccounts(entityId);
        const expenseAccounts = data.filter((a) => a.account_type === "EXPENSE");
        if (alive) setAccounts(expenseAccounts);
      } catch (e: any) {
        if (alive) setError(e.message ?? String(e));
      }
    })();

    return () => {
      alive = false;
    };
  }, [entityId]);

  async function submit() {
    try {
      setError(null);
      setLoading(true);

      await ensureCoA();

      if (!category) throw new Error("Choose an expense category.");
      if (amount <= 0) throw new Error("Amount must be positive.");

      await TemplateJournalEngine.personal.expense(entityId, amount, category);
      onClose();
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || ensuring;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Record Expense</h2>

      <input
        type="number"
        className="border p-2 w-full rounded"
        placeholder="Amount spent"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        disabled={busy}
      />

      <select
        className="border p-2 w-full rounded"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={busy}
      >
        <option value="">Select expense category…</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.account_code}>
            {a.account_name}
          </option>
        ))}
      </select>

      {(error || ensureError) && (
        <div className="text-red-600 text-sm">
          {error ?? String((ensureError as any)?.message ?? ensureError)}
        </div>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="bg-black text-white w-full py-2 rounded disabled:opacity-60"
      >
        {busy ? "Posting…" : "Post Expense"}
      </button>
    </div>
  );
}