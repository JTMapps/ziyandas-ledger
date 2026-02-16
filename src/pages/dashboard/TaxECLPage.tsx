import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useYearEnd } from "../../hooks/useYearEnd";
import { useState } from "react";

interface Props {
  entityId: string;
}

export default function TaxECLPage({ entityId }: Props) {
  const { postDeferredTax, postECLMovement } = useYearEnd();
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: dti } = useQuery({
    queryKey: ["deferred-tax", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deferred_tax_items")
        .select("*")
        .eq("entity_id", entityId);

      if (error) throw error;
      return data;
    }
  });

  const { data: ecl } = useQuery({
    queryKey: ["ecl", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expected_credit_losses")
        .select("*")
        .eq("entity_id", entityId);

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Tax & Expected Credit Losses</h2>

      {/* Posting Controls */}
      <div className="flex space-x-4">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 w-32"
        />

        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() => postDeferredTax(entityId, year)}
        >
          Post Deferred Tax
        </button>

        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() => postECLMovement(entityId, year)}
        >
          Post ECL Movement
        </button>
      </div>

      {/* Tables */}
      <section>
        <h3 className="font-semibold mb-2">Deferred Tax Items</h3>
        <pre className="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {JSON.stringify(dti, null, 2)}
        </pre>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Expected Credit Loss Items</h3>
        <pre className="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {JSON.stringify(ecl, null, 2)}
        </pre>
      </section>
    </div>
  );
}
