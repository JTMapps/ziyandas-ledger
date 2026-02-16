import { ReactNode } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import EntitySwitcher from "../../components/EntitySwitcher";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { entityId } = useParams();

  const tabs = [
    { path: "overview", label: "Overview" },
    { path: "ledger", label: "Ledger / Events" },
    { path: "statements", label: "Statements" },
    { path: "year-end", label: "Year-End Close" },
    { path: "tax-ecl", label: "Tax / ECL" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* -------------------------------------------------- */}
      {/* HEADER BAR                                         */}
      {/* -------------------------------------------------- */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <h1 className="text-xl font-bold">Ziyanda’s Ledger</h1>

        {/* Entity Switcher */}
        <EntitySwitcher />

        {/* Profile Link */}
        <Link to="/profile" className="text-sm underline">
          Profile
        </Link>
      </header>

      {/* -------------------------------------------------- */}
      {/* TAB NAVIGATION                                     */}
      {/* -------------------------------------------------- */}
      <nav className="bg-gray-100 border-b px-4 flex space-x-4">
        {tabs.map((t) => (
          <NavLink
            key={t.path}
            to={`/entities/${entityId}/${t.path}`}
            className={({ isActive }) =>
              `py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-black text-black"
                  : "border-transparent text-gray-600 hover:text-black"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      {/* -------------------------------------------------- */}
      {/* MAIN CONTENT                                       */}
      {/* -------------------------------------------------- */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
