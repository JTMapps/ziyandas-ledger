import { NavLink, useParams } from "react-router-dom";
import { ReactNode } from "react";
import EntitySwitcher from "../EntitySwitcher";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { entityId } = useParams();

  const nav = [
    { label: "Overview", path: "overview" },
    { label: "Ledger", path: "ledger" },
    { label: "Statements", path: "statements" },
    { label: "Tax & ECL", path: "tax-ecl" },
    { label: "Year End", path: "year-end" },
    { label: "Personal Capture", path: "capture/personal" },
    { label: "Industry Ops", path: "capture/industry" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <EntitySwitcher />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={`/entities/${entityId}/${item.path}`}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`
              }
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
            {entityId ? `Entity #${entityId}` : ""}
          </h1>

          <nav>
            <NavLink
              to="/profile"
              className="text-sm text-gray-600 hover:text-black"
            >
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
