import { Routes, Route, Navigate } from "react-router-dom";

import RetailSaleWizard from "./RetailSaleWizard";
import RetailPurchaseWizard from "./RetailPurchaseWizard";

import ManufacturingConsumeRawMaterialsWizard from "./ManufacturingConsumeRawMaterialsWizard";
import ManufacturingCompleteBatchWizard from "./ManufacturingCompleteBatchWizard";

import ServicesClientInvoiceWizard from "./ServicesClientInvoiceWizard";
import ServicesPayContractorWizard from "./ServicesPayContractorWizard";

import HospitalityRoomSaleWizard from "./HospitalityRoomSaleWizard";
import HospitalityMealServiceWizard from "./HospitalityMealServiceWizard";

import RealEstateRentIncomeWizard from "./RealEstateRentIncomeWizard";
import RealEstateMaintenanceWizard from "./RealEstateMaintenanceWizard";

export default function IndustryRouter() {
  return (
    <Routes>
      {/* Retail */}
      <Route path="retail/sale" element={<RetailSaleWizard />} />
      <Route path="retail/purchase" element={<RetailPurchaseWizard />} />

      {/* Manufacturing */}
      <Route path="manufacturing/consume" element={<ManufacturingConsumeRawMaterialsWizard />} />
      <Route path="manufacturing/complete" element={<ManufacturingCompleteBatchWizard />} />

      {/* Services */}
      <Route path="services/invoice" element={<ServicesClientInvoiceWizard />} />
      <Route path="services/contractor" element={<ServicesPayContractorWizard />} />

      {/* Hospitality */}
      <Route path="hospitality/room-sale" element={<HospitalityRoomSaleWizard />} />
      <Route path="hospitality/meal-service" element={<HospitalityMealServiceWizard />} />

      {/* Real Estate */}
      <Route path="real-estate/rent-income" element={<RealEstateRentIncomeWizard />} />
      <Route path="real-estate/maintenance" element={<RealEstateMaintenanceWizard />} />

      {/* Default */}
      <Route path="*" element={<Navigate to="retail/sale" replace />} />
    </Routes>
  );
}
