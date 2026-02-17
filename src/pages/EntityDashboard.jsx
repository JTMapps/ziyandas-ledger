import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

import OverviewPage from "./dashboard/OverviewPage";
import LedgerPage from "./dashboard/LedgerPage";
import StatementsPage from "./dashboard/StatementsPage";
import TaxECLPage from "./dashboard/TaxECLPage";
import YearEndPage from "./dashboard/YearEndPage";

import PersonalDashboard from "./personal/PersonalDashboard";
import IndustryRouter from "./industryCapture/IndustryRouter";

export default function EntityDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="overview" element={<OverviewPage />} />
        <Route path="ledger" element={<LedgerPage />} />
        <Route path="statements" element={<StatementsPage />} />
        <Route path="tax-ecl" element={<TaxECLPage />} />
        <Route path="year-end" element={<YearEndPage />} />

        {/* Capture flows */}
        <Route path="capture/personal/*" element={<PersonalDashboard />} />
        <Route path="capture/industry/*" element={<IndustryRouter />} />

        {/* Default */}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
