// src/components/statements/StatementRenderer.tsx
import React, { useState } from "react";
import StatementSection from "./StatementSection";

import type { RenderedStatement } from "../../hooks/useStatements";
import type { RenderedStatementLine } from "../../domain/statements/types";
import { DB_STATEMENT_LABEL } from "../../domain/statements/labels";

type Props = { data: RenderedStatement };

function formatAmount(amount: number | null) {
  if (amount === null) return "—";
  return Number(amount).toLocaleString();
}

function indentStyle(level: number) {
  const px = Math.min(level * 16, 128);
  return { paddingLeft: `${px}px` };
}

export default function StatementRenderer({ data }: Props) {
  const title = DB_STATEMENT_LABEL[data.statement_type] ?? data.statement_type;

  const rows: RenderedStatementLine[] = data.lines;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggle(code: string) {
    setCollapsed((prev) => ({ ...prev, [code]: !prev[code] }));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{title}</h2>

      {rows.length === 0 ? (
        <div className="text-sm text-gray-600">No lines returned for this statement.</div>
      ) : (
        <StatementSection title="Statement">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((line, idx) => {
                const isGroup = line.level === 0;

                let visible = true;
                if (line.level > 0) {
                  for (let j = idx - 1; j >= 0; j--) {
                    if (rows[j].level === 0) {
                      if (collapsed[rows[j].code]) visible = false;
                      break;
                    }
                  }
                }
                if (!visible) return null;

                const key = `${line.code}:${line.order}:${line.account_id ?? "noacct"}`;

                return (
                  <tr key={key} className={isGroup ? "font-semibold" : ""}>
                    <td className="py-1">
                      <div className="flex items-center" style={indentStyle(line.level)}>
                        {isGroup && (
                          <button
                            type="button"
                            className="mr-2 text-xs text-blue-600"
                            onClick={() => toggle(line.code)}
                            aria-label={collapsed[line.code] ? "Expand group" : "Collapse group"}
                          >
                            {collapsed[line.code] ? "▶" : "▼"}
                          </button>
                        )}
                        <span>
                          {line.code} — {line.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-1 text-right font-medium">{formatAmount(line.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </StatementSection>
      )}
    </div>
  );
}