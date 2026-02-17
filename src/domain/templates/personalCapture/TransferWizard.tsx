// src/domain/templates/personalCapture/TransferWizard.tsx

import { useState, useEffect } from "react";
import { loadAppliedAccounts } from "../TemplateOrchestrator";
import { TemplateJournalEngine } from "../TemplateOrchestrator";

interface Props {
  entityId: string;
  onClose: () => void;
}

export default function TransferWizard({ entityId, onClose }: Props) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [amount, setAmount] = useState(0);
  const [fromAcc, setFromAcc] = useState("");
  const [toAcc, setToAcc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppliedAccounts(entityId).then((data) => {
      const assetAccounts = data.filter(
        (a) => a.account_type === "ASSET"
      );
      setAccounts(assetAccounts);
    });
  }, [entityId]);

  async function submit() {
    try {
      setError(null);
      setLoading(true);

      if (!fromAcc || !toAcc)
        throw new Error("Select both accounts.");
      if (fromAcc === toAcc)
        throw new Error("Cannot transfer to same account.");
      if (amount <= 0)
        throw new Error("Amount must be positive.");

      await TemplateJournalEngine.personal.transfer(
        entityId,
        amount,
        fromAcc,
        toAcc
      );

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Transfer Between Accounts</h2>

      <input
        type="number"
        className="border p-2 w-full rounded"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <select
        className="border p-2 w-full rounded"
        value={fromAcc}
        onChange={(e) => setFromAcc(e.target.value)}
      >
        <option value="">From account…</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.account_code}>
            {a.account_name}
          </option>
        ))}
      </select>

      <select
        className="border p-2 w-full rounded"
        value={toAcc}
        onChange={(e) => setToAcc(e.target.value)}
      >
        <option value="">To account…</option>
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
        {loading ? "Posting…" : "Post Transfer"}
      </button>
    </div>
  );
}
