// src/pages/entity/EntityTemplateSetup.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
import { qk } from "../../hooks/queryKeys";

type EntityRow = {
  id: string;
  name: string;
  type: "Business" | "Personal";
  industry_type?: string | null;
};

type TemplateStatusRow = { template_group_id: string } | null;

const INDUSTRY_TYPE_BY_KIND: Record<TemplateKind, string | null> = {
  BUSINESS: "Generic",
  PERSONAL: null,
  RETAIL: "Retail",
  MANUFACTURING: "Manufacturing",
  SERVICES: "Services",
  REAL_ESTATE: "RealEstate",
  HOSPITALITY: "Hospitality",
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
      type="button"
      onClick={onClick}
      className={`px-6 py-3 rounded border text-sm font-medium ${
        active ? "bg-black text-white" : "bg-white hover:bg-gray-100"
      }`}
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

export default function EntityTemplateSetup() {
  const { entityId } = useParams<{ entityId: string }>();
  const id = entityId ?? "";

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<TemplateKind | null>(null);

  const entityQuery = useQuery<EntityRow>({
    queryKey: qk.entity(id),
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

  const templateStatusQuery = useQuery<TemplateStatusRow>({
    queryKey: ["entity-template", id],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_template_selection")
        .select("template_group_id")
        .eq("entity_id", id)
        .single();

      if (error && (error as any).code !== "PGRST116") throw error;
      return (data ?? null) as TemplateStatusRow;
    },
  });

  const accountsCountQuery = useQuery<number>({
    queryKey: ["accounts-count", id],
    enabled: !!entityId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("accounts")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", id)
        .eq("is_active", true)
        .is("deleted_at", null);

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  const hasAccounts = (accountsCountQuery.data ?? 0) > 0;
  const hasTemplateSelection = Boolean(templateStatusQuery.data?.template_group_id);

  useEffect(() => {
    if (!entityId) return;
    if (templateStatusQuery.isLoading || accountsCountQuery.isLoading) return;

    if (hasTemplateSelection && hasAccounts) {
      navigate(`/entities/${id}/overview`, { replace: true });
    }
  }, [
    entityId,
    id,
    navigate,
    templateStatusQuery.isLoading,
    accountsCountQuery.isLoading,
    hasTemplateSelection,
    hasAccounts,
  ]);

  useEffect(() => {
    if (!entityQuery.data) return;
    setSelected((prev) => prev ?? deriveTemplateKindFromEntity(entityQuery.data));
  }, [entityQuery.data]);

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!entityId) throw new Error("Missing entityId in route.");
      if (!selected) throw new Error("Select a template first");

      const industry_type = INDUSTRY_TYPE_BY_KIND[selected] ?? null;

      // Keep your industry update
      if (selected !== "PERSONAL") {
        const { error: updateErr } = await supabase
          .from("entities")
          .update({ industry_type })
          .eq("id", id);

        if (updateErr) throw updateErr;
      }

      // ✅ If selection exists, don't try to change it
      const existing = templateStatusQuery.data?.template_group_id ?? null;
      if (existing) {
        // Just materialize accounts for existing group id
        const { reapplySelectedTemplate } = await import("../../domain/templates/TemplateOrchestrator");
        return reapplySelectedTemplate(id);
      }

      // Otherwise normal first-time setup
      return setupEntityTemplate(id, selected);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.entity(id) }),
        queryClient.invalidateQueries({ queryKey: qk.entities() }),
        queryClient.invalidateQueries({ queryKey: ["entity-template", id] }),

        // ✅ critical: accounts + accounts-count
        queryClient.invalidateQueries({ queryKey: ["accounts", id] }),
        queryClient.invalidateQueries({ queryKey: ["accounts-count", id] }),

        // optional: ledger/events caches
        queryClient.invalidateQueries({ queryKey: qk.economicEvents(id) }),
        queryClient.invalidateQueries({ queryKey: qk.entitySnapshot(id) }),
      ]);

      navigate(`/entities/${id}/overview`, { replace: true });
    },
  });

  const preview = useMemo(() => renderPreview(selected), [selected]);

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  if (entityQuery.isLoading || templateStatusQuery.isLoading || accountsCountQuery.isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading entity…</div>;
  }

  if (entityQuery.error) {
    return (
      <div className="p-4 text-red-600">
        Failed to load entity: {String((entityQuery.error as any)?.message ?? entityQuery.error)}
      </div>
    );
  }

  const entity = entityQuery.data;
  if (!entity) return <div className="p-4">Entity not found.</div>;

  const isBusiness = entity.type === "Business";

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white shadow-lg border rounded p-8 space-y-8">
        <h1 className="text-2xl font-bold">
          Select Template for <span className="text-blue-600">{entity.name}</span>
        </h1>

        {hasTemplateSelection && !hasAccounts && (
          <div className="border rounded p-4 bg-yellow-50 text-sm">
            <div className="font-semibold">Template is selected, but accounts are missing.</div>
            <div className="text-gray-700 mt-1">
              This means the chart of accounts was not materialized into <code>accounts</code>.
              Re-apply the template to generate accounts.
            </div>
          </div>
        )}

        <p className="text-gray-600">
          Choose a financial accounting template. Industry templates automatically configure IFRS-compliant
          accounts tailored to your business model.
        </p>

        <div className="flex flex-wrap gap-4">
          {isBusiness ? (
            <>
              <TemplateButton label="Business (Standard IFRS)" active={selected === "BUSINESS"} onClick={() => setSelected("BUSINESS")} />
              <TemplateButton label="Retail Industry" active={selected === "RETAIL"} onClick={() => setSelected("RETAIL")} />
              <TemplateButton label="Manufacturing" active={selected === "MANUFACTURING"} onClick={() => setSelected("MANUFACTURING")} />
              <TemplateButton label="Professional Services" active={selected === "SERVICES"} onClick={() => setSelected("SERVICES")} />
              <TemplateButton label="Real Estate" active={selected === "REAL_ESTATE"} onClick={() => setSelected("REAL_ESTATE")} />
              <TemplateButton label="Hospitality" active={selected === "HOSPITALITY"} onClick={() => setSelected("HOSPITALITY")} />
            </>
          ) : (
            <TemplateButton label="Personal Finance Template" active={selected === "PERSONAL"} onClick={() => setSelected("PERSONAL")} />
          )}
        </div>

        {selected && <div className="border rounded p-6 bg-gray-50">{preview}</div>}

        <button
          type="button"
          disabled={!selected || applyMutation.isPending}
          onClick={() => applyMutation.mutate()}
          className={`w-full py-3 rounded text-white font-bold ${
            selected && !applyMutation.isPending
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {applyMutation.isPending
            ? "Applying Template…"
            : hasTemplateSelection && !hasAccounts
              ? "Re-Apply Template"
              : "Apply Template"}
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