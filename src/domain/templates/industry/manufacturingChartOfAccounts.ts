import { TemplateAccount } from "../business/businessChartOfAccounts";

export const MANUFACTURING_COA: TemplateAccount[] = [
  // -------------------------- ASSETS --------------------------
  {
    account_code: "1000",
    account_name: "Assets",
    account_type: "ASSET",
    statement_section: "ASSETS",
    normal_balance: "DEBIT",
    display_order: 1000,
  },
  {
    account_code: "1100",
    account_name: "Cash",
    account_type: "ASSET",
    is_cash_account: true,
    parent_code: "1000",
    cash_flow_category: "OPERATING",
    normal_balance: "DEBIT",
    display_order: 1100,
  },
  {
    account_code: "1200",
    account_name: "Raw Materials",
    account_type: "ASSET",
    parent_code: "1000",
    statement_section: "INVENTORY",
    cash_flow_category: "OPERATING",
    normal_balance: "DEBIT",
    display_order: 1200,
  },
  {
    account_code: "1210",
    account_name: "Work In Progress (WIP)",
    account_type: "ASSET",
    parent_code: "1000",
    statement_section: "INVENTORY",
    normal_balance: "DEBIT",
    display_order: 1210,
  },
  {
    account_code: "1220",
    account_name: "Finished Goods",
    account_type: "ASSET",
    parent_code: "1000",
    statement_section: "INVENTORY",
    normal_balance: "DEBIT",
    display_order: 1220,
  },

  // -------------------------- LIABILITIES --------------------------
  {
    account_code: "2000",
    account_name: "Liabilities",
    account_type: "LIABILITY",
    normal_balance: "CREDIT",
    display_order: 2000,
  },
  {
    account_code: "2100",
    account_name: "Accounts Payable",
    parent_code: "2000",
    account_type: "LIABILITY",
    normal_balance: "CREDIT",
    cash_flow_category: "OPERATING",
    display_order: 2100,
  },

  // -------------------------- EQUITY --------------------------
  {
    account_code: "3000",
    account_name: "Equity",
    account_type: "EQUITY",
    normal_balance: "CREDIT",
    display_order: 3000,
  },

  // -------------------------- INCOME --------------------------
  {
    account_code: "4000",
    account_name: "Sales Revenue",
    account_type: "INCOME",
    statement_section: "REVENUE",
    normal_balance: "CREDIT",
    display_order: 4000,
  },

  // -------------------------- EXPENSES --------------------------
  {
    account_code: "5000",
    account_name: "Cost of Raw Materials",
    account_type: "EXPENSE",
    statement_section: "COGS",
    normal_balance: "DEBIT",
    display_order: 5000,
  },
  {
    account_code: "5100",
    account_name: "Direct Labor",
    account_type: "EXPENSE",
    statement_section: "COGS",
    normal_balance: "DEBIT",
    display_order: 5100,
  },
  {
    account_code: "5200",
    account_name: "Factory Overheads",
    account_type: "EXPENSE",
    statement_section: "COGS",
    normal_balance: "DEBIT",
    display_order: 5200,
  },
];
