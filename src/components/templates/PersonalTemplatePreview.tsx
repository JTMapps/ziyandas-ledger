import { PERSONAL_CHART_OF_ACCOUNTS } from "../../domain/templates/personal/personalChartOfAccounts";

export default function PersonalTemplatePreview() {
  const grouped = PERSONAL_CHART_OF_ACCOUNTS.reduce((acc, item) => {
    const key = item.statement_type || "OTHER";

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);

    return acc;
  }, {} as Record<string, typeof PERSONAL_CHART_OF_ACCOUNTS>);

  const TITLES: Record<string, string> = {
    STATEMENT_OF_FINANCIAL_POSITION: "Net Worth Tracking",
    PROFIT_OR_LOSS: "Income & Spending",
    CASH_FLOW: "Cash Flow Categories",
    OTHER: "Other Accounts",
  };

  function indent(level: number) {
    return `pl-${level * 4}`;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Personal Finance Template</h2>

      <p className="text-gray-600 text-sm mb-4">
        This template is optimized for salary tracking, spending categories,
        savings, and simplified personal net-worth management.  
        All entries are automatically mapped to proper IFRS-style double-entry behind the scenes.
      </p>

      {Object.entries(grouped).map(([section, accounts]) => (
        <section key={section} className="bg-white border rounded p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">
            {TITLES[section] ?? section}
          </h3>

          <div className="space-y-1 text-sm">
            {accounts
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
              .map((acc) => (
                <div
                  key={acc.account_code}
                  className={`flex justify-between ${indent(acc.hierarchy_level ?? 0)}`}
                >
                  <span>
                    <span className="text-gray-500">{acc.account_code}</span> —{" "}
                    {acc.account_name}
                  </span>

                  <span className="text-gray-400 text-xs">
                    {acc.statement_section}
                    {acc.cash_flow_category ? ` • ${acc.cash_flow_category}` : ""}
                  </span>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
