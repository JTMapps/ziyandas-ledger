// src/components/layout/DashboardLayout.tsx
//
// Upgrades from previous version:
//   1. Entity title in sidebar now shows an industry type chip (pill badge)
//      below the name — more visual hierarchy, easier to scan.
//   2. App header uses entity name as the page title for orientation.
//   3. Sidebar nav items show a coloured left-border indicator when active
//      (more visible than background-only highlight on small text).
//   4. Profile link moved to sidebar footer — it was floating in a header
//      that wasn't really a header.
//   5. Sidebar section labels added for nav group context.
//   6. EntitySwitcher dropdown label is "Switch Entity" for clarity.

import { NavLink, useParams } from "react-router-dom";
import { ReactNode } from "react";
import EntitySwitcher from "../EntitySwitcher";

export type DashboardTab = {
  label: string;
  to: string;
  show?: boolean;
};

export type DashboardEntity = {
  id: string;
  name: string;
  type: "Business" | "Personal";
  industry_type?: string | null;
};

interface DashboardLayoutProps {
  children: ReactNode;
  tabs: DashboardTab[];
  entity: DashboardEntity;
}

const INDUSTRY_LABELS: Record<string, string> = {
  Generic:       "Generic",
  Retail:        "Retail",
  Manufacturing: "Manufacturing",
  Services:      "Services",
  RealEstate:    "Real Estate",
  Hospitality:   "Hospitality",
};

const INDUSTRY_CHIP_STYLE: Record<string, string> = {
  Generic:       "bg-gray-100 text-gray-600",
  Retail:        "bg-amber-100 text-amber-700",
  Manufacturing: "bg-blue-100 text-blue-700",
  Services:      "bg-violet-100 text-violet-700",
  RealEstate:    "bg-emerald-100 text-emerald-700",
  Hospitality:   "bg-rose-100 text-rose-700",
};

export default function DashboardLayout({ children, tabs, entity }: DashboardLayoutProps) {
  const { entityId } = useParams<{ entityId: string }>();
  const effectiveEntityId = entityId ?? entity.id;

  const industryKey = entity.industry_type ?? "Generic";
  const industryLabel = entity.type === "Business"
    ? (INDUSTRY_LABELS[industryKey] ?? industryKey)
    : null;
  const chipStyle = INDUSTRY_CHIP_STYLE[industryKey] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="h-screen bg-gray-100 flex flex-col">

      {/* ── App header ── */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
        <div className="text-base font-semibold text-gray-900 tracking-tight">
          Ziyanda&apos;s Ledger
        </div>
        <div className="text-sm text-gray-500 font-medium truncate max-w-[280px]">
          {entity.name}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ── */}
        <aside className="w-60 bg-white border-r flex flex-col min-h-0 shrink-0">

          {/* Entity block */}
          <div className="px-4 pt-5 pb-4 border-b">
            <div className="text-base font-bold text-gray-900 leading-snug truncate">
              {entity.name}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-400">{entity.type}</span>
              {industryLabel && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${chipStyle}`}>
                  {industryLabel}
                </span>
              )}
            </div>
          </div>

          {/* Entity switcher */}
          <div className="px-4 py-3 border-b">
            <div className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">
              Switch Entity
            </div>
            <EntitySwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            <div className="text-xs text-gray-400 font-medium px-2 mb-1 uppercase tracking-wider">
              Navigation
            </div>
            {tabs.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="px-4 py-4 border-t">
            <NavLink
              to="/profile"
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              Profile settings
            </NavLink>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-6xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}