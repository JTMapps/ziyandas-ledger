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
  industry_type?: string | null;
};

interface DashboardLayoutProps {
  children: ReactNode;
  tabs: DashboardTab[];
  entity: DashboardEntity;
}

export default function DashboardLayout({ children, tabs, entity }: DashboardLayoutProps) {
  const { entityId } = useParams<{ entityId: string }>();

  // Fallback if someone navigates here without the route param
  const effectiveEntityId = entityId ?? entity.id;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <EntitySwitcher />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm ${
                  isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
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
        {/* HEADER */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">
            {entity?.name ? entity.name : effectiveEntityId ? `Entity #${effectiveEntityId}` : ""}
          </h1>

          <nav>
            <NavLink to="/profile" className="text-sm text-gray-600 hover:text-black">
              Profile
            </NavLink>
          </nav>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
