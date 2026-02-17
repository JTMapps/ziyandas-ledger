import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

import { supabase } from "../../lib/supabase";

import BusinessTemplatePreview from "../../components/templates/BusinessTemplatePreview";
import PersonalTemplatePreview from "../../components/templates/PersonalTemplatePreview";

import {
  setupEntityTemplate,
  getEntityTemplateKind,
} from "../../domain/templates/TemplateOrchestrator";

export default function EntityTemplateSetup() {
  const { entityId } = useParams();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<"BUSINESS" | "PERSONAL" | null>(null);

  if (!entityId) return <div>No entity found.</div>;

  // ----------------------------------------------------------
  // 1) Load entity data (type, name, status)
  // ----------------------------------------------------------
  const entityQuery = useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name, type")
        .eq("id", entityId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const templateStatusQuery = useQuery({
    queryKey: ["entity-template", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_template_selection")
        .select("template_group_id")
        .eq("entity_id", entityId)
        .single();

      if (error && error.code !== "PGRST116") {
        // ignore "no rows" error
        throw error;
      }

      return data;
    },
  });

  // ----------------------------------------------------------
  // 2) If already assigned → redirect automatically
  // ----------------------------------------------------------
  useEffect(() => {
    if (templateStatusQuery.data?.template_group_id) {
      navigate(`/entities/${entityId}/overview`, { replace: true });
    }
  }, [templateStatusQuery.data, entityId, navigate]);

  // ----------------------------------------------------------
  // 3) Apply Template → Assign + Build Accounts
  // ----------------------------------------------------------
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Select a template first");

      return setupEntityTemplate(entityId);
    },
    onSuccess: () => {
      navigate(`/entities/${entityId}/overview`, { replace: true });
    },
  });

  // ----------------------------------------------------------
  // Loading states
  // ----------------------------------------------------------
  if (entityQuery.isLoading || templateStatusQuery.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading entity…
      </div>
    );
  }

  const entity = entityQuery.data;

  if (!entity) return <div>Entity not found</div>;

  // ----------------------------------------------------------
  // UI START
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white shadow-lg border rounded p-8 space-y-8">
        <h1 className="text-2xl font-bold">
          Select Template for <span className="text-blue-600">{entity.name}</span>
        </h1>

        <p className="text-gray-600">
          Choose how this entity captures financial information.  
          Templates create a complete Chart of Accounts and define how data entry works.
        </p>

        {/* Template Selection Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => setSelected("BUSINESS")}
            className={`px-6 py-3 rounded border text-sm font-medium ${
              selected === "BUSINESS"
                ? "bg-black text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Business Template
          </button>

          <button
            onClick={() => setSelected("PERSONAL")}
            className={`px-6 py-3 rounded border text-sm font-medium ${
              selected === "PERSONAL"
                ? "bg-black text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Personal Finance Template
          </button>
        </div>

        {/* Template Preview */}
        {selected === "BUSINESS" && (
          <div className="border rounded p-6 bg-gray-50">
            <BusinessTemplatePreview />
          </div>
        )}

        {selected === "PERSONAL" && (
          <div className="border rounded p-6 bg-gray-50">
            <PersonalTemplatePreview />
          </div>
        )}

        {/* Apply Button */}
        <button
          disabled={!selected || applyMutation.isPending}
          onClick={() => applyMutation.mutate()}
          className={`w-full py-3 rounded text-white font-bold ${
            selected && !applyMutation.isPending
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {applyMutation.isPending ? "Applying Template…" : "Apply Template"}
        </button>

        {applyMutation.error && (
          <div className="text-red-600 text-sm">
            {(applyMutation.error as any).message}
          </div>
        )}
      </div>
    </div>
  );
}
