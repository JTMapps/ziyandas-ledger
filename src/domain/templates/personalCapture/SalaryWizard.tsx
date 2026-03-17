import { useState } from "react";
import { TemplateJournalEngine } from "../TemplateOrchestrator";
import { useEnsureCoA } from "../../../hooks/useEnsureCoA";

interface Props {
  entityId: string;
  onClose: () => void;
}

export default function SalaryWizard({ entityId, onClose }: Props) {
  const { ensureCoA, ensuring, ensureError } = useEnsureCoA(entityId);

  const [amount, setAmount] = useState<number>(0);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      setError(null);
      setLoading(true);

      await ensureCoA();

      if (amount <= 0) throw new Error("Amount must be greater than 0.");
      await TemplateJournalEngine.personal.salary(entityId, amount, source);

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
      <h2 className="text-lg font-bold">Record Salary Income</h2>

      <input
        type="number"
        className="border p-2 w-full rounded"
        placeholder="Amount received"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        disabled={busy}
      />

      <input
        type="text"
        className="border p-2 w-full rounded"
        placeholder="Income source (optional)"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        disabled={busy}
      />

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
        {busy ? "Posting…" : "Post Salary"}
      </button>
    </div>
  );
}