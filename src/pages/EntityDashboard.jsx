import { Routes, Route, Navigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

import OverviewPage from "./dashboard/OverviewPage";
import LedgerPage from "./dashboard/LedgerPage";
import StatementsPage from "./dashboard/StatementsPage";
import TaxECLPage from "./dashboard/TaxECLPage";
import YearEndPage from "./dashboard/YearEndPage";

import IndustryRouter from "./industryCapture/IndustryRouter";

export default function EntityDashboard() {
  const { entityId } = useParams();

  return (
    <DashboardLayout entityId={entityId}>
      <Routes>
        {/* Default tab */}
        <Route index element={<Navigate to="overview" replace />} />

        <Route path="overview" element={<OverviewPage />} />
        <Route path="ledger" element={<LedgerPage />} />
        <Route path="statements" element={<StatementsPage />} />
        <Route path="tax-ecl" element={<TaxECLPage />} />
        <Route path="year-end" element={<YearEndPage />} />

        {/* Industry-specific workflows */}
        <Route path="industry/*" element={<IndustryRouter />} />

        {/* Unknown → overview */}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
