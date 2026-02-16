import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
  entityName?: string;
}

export default function DashboardLayout({ children, entityName }: Props) {
  const { pathname } = useLocation();

  const tabs = [
    { path: "overview", label: "Overview" },
    { path: "ledger", label: "Ledger / Events" },
    { path: "statements", label: "Statements" },
    { path: "year-end", label: "Year-End Close" },
    { path: "tax-ecl", label: "Tax / ECL" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {entityName ? `${entityName} Dashboard` : "Dashboard"}
        </h1>

        <Link to="/profile" className="text-sm underline">
          Profile
        </Link>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-gray-100 border-b px-4 flex space-x-4">
        {tabs.map((t) => {
          const active = pathname.includes(t.path);
          return (
            <Link
              key={t.path}
              to={t.path}
              className={`py-3 px-4 text-sm font-medium border-b-2 ${
                active
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-black"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
