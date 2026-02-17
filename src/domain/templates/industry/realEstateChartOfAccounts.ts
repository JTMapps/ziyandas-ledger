import { TemplateAccount } from "../business/businessChartOfAccounts";

export const REAL_ESTATE_COA: TemplateAccount[] = [
  // ASSETS
  {
    account_code: "1000",
    account_name: "Assets",
    account_type: "ASSET",
    normal_balance: "DEBIT",
    display_order: 1000,
  },
  {
    account_code: "1100",
    account_name: "Cash",
    parent_code: "1000",
    account_type: "ASSET",
    is_cash_account: true,
    cash_flow_category: "OPERATING",
    normal_balance: "DEBIT",
    display_order: 1100,
  },
  {
    account_code: "1200",
    account_name: "Investment Property",
    parent_code: "1000",
    account_type: "ASSET",
    statement_section: "NON_CURRENT_ASSETS",
    normal_balance: "DEBIT",
    display_order: 1200,
  },

  // INCOME
  {
    account_code: "4000",
    account_name: "Rental Income",
    account_type: "INCOME",
    normal_balance: "CREDIT",
    display_order: 4000,
  },

  // EXPENSES
  {
    account_code: "5000",
    account_name: "Property Maintenance",
    account_type: "EXPENSE",
    normal_balance: "DEBIT",
    display_order: 5000,
  },
  {
    account_code: "5100",
    account_name: "Municipal Costs",
    account_type: "EXPENSE",
    normal_balance: "DEBIT",
    display_order: 5100,
  },
];
