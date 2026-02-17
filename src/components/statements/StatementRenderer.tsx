import React, { useState } from "react";

interface StatementLine {
  account_id: string;
  code: string;
  name: string;
  amount: number;
  level: number;
  order: number;
  is_subtotal?: boolean;
  section?: string; // optional grouping tag from backend (SOFP/P&L/OCI grouping)
}

interface Props {
  data: {
    statement_type: string;
    lines: StatementLine[];
  };
}

export default function StatementRenderer({ data }: Props) {
  const { statement_type, lines } = data;

  // Track collapsed groups
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggle(code: string) {
    setCollapsed((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  }

  const sectionName = {
    SOFP: "Statement of Financial Position",
    "P&L": "Profit or Loss",
    OCI: "Other Comprehensive Income",
  }[statement_type];

  // -------------------------
  // IFRS SECTION HEADERS
  // -------------------------
  const sectionHeaders: Record<string, string> = {
    ASSETS: "Assets",
    LIABILITIES: "Liabilities",
    EQUITY: "Equity",
    REVENUE: "Revenue",
    EXPENSES: "Expenses",
    OCI: "Other Comprehensive Income",
  };

  // Add whitespace indentation
  const indent = (level: number) => `pl-${Math.min(level * 4, 32)}`;

  return (
    <div className="bg-white border rounded p-6 shadow-sm space-y-4">
      <h3 className="text-xl font-bold">{sectionName}</h3>

      <table className="w-full text-sm">
        <tbody>
          {lines.map((line, idx) => {
            const isGroup = line.level === 0 && !line.is_subtotal;
            const isSubtotal = line.is_subtotal;

            // -------------------------
            // SECTION HEADER
            // -------------------------
            const maybeSectionHeader =
              line.section &&
              lines[idx - 1]?.section !== line.section &&
              !line.is_subtotal &&
              line.level === 0;

            // -------------------------
            // COLLAPSE VISIBILITY
            // -------------------------
            let visible = true;

            if (line.level > 0) {
              // find nearest level 0 parent
              for (let j = idx - 1; j >= 0; j--) {
                if (lines[j].level === 0) {
                  const parentCode = lines[j].code;
                  if (collapsed[parentCode]) visible = false;
                  break;
                }
              }
            }
            if (!visible) return null;

            return (
              <React.Fragment key={line.account_id}>
                {/* SECTION HEADER ROW */}
                {maybeSectionHeader && (
                <tr>
                    <td
                    colSpan={2}
                    className="pt-4 pb-2 text-gray-700 font-semibold text-md"
                    >
                    {line.section &&
                    sectionHeaders[line.section as keyof typeof sectionHeaders]
                        ? sectionHeaders[line.section as keyof typeof sectionHeaders]
                        : line.section}
                    </td>
                </tr>
                )}


                {/* NORMAL / GROUP / SUBTOTAL ROW */}
                <tr
                  className={
                    isSubtotal
                      ? "font-bold bg-gray-50 border-t border-gray-300"
                      : "border-gray-100"
                  }
                >
                  <td
                    className={`py-1 flex items-center ${indent(
                      line.level
                    )}`}
                  >
                    {/* Expand/collapse toggle */}
                    {isGroup && (
                      <button
                        onClick={() => toggle(line.code)}
                        className="mr-2 text-xs text-blue-600"
                      >
                        {collapsed[line.code] ? "▶" : "▼"}
                      </button>
                    )}

                    {/* Name */}
                    <span>
                      {line.code} — {line.name}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-1 text-right font-medium">
                    {Number(line.amount).toLocaleString()}
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
