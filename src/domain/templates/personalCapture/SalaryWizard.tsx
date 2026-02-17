// src/domain/templates/personalCapture/SalaryWizard.tsx

import { useState } from "react";
import { TemplateJournalEngine } from "../TemplateOrchestrator";

interface Props {
  entityId: string;
  onClose: () => void;
}

export default function SalaryWizard({ entityId, onClose }: Props) {
  const [amount, setAmount] = useState<number>(0);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      setError(null);
      setLoading(true);

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0.");
      }

      await TemplateJournalEngine.personal.salary(entityId, amount, source);

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Record Salary Income</h2>

      <input
        type="number"
        className="border p-2 w-full rounded"
        placeholder="Amount received"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <input
        type="text"
        className="border p-2 w-full rounded"
        placeholder="Income source (optional)"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />

      {error && <div className="text-red-600">{error}</div>}

      <button
        onClick={submit}
        disabled={loading}
        className="bg-black text-white w-full py-2 rounded"
      >
        {loading ? "Posting…" : "Post Salary"}
      </button>
    </div>
  );
}
