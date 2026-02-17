import IndustryTemplatePreview from "./IndustryTemplatePreview";
import { REAL_ESTATE_COA } from "../../domain/templates/industry/realEstateChartOfAccounts";

export default function IndustryRealEstatePreview() {
  return (
    <IndustryTemplatePreview
      title="Real Estate Industry Template"
      coa={REAL_ESTATE_COA}
    />
  );
}
