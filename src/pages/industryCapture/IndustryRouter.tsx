import { Routes, Route } from "react-router-dom";

import RetailSaleWizard from "./RetailSaleWizard";
import RetailPurchaseWizard from "./RetailPurchaseWizard";

import ManufacturingConsumeWizard from "./ManufacturingConsumeRawMaterialsWizard";
import ManufacturingCompleteWizard from "./ManufacturingCompleteBatchWizard";

import ServicesClientInvoiceWizard from "./ServicesClientInvoiceWizard";
import ServicesPayContractorWizard from "./ServicesPayContractorWizard";

import HospitalityRoomSaleWizard from "./HospitalityRoomSaleWizard";
import HospitalityMealServiceWizard from "./HospitalityMealServiceWizard";

import RealEstateRentIncomeWizard from "./RealEstateRentIncomeWizard";
import RealEstateMaintenanceWizard from "./RealEstateMaintenanceWizard";


/**
 * IndustryRouter handles all possible industry-based capture flows.
 * EntityDashboard routes mount this router under `/entities/:entityId/industry/*`
 */
export default function IndustryRouter() {
  return (
    <Routes>

      {/* ---------------- RETAIL ---------------- */}
      <Route path="retail/sale" element={<RetailSaleWizard />} />
      <Route path="retail/purchase" element={<RetailPurchaseWizard />} />

      {/* ---------------- MANUFACTURING ---------------- */}
      <Route path="manufacturing/consume" element={<ManufacturingConsumeWizard />} />
      <Route path="manufacturing/complete" element={<ManufacturingCompleteWizard />} />

      {/* ---------------- SERVICES ---------------- */}
      <Route path="services/invoice" element={<ServicesClientInvoiceWizard />} />
      <Route path="services/pay-contractor" element={<ServicesPayContractorWizard />} />

      {/* ---------------- HOSPITALITY ---------------- */}
      <Route path="hospitality/room-sale" element={<HospitalityRoomSaleWizard />} />
      <Route path="hospitality/meal-service" element={<HospitalityMealServiceWizard />} />

      {/* ---------------- REAL ESTATE ---------------- */}
      <Route path="real-estate/rent" element={<RealEstateRentIncomeWizard />} />
      <Route path="real-estate/maintenance" element={<RealEstateMaintenanceWizard />} />

    </Routes>
  );
}
