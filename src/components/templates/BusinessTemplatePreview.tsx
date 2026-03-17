import { BUSINESS_CHART_OF_ACCOUNTS } from "../../domain/templates/business/businessChartOfAccounts";

export default function BusinessTemplatePreview() {
  // Group by major statement categories
  const grouped = BUSINESS_CHART_OF_ACCOUNTS.reduce((acc, item) => {
    const key = item.statement_type || "OTHER";

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);

    return acc;
  }, {} as Record<string, typeof BUSINESS_CHART_OF_ACCOUNTS>);

  const SECTION_TITLES: Record<string, string> = {
    STATEMENT_OF_FINANCIAL_POSITION: "Statement of Financial Position",
    PROFIT_OR_LOSS: "Profit or Loss",
    OTHER_COMPREHENSIVE_INCOME: "Other Comprehensive Income",
    CASH_FLOW: "Cash Flow Classification",
    EQUITY: "Equity",
    OTHER: "Other Accounts",
  };

  function indent(level: number) {
    return `pl-${level * 4}`;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Business Template (IFRS)</h2>

      {Object.entries(grouped).map(([section, accounts]) => (
        <section key={section} className="bg-white border rounded p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">
            {SECTION_TITLES[section] ?? section}
          </h3>

          <div className="space-y-1 text-sm">
            {accounts
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
              .map((acc) => (
                <div
                  key={acc.account_code}
                  className={`flex justify-between ${indent(acc.level ?? 0)}`}
                >
                  <span>
                    <span className="text-gray-500">{acc.account_code}</span> —{" "}
                    {acc.account_name}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {acc.statement_section}
                  </span>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
