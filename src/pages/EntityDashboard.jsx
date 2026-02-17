import { Routes, Route, Navigate, useParams } from "react-router-dom";
import IndustryRouter from "./industryCapture/IndustryRouter";
import DashboardLayout from "../components/layout/DashboardLayout";

import OverviewPage from "./dashboard/OverviewPage";
import LedgerPage from "./dashboard/LedgerPage";
import StatementsPage from "./dashboard/StatementsPage";
import YearEndPage from "./dashboard/YearEndPage";
import TaxECLPage from "./dashboard/TaxECLPage";

export default function EntityDashboard() {
  const { entityId } = useParams();

  if (!entityId) {
    return <div className="p-6 text-red-600">Error: Entity not found.</div>;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="overview" element={<OverviewPage entityId={entityId} />} />
        <Route path="ledger" element={<LedgerPage entityId={entityId} />} />
        <Route path="statements" element={<StatementsPage entityId={entityId} />} />
        <Route path="year-end" element={<YearEndPage entityId={entityId} />} />
        <Route path="tax-ecl" element={<TaxECLPage entityId={entityId} />} />

        {/* Default route → redirect to overview */}
        <Route path="*" element={<Navigate to="overview" replace />} />

        {/* NEW: Industry operations router */}
        <Route path="industry/*" element={<IndustryRouter />} />
      </Routes>
    </DashboardLayout>
  );
}
