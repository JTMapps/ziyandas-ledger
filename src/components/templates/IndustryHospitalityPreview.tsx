import IndustryTemplatePreview from "./IndustryTemplatePreview";
import { HOSPITALITY_COA } from "../../domain/templates/industry/hospitalityChartOfAccounts";

export default function IndustryHospitalityPreview() {
  return (
    <IndustryTemplatePreview
      title="Hospitality Industry Template"
      coa={HOSPITALITY_COA}
    />
  );
}
