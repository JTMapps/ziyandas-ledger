import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

import { supabase } from "../../lib/supabase";

import BusinessTemplatePreview from "../../components/templates/BusinessTemplatePreview";
import PersonalTemplatePreview from "../../components/templates/PersonalTemplatePreview";

import IndustryRetailPreview from "../../components/templates/IndustryRetailPreview";
import IndustryManufacturingPreview from "../../components/templates/IndustryManufacturingPreview";
import IndustryServicesPreview from "../../components/templates/IndustryServicesPreview";
import IndustryRealEstatePreview from "../../components/templates/IndustryRealEstatePreview";
import IndustryHospitalityPreview from "../../components/templates/IndustryHospitalityPreview";

import {
  setupEntityTemplate,
  getEntityTemplateKind,
  TemplateKind,
} from "../../domain/templates/TemplateOrchestrator";

export default function EntityTemplateSetup() {
  const { entityId } = useParams();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<TemplateKind | null>(null);

  if (!entityId) return <div>No entity found.</div>;

  // ----------------------------------------------------------
  // Load entity metadata
  // ----------------------------------------------------------
  const entityQuery = useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name, type, industry_type")
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
        throw error;
      }
      return data;
    },
  });

  // ----------------------------------------------------------
  // Auto-redirect if entity already has a template
  // ----------------------------------------------------------
  useEffect(() => {
    if (templateStatusQuery.data?.template_group_id) {
      navigate(`/entities/${entityId}/overview`, { replace: true });
    }
  }, [templateStatusQuery.data, entityId, navigate]);

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Select a template first");
      return setupEntityTemplate(entityId);
    },
    onSuccess: () => {
      navigate(`/entities/${entityId}/overview`, { replace: true });
    },
  });

  if (entityQuery.isLoading || templateStatusQuery.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading entity…
      </div>
    );
  }

  const entity = entityQuery.data;
  if (!entity) return <div>Entity not found</div>;

  const isBusiness = entity.type === "Business";

  // ----------------------------------------------------------
  // BUTTON GROUP
  // ----------------------------------------------------------
  const businessButtons = (
    <>
      <button
        onClick={() => setSelected("BUSINESS")}
        className={`px-6 py-3 rounded border text-sm font-medium ${
          selected === "BUSINESS"
            ? "bg-black text-white"
            : "bg-white hover:bg-gray-100"
        }`}
      >
        Business (Standard IFRS)
      </button>

      <button
        onClick={() => setSelected("RETAIL")}
        className={`px-6 py-3 rounded border text-sm font-medium ${
          selected === "RETAIL"
            ? "bg-black text-white"
            : "bg-white hover:bg-gray-100"
        }`}
      >
        Retail Industry
      </button>

      <button
        onClick={() => setSelected("MANUFACTURING")}
        className={`px-6 py-3 rounded border text-sm font-medium ${
          selected === "MANUFACTURING"
            ? "bg-black text-white"
            : "bg-white hover:bg-gray-100"
        }`}
      >
        Manufacturing
      </button>

      <button
        onClick={() => setSelected("SERVICES")}
        className={`px-6 py-3 rounded border text-sm font-medium ${
          selected === "SERVICES"
            ? "bg-black text-white"
            : "bg-white hover:bg-gray-100"
        }`}
      >
        Professional Services
      </button>

      <button
        onClick={() => setSelected("REAL_ESTATE")}
        className={`px-6 py-3 rounded border text-sm font-medium ${
          selected === "REAL_ESTATE"
            ? "bg-black text-white"
            : "bg-white hover:bg-gray-100"
        }`}
      >
        Real Estate
      </button>

      <button
        onClick={() => setSelected("HOSPITALITY")}
        className={`px-6 py-3 rounded border text-sm font-medium ${
          selected === "HOSPITALITY"
            ? "bg-black text-white"
            : "bg-white hover:bg-gray-100"
        }`}
      >
        Hospitality
      </button>
    </>
  );

  const personalButtons = (
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
  );

  // ----------------------------------------------------------
  // TEMPLATE PREVIEW SELECTOR
  // ----------------------------------------------------------
  function renderPreview() {
    switch (selected) {
      case "BUSINESS":
        return <BusinessTemplatePreview />;
      case "PERSONAL":
        return <PersonalTemplatePreview />;
      case "RETAIL":
        return <IndustryRetailPreview />;
      case "MANUFACTURING":
        return <IndustryManufacturingPreview />;
      case "SERVICES":
        return <IndustryServicesPreview />;
      case "REAL_ESTATE":
        return <IndustryRealEstatePreview />;
      case "HOSPITALITY":
        return <IndustryHospitalityPreview />;
      default:
        return null;
    }
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white shadow-lg border rounded p-8 space-y-8">
        <h1 className="text-2xl font-bold">
          Select Template for <span className="text-blue-600">{entity.name}</span>
        </h1>

        <p className="text-gray-600">
          Choose a financial accounting template. Industry templates automatically
          configure IFRS-compliant accounts tailored to your business model.
        </p>

        {/* Dynamic button rendering */}
        <div className="flex flex-wrap gap-4">
          {isBusiness ? businessButtons : personalButtons}
        </div>

        {/* PREVIEW */}
        {selected && (
          <div className="border rounded p-6 bg-gray-50">{renderPreview()}</div>
        )}

        {/* APPLY BUTTON */}
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
