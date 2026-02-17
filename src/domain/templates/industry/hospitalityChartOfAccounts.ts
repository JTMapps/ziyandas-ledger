import { TemplateAccount } from "../business/businessChartOfAccounts";

export const HOSPITALITY_COA: TemplateAccount[] = [
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
    account_type: "ASSET",
    parent_code: "1000",
    is_cash_account: true,
    normal_balance: "DEBIT",
    display_order: 1100,
  },

  // INCOME
  {
    account_code: "4000",
    account_name: "Room Revenue",
    account_type: "INCOME",
    normal_balance: "CREDIT",
    display_order: 4000,
  },
  {
    account_code: "4100",
    account_name: "Food & Beverage Revenue",
    account_type: "INCOME",
    parent_code: "4000",
    normal_balance: "CREDIT",
    display_order: 4100,
  },

  // EXPENSES
  {
    account_code: "5000",
    account_name: "Housekeeping Costs",
    account_type: "EXPENSE",
    normal_balance: "DEBIT",
    display_order: 5000,
  },
  {
    account_code: "5100",
    account_name: "Food & Beverage Costs",
    account_type: "EXPENSE",
    normal_balance: "DEBIT",
    display_order: 5100,
  },
];
