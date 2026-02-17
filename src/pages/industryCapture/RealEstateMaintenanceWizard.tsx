import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";
import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";

export default function RealEstateMaintenanceWizard() {
  const { entityId } = useParams();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  if (!entityId) return <div>No entity.</div>;

  async function submit() {
    await TemplateJournalEngine.industry.realEstate.maintenanceExpense(
      entityId!,
      Number(amount),
      description
    );

    navigate(`/entities/${entityId}/overview`);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <IndustryOperationHeader
        title="Record Maintenance Expense"
        subtitle="Repairs, upkeep, or property maintenance costs."
      />

      <div className="space-y-4 mt-4">

        <div>
          <label className="text-sm font-medium">Maintenance Cost</label>
          <input
            type="number"
            className="border p-2 rounded w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Description (optional)</label>
          <input
            className="border p-2 rounded w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Plumbing repair for Unit 2A"
          />
        </div>

        <button
          onClick={submit}
          disabled={!amount}
          className="bg-blue-600 text-white p-3 rounded w-full font-semibold"
        >
          Record Maintenance Expense
        </button>
      </div>
    </div>
  );
}
