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

type Props = {
  industryType: string | null; // "Retail" | "Manufacturing" | "Services" | "RealEstate" | "Hospitality" | "Generic" | null
};

export default function IndustryRouter({ industryType }: Props) {
  // If someone somehow gets here without a real industry
  if (!industryType || industryType === "Generic") {
    return <Navigate to="../overview" replace />;
  }

  switch (industryType) {
    case "Retail":
      return (
        <Routes>
          {/* Index: correct default landing */}
          <Route path="" element={<Navigate to="retail/sale" replace />} />

          {/* Retail */}
          <Route path="retail/sale" element={<RetailSaleWizard />} />
          <Route path="retail/purchase" element={<RetailPurchaseWizard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="retail/sale" replace />} />
        </Routes>
      );

    case "Manufacturing":
      return (
        <Routes>
          <Route path="" element={<Navigate to="manufacturing/consume" replace />} />

          {/* Manufacturing */}
          <Route path="manufacturing/consume" element={<ManufacturingConsumeRawMaterialsWizard />} />
          <Route path="manufacturing/complete" element={<ManufacturingCompleteBatchWizard />} />

          <Route path="*" element={<Navigate to="manufacturing/consume" replace />} />
        </Routes>
      );

    case "Services":
      return (
        <Routes>
          <Route path="" element={<Navigate to="services/invoice" replace />} />

          {/* Services */}
          <Route path="services/invoice" element={<ServicesClientInvoiceWizard />} />
          <Route path="services/contractor" element={<ServicesPayContractorWizard />} />

          <Route path="*" element={<Navigate to="services/invoice" replace />} />
        </Routes>
      );

    case "Hospitality":
      return (
        <Routes>
          <Route path="" element={<Navigate to="hospitality/room-sale" replace />} />

          {/* Hospitality */}
          <Route path="hospitality/room-sale" element={<HospitalityRoomSaleWizard />} />
          <Route path="hospitality/meal-service" element={<HospitalityMealServiceWizard />} />

          <Route path="*" element={<Navigate to="hospitality/room-sale" replace />} />
        </Routes>
      );

    case "RealEstate":
      return (
        <Routes>
          <Route path="" element={<Navigate to="real-estate/rent-income" replace />} />

          {/* Real Estate */}
          <Route path="real-estate/rent-income" element={<RealEstateRentIncomeWizard />} />
          <Route path="real-estate/maintenance" element={<RealEstateMaintenanceWizard />} />

          <Route path="*" element={<Navigate to="real-estate/rent-income" replace />} />
        </Routes>
      );

    default:
      // Unknown enum value (future-proof)
      return <Navigate to="../overview" replace />;
  }
}
