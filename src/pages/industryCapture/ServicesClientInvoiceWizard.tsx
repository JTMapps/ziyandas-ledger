import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";
import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";
import { useEnsureCoA } from "../../hooks/useEnsureCoA";

export default function ServicesClientInvoiceWizard() {
  const { entityId } = useParams();
  const navigate = useNavigate();

  const { ensureCoA, ensuring, ensureError } = useEnsureCoA(entityId);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!entityId) return <div className="p-4">No entity.</div>;

  const parsed = Number(amount);
  const canSubmit = parsed > 0 && !posting && !ensuring;

async function submit() {
  try {
    setError(null);
    setPosting(true);

    await ensureCoA();

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error("Invoice amount must be greater than 0.");
    }

    if (!entityId) {
      throw new Error("Entity ID is missing.");
    }

    await TemplateJournalEngine.industry.services.clientInvoice(
      entityId,
      parsed,
      description.trim()
    );

    navigate(`/entities/${entityId}/overview`);
  } catch (e: any) {
    setError(e.message ?? String(e));
  } finally {
    setPosting(false);
  }
}

  return (
    <div className="p-6 max-w-lg mx-auto">
      <IndustryOperationHeader
        title="Issue Client Invoice"
        subtitle="Records revenue and accounts receivable for services rendered."
      />

      <div className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium">Invoice Amount</label>
          <input
            type="number"
            className="border p-2 rounded w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={posting || ensuring}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Description (optional)</label>
          <input
            className="border p-2 rounded w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Client invoice #123"
            disabled={posting || ensuring}
          />
        </div>

        {(error || ensureError) && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {error ?? String((ensureError as any)?.message ?? ensureError)}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="bg-blue-600 text-white p-3 rounded w-full font-semibold disabled:opacity-60"
        >
          {posting || ensuring ? "Recording…" : "Record Invoice"}
        </button>
      </div>
    </div>
  );
}