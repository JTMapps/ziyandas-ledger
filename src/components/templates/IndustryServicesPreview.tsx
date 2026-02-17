import IndustryTemplatePreview from "./IndustryTemplatePreview";
import { SERVICES_COA } from "../../domain/templates/industry/servicesChartOfAccounts";

export default function IndustryServicesPreview() {
  return (
    <IndustryTemplatePreview
      title="Services Industry Template"
      coa={SERVICES_COA}
    />
  );
}
