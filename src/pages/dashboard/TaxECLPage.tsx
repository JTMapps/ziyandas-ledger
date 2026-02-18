// src/pages/dashboard/TaxECLPage.tsx

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useYearEnd } from "../../hooks/useYearEnd";

export default function TaxECLPage() {
  const { entityId } = useParams<{ entityId: string }>();

  if (!entityId) {
    return <div className="p-4">Missing entityId in route.</div>;
  }

  const { postDeferredTax, postECLMovement } = useYearEnd();
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const { data: dti, isLoading: dtiLoading, error: dtiError } = useQuery({
    queryKey: ["deferred-tax", entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deferred_tax_items")
        .select("*")
        .eq("entity_id", entityId);

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: ecl, isLoading: eclLoading, error: eclError } = useQuery({
    queryKey: ["ecl", entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expected_credit_losses")
        .select("*")
        .eq("entity_id", entityId);

      if (error) throw error;
      return data ?? [];
    },
  });

  const isBusy = dtiLoading || eclLoading;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Tax & Expected Credit Losses</h2>

      {/* Posting Controls */}
      <div className="flex space-x-4 items-center">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 w-32"
        />

        <button
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          disabled={isBusy}
          onClick={() => postDeferredTax(entityId, year)}
        >
          Post Deferred Tax
        </button>

        <button
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          disabled={isBusy}
          onClick={() => postECLMovement(entityId, year)}
        >
          Post ECL Movement
        </button>
      </div>

      {/* Errors */}
      {(dtiError || eclError) && (
        <div className="text-sm text-red-600">
          {String((dtiError as any)?.message ?? "")}
          {dtiError && eclError ? " | " : ""}
          {String((eclError as any)?.message ?? "")}
        </div>
      )}

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
