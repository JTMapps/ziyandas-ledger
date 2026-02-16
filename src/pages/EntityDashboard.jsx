import { useParams, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// Tab Screens (generated next)
import OverviewPage from "./dashboard/OverviewPage";
import LedgerPage from "./dashboard/LedgerPage";
import StatementsPage from "./dashboard/StatementsPage";
import YearEndPage from "./dashboard/YearEndPage";
import TaxECLPage from "./dashboard/TaxECLPage";

export default function EntityDashboard() {
  const { entityId } = useParams();

  const { data: entity } = useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name")
        .eq("id", entityId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!entityId
  });

  if (!entityId) {
    return <div className="p-6">Invalid entity</div>;
  }

  return (
    <DashboardLayout entityName={entity?.name}>
      <Routes>
        {/* Default tab */}
        <Route index element={<Navigate to="overview" replace />} />

        {/* Enterprise tabs */}
        <Route path="overview" element={<OverviewPage entityId={entityId} />} />
        <Route path="ledger" element={<LedgerPage entityId={entityId} />} />
        <Route path="statements" element={<StatementsPage entityId={entityId} />} />
        <Route path="year-end" element={<YearEndPage entityId={entityId} />} />
        <Route path="tax-ecl" element={<TaxECLPage entityId={entityId} />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
