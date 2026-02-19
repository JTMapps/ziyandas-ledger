// src/pages/tabs/BusinessTabs.ts
import type { DashboardTab } from "./types";

export function getBusinessTabs(
  entityId: string,
  industryType?: string | null
): DashboardTab[] {
  const base: DashboardTab[] = [
    { label: "Overview", to: `/entities/${entityId}/overview` },
    { label: "Ledger", to: `/entities/${entityId}/ledger` },
    { label: "Statements", to: `/entities/${entityId}/statements` },
    { label: "Tax & ECL", to: `/entities/${entityId}/tax-ecl` },
    { label: "Year End", to: `/entities/${entityId}/year-end` },
  ];

  const showIndustryOps = !!industryType && industryType !== "Generic";

  base.push({
    label: "Industry Ops",
    to: `/entities/${entityId}/capture/industry`,
    show: showIndustryOps,
  });

  return base.filter((t) => t.show !== false);
}
