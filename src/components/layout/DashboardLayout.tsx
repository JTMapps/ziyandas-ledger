import { NavLink, useParams } from "react-router-dom";
import { ReactNode } from "react";
import EntitySwitcher from "../EntitySwitcher";

export type DashboardTab = {
  label: string;
  to: string; // absolute path, e.g. /entities/:id/overview
  show?: boolean;
};

export type DashboardEntity = {
  id: string;
  name: string;
  type: "Business" | "Personal";
  industry_type?: string | null; // Generic, Retail, Manufacturing, Services, RealEstate, Hospitality
};

interface DashboardLayoutProps {
  children: ReactNode;
  tabs: DashboardTab[];
  entity: DashboardEntity;
}

// DB enum -> display label (✅ includes Generic)
function formatIndustry(industryType?: string | null): string | null {
  if (!industryType) return null;

  const map: Record<string, string> = {
    Generic: "Generic",
    Retail: "Retail",
    Manufacturing: "Manufacturing",
    Services: "Services",
    RealEstate: "Real Estate",
    Hospitality: "Hospitality",
  };

  return map[industryType] ?? industryType;
}

function buildSidebarTitle(entity: DashboardEntity, effectiveEntityId: string) {
  const name =
    entity?.name?.trim() ||
    (effectiveEntityId ? `Entity #${effectiveEntityId}` : "Entity");

  const type = entity?.type ?? null;

  // ✅ Always show industry for Business, including Generic
  const industryLabel =
    type === "Business"
      ? formatIndustry(entity?.industry_type ?? "Generic")
      : null;

  if (!type) return name;

  // e.g. "Oromachi (Business • Generic)" or "Oromachi (Personal)"
  return `${name} (${type}${industryLabel ? ` • ${industryLabel}` : ""})`;
}

export default function DashboardLayout({
  children,
  tabs,
  entity,
}: DashboardLayoutProps) {
  const { entityId } = useParams<{ entityId: string }>();

  // Fallback if someone navigates here without the route param
  const effectiveEntityId = entityId ?? entity.id;

  const sidebarTitle = buildSidebarTitle(entity, effectiveEntityId);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* ✅ APP HEADER (persistent) */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-6">
        <div className="text-base font-semibold text-gray-900">
          Ziyanda&apos;s Ledger
        </div>

        {/* Optional: room for global actions later */}
        <div className="text-xs text-gray-500">
          {/* Financial ledger workspace */}
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 min-h-0">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r flex flex-col min-h-0">
          {/* Entity title */}
          <div className="p-4 border-b">
            <div className="text-lg font-semibold text-gray-900 leading-snug">
              {sidebarTitle}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Switch entity or navigate
            </div>
          </div>

          {/* Entity switcher */}
          <div className="p-4 border-b">
            <EntitySwitcher />
          </div>

          {/* Tabs */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {tabs.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded text-sm transition ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
                end
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Page header (kept minimal) */}
          <div className="h-14 bg-white border-b flex items-center justify-end px-6">
            <NavLink
              to="/profile"
              className="text-sm text-gray-600 hover:text-black"
            >
              Profile
            </NavLink>
          </div>

          {/* CONTENT */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
