// src/components/statements/StatementRenderer.tsx

import React, { useState } from "react";
import StatementSection from "./StatementSection";

interface StatementLine {
  account_id: string;
  code: string;
  name: string;
  amount: number;
  level: number;
  order: number;
  is_subtotal?: boolean;
  section?: string;
  subsection?: string;
}

interface Props {
  data: {
    statement_type: string;
    lines: StatementLine[];
  };
}

export default function StatementRenderer({ data }: Props) {
  const { statement_type, lines } = data;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggle(code: string) {
    setCollapsed((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  }

  function indent(level: number) {
    return `pl-${Math.min(level * 4, 32)}`;
  }

  // ------------------------------
  // GROUP BY SECTION
  // ------------------------------
  const grouped = lines.reduce((acc, line) => {
    const key = line.section || "OTHER";
    if (!acc[key]) acc[key] = [];
    acc[key].push(line);
    return acc;
  }, {} as Record<string, StatementLine[]>);

  const SECTION_NAMES: Record<string, string> = {
    ASSETS: "Assets",
    LIABILITIES: "Liabilities",
    EQUITY: "Equity",
    INCOME: "Income",
    EXPENSES: "Expenses",
    OCI: "Other Comprehensive Income",
    OTHER: "Other",
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <h2 className="text-xl font-bold">
        {statement_type === "SOFP" && "Statement of Financial Position"}
        {statement_type === "P&L" && "Profit or Loss"}
        {statement_type === "OCI" && "Other Comprehensive Income"}
        {statement_type === "EQUITY" && "Statement of Changes in Equity"}
      </h2>

      {/* Render Sections */}
      {Object.entries(grouped).map(([section, rows]) => (
        <StatementSection
          key={section}
          title={SECTION_NAMES[section] ?? section}
        >
          <table className="w-full text-sm">
            <tbody>
              {rows.map((line, idx) => {
                const isGroup = line.level === 0 && !line.is_subtotal;
                const isSubtotal = !!line.is_subtotal;

                // Determine visibility based on parent collapse
                let visible = true;
                if (line.level > 0) {
                  for (let j = idx - 1; j >= 0; j--) {
                    if (rows[j].level === 0) {
                      const parent = rows[j];
                      if (collapsed[parent.code]) visible = false;
                      break;
                    }
                  }
                }

                if (!visible) return null;

                return (
                  <tr
                    key={line.account_id + line.code}
                    className={isSubtotal ? "font-bold bg-gray-50" : ""}
                  >
                    <td className={`py-1 ${indent(line.level)}`}>
                      {isGroup && (
                        <button
                          className="mr-2 text-xs text-blue-600"
                          onClick={() => toggle(line.code)}
                        >
                          {collapsed[line.code] ? "▶" : "▼"}
                        </button>
                      )}
                      {line.code} — {line.name}
                    </td>

                    <td className="py-1 text-right font-medium">
                      {Number(line.amount).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </StatementSection>
      ))}
    </div>
  );
}
