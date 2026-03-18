// src/pages/EntityDashboard.tsx

import { Routes, Route, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/layout/DashboardLayout";

import OverviewPage from "./dashboard/OverviewPage";
import LedgerPage from "./dashboard/LedgerPage";
import StatementsPage from "./dashboard/StatementsPage";
import TaxECLPage from "./dashboard/TaxECLPage";
import YearEndPage from "./dashboard/YearEndPage";

import PersonalDashboard from "./personal/PersonalDashboard";
import IndustryRouter from "./industryCapture/IndustryRouter";
import GeneralCaptureWizard from "./industryCapture/GeneralCaptureWizard";
import { getBusinessTabs } from "./tabs/BusinessTabs";
import { getPersonalTabs } from "./tabs/PersonalTabs";
import type { DashboardTab } from "./tabs/types";

type EntityRow = {
  id: string;
  name: string;
  type: "Business" | "Personal";
  industry_type?: string | null;
};

// Absolute-path fallback (good as-is)
function DashboardFallback() {
  const { entityId } = useParams<{ entityId: string }>();
  return <Navigate to={`/entities/${entityId}/overview`} replace />;
}

/**
 * Compat redirect:
 * Old URLs: /entities/:id/capture/general/LOAN_RECEIVED
 * New URLs: /entities/:id/capture/general?type=LOAN_RECEIVED
 */
function GeneralCaptureCompatRedirect() {
  const { entityId, wizardType } = useParams<{ entityId: string; wizardType: string }>();
  if (!entityId) return <Navigate to="/" replace />;
  const type = encodeURIComponent(wizardType ?? "");
  return <Navigate to={`/entities/${entityId}/capture/general?type=${type}`} replace />;
}

export default function EntityDashboard() {
  const { entityId } = useParams<{ entityId: string }>();
  const id = entityId ?? "";

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

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;
  if (entityQuery.isLoading) return <div className="p-4">Loading dashboard…</div>;
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
  const industryType = entity.industry_type ?? null;
  const isIndustryBusiness = isBusiness && !!industryType && industryType !== "Generic";

  const tabs: DashboardTab[] = isBusiness
    ? getBusinessTabs(entityId, industryType)
    : getPersonalTabs(entityId);

  return (
    <DashboardLayout entity={entity} tabs={tabs}>
      <Routes>
        {/* Common */}
        <Route path="overview" element={<OverviewPage />} />
        <Route path="ledger" element={<LedgerPage />} />
        <Route path="statements" element={<StatementsPage />} />

        {/* Business-only */}
        {isBusiness && (
          <>
            <Route path="tax-ecl" element={<TaxECLPage />} />
            <Route path="year-end" element={<YearEndPage />} />
          </>
        )}

        {/* ✅ Generic business capture (query param route) */}
        {isBusiness && <Route path="capture/general" element={<GeneralCaptureWizard />} />}

        {/* ✅ Optional: keep old deep links working */}
        {isBusiness && (
          <Route path="capture/general/:wizardType" element={<GeneralCaptureCompatRedirect />} />
        )}

        {/* ✅ Industry capture ONLY for industry business */}
        {isIndustryBusiness && (
          <Route path="capture/industry/*" element={<IndustryRouter industryType={industryType} />} />
        )}

        {/* Personal capture */}
        {!isBusiness && <Route path="capture/personal/*" element={<PersonalDashboard />} />}

        {/* Catch-all */}
        <Route path="*" element={<DashboardFallback />} />
      </Routes>
    </DashboardLayout>
  );
}