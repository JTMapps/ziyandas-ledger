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

// DB enum -> display label
function formatIndustry(industryType?: string | null): string | null {
  if (!industryType) return null;
  if (industryType === "Generic") return null;

  const map: Record<string, string> = {
    Retail: "Retail",
    Manufacturing: "Manufacturing",
    Services: "Services",
    RealEstate: "Real Estate",
    Hospitality: "Hospitality",
  };

  return map[industryType] ?? industryType;
}

export default function DashboardLayout({ children, tabs, entity }: DashboardLayoutProps) {
  const { entityId } = useParams<{ entityId: string }>();

  // Fallback if someone navigates here without the route param
  const effectiveEntityId = entityId ?? entity.id;

  const name = entity?.name
    ? entity.name
    : effectiveEntityId
      ? `Entity #${effectiveEntityId}`
      : "";

  const type = entity?.type ? entity.type : null;

  const industryLabel =
    type === "Business" ? formatIndustry(entity?.industry_type ?? null) : null;

  const sidebarTitle =
    name +
    (type
      ? ` (${type}${industryLabel ? ` • ${industryLabel}` : ""})`
      : "");

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r flex flex-col">
        {/* ✅ Big header FIRST */}
        <div className="p-4 border-b">
          <div className="text-xl font-bold text-gray-900 leading-snug">
            {sidebarTitle}
          </div>
        </div>

        {/* ✅ Entity switcher SECOND */}
        <div className="p-4 border-b">
          <EntitySwitcher />
        </div>

        {/* ✅ Tabs THIRD */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-200"
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
      <div className="flex-1 flex flex-col">
        {/* HEADER (main area) */}
        <header className="h-14 bg-white border-b flex items-center justify-end px-6">
          <NavLink to="/profile" className="text-sm text-gray-600 hover:text-black">
            Profile
          </NavLink>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
