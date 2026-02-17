import { TemplateAccount } from "../business/businessChartOfAccounts";

export const SERVICES_COA: TemplateAccount[] = [
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
    normal_balance: "DEBIT",
    cash_flow_category: "OPERATING",
    display_order: 1100,
  },
  {
    account_code: "1200",
    account_name: "Accounts Receivable",
    parent_code: "1000",
    account_type: "ASSET",
    normal_balance: "DEBIT",
    cash_flow_category: "OPERATING",
    display_order: 1200,
  },

  // INCOME
  {
    account_code: "4000",
    account_name: "Service Revenue",
    account_type: "INCOME",
    normal_balance: "CREDIT",
    display_order: 4000,
  },
  {
    account_code: "4100",
    account_name: "Consulting Revenue",
    parent_code: "4000",
    account_type: "INCOME",
    normal_balance: "CREDIT",
    display_order: 4100,
  },

  // EXPENSES
  {
    account_code: "5000",
    account_name: "Contractor Fees",
    account_type: "EXPENSE",
    normal_balance: "DEBIT",
    display_order: 5000,
  },
  {
    account_code: "5100",
    account_name: "Software Subscriptions",
    account_type: "EXPENSE",
    normal_balance: "DEBIT",
    display_order: 5100,
  },
];
