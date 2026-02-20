import { useState } from "react";
import { useParams } from "react-router-dom";
import { useYearEnd } from "../../hooks/useYearEnd";

export default function YearEndPage() {
  const params = useParams<{ entityId: string }>();
  const entityId = params.entityId;

  if (!entityId) {
    return <div className="p-4">Missing entityId in route.</div>;
  }

  // ✅ Narrow to a guaranteed string for TypeScript
  const id: string = entityId;

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [log, setLog] = useState<string[]>([]);
  const { runFullYearEndClose } = useYearEnd();

  async function handleRun() {
  setLog((l) => [...l, `Running year-end for ${year}…`]);

  try {
    const result = await runFullYearEndClose.mutateAsync({ entityId: id, year });
    setLog((l) => [...l, `✔ Year-end complete: ${JSON.stringify(result)}`]);
  } catch (e: any) {
    setLog((l) => [...l, `✖ Year-end failed: ${String(e?.message ?? e)}`]);
  }
}

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Year-End Close</h2>

      <div className="flex space-x-4 items-center">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 w-32"
        />
          <button
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
            onClick={handleRun}
            disabled={runFullYearEndClose.isPending}
          >
            {runFullYearEndClose.isPending ? "Running…" : "Run Year-End Close"}
          </button>
      </div>

      <div className="bg-gray-100 rounded p-4 text-sm whitespace-pre-line">
        {log.join("\n")}
      </div>
    </div>
  );
}
