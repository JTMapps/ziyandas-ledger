import { useState } from "react";
import { useYearEnd } from "../../hooks/useYearEnd";

interface Props {
  entityId: string;
}

export default function YearEndPage({ entityId }: Props) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [log, setLog] = useState<string[]>([]);

  const { runFullYearEndClose } = useYearEnd();

  async function handleRun() {
    setLog((l) => [...l, `Running year-end for ${year}…`]);

    const result = await runFullYearEndClose(entityId, year);

    setLog((l) => [...l, `✔ Year-end complete: ${JSON.stringify(result)}`]);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Year-End Close</h2>

      <div className="flex space-x-4">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 w-32"
        />
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={handleRun}
        >
          Run Year-End Close
        </button>
      </div>

      <div className="bg-gray-100 rounded p-4 text-sm whitespace-pre-line">
        {log.join("\n")}
      </div>
    </div>
  );
}
