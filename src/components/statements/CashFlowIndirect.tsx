// src/components/statements/CashFlowIndirect.tsx
import { useStatement } from "../../hooks/useStatements";
import type { DbStatementType } from "../../domain/statements/statementTypes";

interface Props {
  entityId: string;
  periodId: string;
}

const CF_DB_TYPE: DbStatementType = "CASH_FLOW";

export default function CashFlowIndirect({ entityId, periodId }: Props) {
  const statementQuery = useStatement(entityId, periodId, CF_DB_TYPE);

  if (statementQuery.isLoading) return <div>Loading cash flow…</div>;
  if (statementQuery.error)
    return (
      <div className="text-red-600 text-sm">
        Failed to load cash flow:{" "}
        {String((statementQuery.error as any)?.message ?? statementQuery.error)}
      </div>
    );

  const data = statementQuery.data;
  if (!data || data.lines.length === 0) return <div>No cash flow data available.</div>;

  // With current DB output, we can only render a flat statement.
  // (To group Operating/Investing/Financing, add 'section' to the SQL output.)
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Cash Flow (Indirect Method)</h2>

      <div className="border rounded bg-white shadow-sm p-3">
        {data.lines.map((row) => (
          <div key={`${row.code}:${row.order}`} className="flex justify-between py-1">
            <span>
              {row.code} — {row.name}
            </span>
            <span>{row.amount === null ? "—" : Number(row.amount).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}