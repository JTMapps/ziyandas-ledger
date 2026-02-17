import IndustryTemplatePreview from "./IndustryTemplatePreview";
import { MANUFACTURING_COA } from "../../domain/templates/industry/manufacturingChartOfAccounts";

export default function IndustryManufacturingPreview() {
  return (
    <IndustryTemplatePreview
      title="Manufacturing Industry Template"
      coa={MANUFACTURING_COA}
    />
  );
}
