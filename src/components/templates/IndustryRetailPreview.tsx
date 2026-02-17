import IndustryTemplatePreview from "./IndustryTemplatePreview";
import { RETAIL_COA } from "../../domain/templates/industry/retailChartOfAccounts";

export default function IndustryRetailPreview() {
  return (
    <IndustryTemplatePreview
      title="Retail Industry Template"
      coa={RETAIL_COA}
    />
  );
}
