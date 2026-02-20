// src/pages/dashboard/TaxECLPage.tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useYearEnd } from "../../hooks/useYearEnd";

export default function TaxECLPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const [year, setYear] = useState<number>(new Date().getFullYear());

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  const { postDeferredTax, postECLMovement } = useYearEnd();

  const dtiQuery = useQuery({
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

  const eclQuery = useQuery({
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

  const isBusy =
    dtiQuery.isLoading ||
    eclQuery.isLoading ||
    postDeferredTax.isPending ||
    postECLMovement.isPending;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Tax & Expected Credit Losses</h2>

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
          onClick={() => postDeferredTax.mutate({ entityId, year })}
        >
          {postDeferredTax.isPending ? "Posting…" : "Post Deferred Tax"}
        </button>

        <button
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          disabled={isBusy}
          onClick={() => postECLMovement.mutate({ entityId, year })}
        >
          {postECLMovement.isPending ? "Posting…" : "Post ECL Movement"}
        </button>
      </div>

      {(dtiQuery.error || eclQuery.error || postDeferredTax.error || postECLMovement.error) && (
        <div className="text-sm text-red-600 whitespace-pre-wrap">
          {dtiQuery.error ? `DTI: ${String((dtiQuery.error as any)?.message ?? dtiQuery.error)}\n` : ""}
          {eclQuery.error ? `ECL: ${String((eclQuery.error as any)?.message ?? eclQuery.error)}\n` : ""}
          {postDeferredTax.error
            ? `Deferred tax post: ${String((postDeferredTax.error as any)?.message ?? postDeferredTax.error)}\n`
            : ""}
          {postECLMovement.error
            ? `ECL post: ${String((postECLMovement.error as any)?.message ?? postECLMovement.error)}\n`
            : ""}
        </div>
      )}

      <section>
        <h3 className="font-semibold mb-2">Deferred Tax Items</h3>
        <pre className="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {JSON.stringify(dtiQuery.data ?? [], null, 2)}
        </pre>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Expected Credit Loss Items</h3>
        <pre className="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {JSON.stringify(eclQuery.data ?? [], null, 2)}
        </pre>
      </section>
    </div>
  );
}
