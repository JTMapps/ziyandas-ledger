import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";
import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";

export default function RetailSaleWizard() {
  const { entityId } = useParams();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  if (!entityId) return <div>No entity.</div>;

  async function submit() {
    await TemplateJournalEngine.industry.retail.sale(
      entityId!,
      Number(amount),
      description
    );

    navigate(`/entities/${entityId}/overview`);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <IndustryOperationHeader
        title="Record Retail Sale"
        subtitle="Captures revenue and reduces inventory automatically."
      />

      <div className="space-y-4">
        {/* Amount */}
        <div>
          <label className="text-sm font-medium">Sale Amount</label>
          <input
            type="number"
            className="border p-2 rounded w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium">Description (optional)</label>
          <input
            className="border p-2 rounded w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          className="bg-blue-600 text-white p-3 rounded w-full font-semibold"
          onClick={submit}
          disabled={!amount}
        >
          Record Sale
        </button>
      </div>
    </div>
  );
}
