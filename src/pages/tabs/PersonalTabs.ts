// src/pages/tabs/PersonalTabs.ts
import type { DashboardTab } from "./types";

export function getPersonalTabs(entityId: string): DashboardTab[] {
  return [
    { label: "Overview", to: `/entities/${entityId}/overview` },
    { label: "Ledger", to: `/entities/${entityId}/ledger` },
    { label: "Statements", to: `/entities/${entityId}/statements` },

    // Personal-only
    { label: "Personal Capture", to: `/entities/${entityId}/capture/personal` },
  ];
}
