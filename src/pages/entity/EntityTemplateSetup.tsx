// src/pages/entity/EntityTemplateSetup.tsx

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
  deriveTemplateKindFromEntity,
  TemplateKind,
} from "../../domain/templates/TemplateOrchestrator";

type EntityRow = {
  id: string;
  name: string;
  type: "Business" | "Personal";
  industry_type?: string | null;
};

function TemplateButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded border text-sm font-medium ${
        active ? "bg-black text-white" : "bg-white hover:bg-gray-100"
      }`}
      type="button"
    >
      {label}
    </button>
  );
}

function renderPreview(kind: TemplateKind | null) {
  switch (kind) {
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

/**
 * NOTE:
 * This mapping must match your DB enum values exactly.
 * If your DB stores "Real Estate" (with a space) instead of "RealEstate", change it here.
 */
const INDUSTRY_TYPE_BY_KIND: Record<TemplateKind, string | null> = {
  BUSINESS: "Generic",
  PERSONAL: null,

  RETAIL: "Retail",
  MANUFACTURING: "Manufacturing",
  SERVICES: "Services",
  REAL_ESTATE: "RealEstate",
  HOSPITALITY: "Hospitality",
};

export default function EntityTemplateSetup() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();

  // ✅ Always call hooks first (no early returns before hooks)
  const [selected, setSelected] = useState<TemplateKind | null>(null);

  // Safe id for queries (enabled prevents execution when missing)
  const id = entityId ?? "";

  // ----------------------------------------------------------
  // Load entity metadata
  // ----------------------------------------------------------
  const entityQuery = useQuery<EntityRow>({
    queryKey: ["entity", id],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name, type, industry_type")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as EntityRow;
    },
  });

  // ----------------------------------------------------------
  // Has template already been applied?
  // ----------------------------------------------------------
  const templateStatusQuery = useQuery<{ template_group_id: string } | null>({
    queryKey: ["entity-template", id],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_template_selection")
        .select("template_group_id")
        .eq("entity_id", id)
        .single();

      // PGRST116 = no rows found (acceptable)
      if (error && (error as any).code !== "PGRST116") throw error;

      return (data ?? null) as { template_group_id: string } | null;
    },
  });

  // ----------------------------------------------------------
  // If already templated, redirect to overview
  // ----------------------------------------------------------
  useEffect(() => {
    if (!entityId) return;
    if (templateStatusQuery.isLoading) return;

    if (templateStatusQuery.data?.template_group_id) {
      navigate(`/entities/${id}/overview`, { replace: true });
    }
  }, [
    entityId,
    templateStatusQuery.isLoading,
    templateStatusQuery.data,
    id,
    navigate,
  ]);

  // ----------------------------------------------------------
  // Auto-suggest a template based on entity row
  // ----------------------------------------------------------
  useEffect(() => {
    if (!entityQuery.data) return;
    if (selected) return; // user already chose manually

    setSelected(deriveTemplateKindFromEntity(entityQuery.data));
  }, [entityQuery.data, selected]);

  // ----------------------------------------------------------
  // Apply template
  // ----------------------------------------------------------
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!entityId) throw new Error("Missing entityId in route.");
      if (!selected) throw new Error("Select a template first");

      // If Business entity picks an industry template, persist industry_type
      // (This is optional for Personal; we keep it null.)
      const industry_type = INDUSTRY_TYPE_BY_KIND[selected] ?? null;

      // Only update industry_type for Business-type entities
      // (prevents accidental updates for Personal entities)
      if (selected !== "PERSONAL") {
        const { error: updateErr } = await supabase
          .from("entities")
          .update({ industry_type })
          .eq("id", id);

        if (updateErr) throw updateErr;
      }

      // Assign + apply template group in DB
      return setupEntityTemplate(id, selected);
    },
    onSuccess: () => {
      navigate(`/entities/${id}/overview`, { replace: true });
    },
  });

  // ----------------------------------------------------------
  // UI states (safe after hooks)
  // ----------------------------------------------------------
  if (!entityId) {
    return <div className="p-4">Missing entityId in route.</div>;
  }

  if (entityQuery.isLoading || templateStatusQuery.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading entity…
      </div>
    );
  }

  if (entityQuery.error) {
    return (
      <div className="p-4 text-red-600">
        Failed to load entity:{" "}
        {String((entityQuery.error as any)?.message ?? entityQuery.error)}
      </div>
    );
  }

  const entity = entityQuery.data;
  if (!entity) return <div className="p-4">Entity not found.</div>;

  const isBusiness = entity.type === "Business";
  const preview = renderPreview(selected);

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white shadow-lg border rounded p-8 space-y-8">
        <h1 className="text-2xl font-bold">
          Select Template for{" "}
          <span className="text-blue-600">{entity.name}</span>
        </h1>

        <p className="text-gray-600">
          Choose a financial accounting template. Industry templates automatically
          configure IFRS-compliant accounts tailored to your business model.
        </p>

        <div className="flex flex-wrap gap-4">
          {isBusiness ? (
            <>
              <TemplateButton
                label="Business (Standard IFRS)"
                active={selected === "BUSINESS"}
                onClick={() => setSelected("BUSINESS")}
              />
              <TemplateButton
                label="Retail Industry"
                active={selected === "RETAIL"}
                onClick={() => setSelected("RETAIL")}
              />
              <TemplateButton
                label="Manufacturing"
                active={selected === "MANUFACTURING"}
                onClick={() => setSelected("MANUFACTURING")}
              />
              <TemplateButton
                label="Professional Services"
                active={selected === "SERVICES"}
                onClick={() => setSelected("SERVICES")}
              />
              <TemplateButton
                label="Real Estate"
                active={selected === "REAL_ESTATE"}
                onClick={() => setSelected("REAL_ESTATE")}
              />
              <TemplateButton
                label="Hospitality"
                active={selected === "HOSPITALITY"}
                onClick={() => setSelected("HOSPITALITY")}
              />
            </>
          ) : (
            <TemplateButton
              label="Personal Finance Template"
              active={selected === "PERSONAL"}
              onClick={() => setSelected("PERSONAL")}
            />
          )}
        </div>

        {selected && (
          <div className="border rounded p-6 bg-gray-50">{preview}</div>
        )}

        <button
          disabled={!selected || applyMutation.isPending}
          onClick={() => applyMutation.mutate()}
          className={`w-full py-3 rounded text-white font-bold ${
            selected && !applyMutation.isPending
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          type="button"
        >
          {applyMutation.isPending ? "Applying Template…" : "Apply Template"}
        </button>

        {applyMutation.error && (
          <div className="text-red-600 text-sm">
            {String((applyMutation.error as any)?.message ?? applyMutation.error)}
          </div>
        )}
      </div>
    </div>
  );
}
