import { TemplateAccount } from "../business/businessChartOfAccounts";

export const RETAIL_COA: TemplateAccount[] = [
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
    account_name: "Cash & Cash Equivalents",
    account_type: "ASSET",
    parent_code: "1000",
    is_cash_account: true,
    cash_flow_category: "OPERATING",
    normal_balance: "DEBIT",
    display_order: 1100,
  },
  {
    account_code: "1200",
    account_name: "Inventory",
    account_type: "ASSET",
    parent_code: "1000",
    statement_section: "INVENTORY",
    cash_flow_category: "OPERATING",
    normal_balance: "DEBIT",
    display_order: 1200,
  },
  {
    account_code: "1300",
    account_name: "Accounts Receivable",
    account_type: "ASSET",
    parent_code: "1000",
    cash_flow_category: "OPERATING",
    normal_balance: "DEBIT",
    display_order: 1300,
  },

  // -------------------------- LIABILITIES --------------------------
  {
    account_code: "2000",
    account_name: "Liabilities",
    account_type: "LIABILITY",
    statement_section: "LIABILITIES",
    normal_balance: "CREDIT",
    display_order: 2000,
  },
  {
    account_code: "2100",
    account_name: "Accounts Payable",
    parent_code: "2000",
    account_type: "LIABILITY",
    cash_flow_category: "OPERATING",
    normal_balance: "CREDIT",
    display_order: 2100,
  },
  {
    account_code: "2200",
    account_name: "Deferred Revenue",
    parent_code: "2000",
    account_type: "LIABILITY",
    cash_flow_category: "OPERATING",
    normal_balance: "CREDIT",
    display_order: 2200,
  },

  // -------------------------- EQUITY --------------------------
  {
    account_code: "3000",
    account_name: "Equity",
    account_type: "EQUITY",
    normal_balance: "CREDIT",
    display_order: 3000,
  },
  {
    account_code: "3100",
    account_name: "Retained Earnings",
    parent_code: "3000",
    account_type: "EQUITY",
    cash_flow_category: "NON_CASH",
    normal_balance: "CREDIT",
    display_order: 3100,
  },

  // -------------------------- INCOME --------------------------
  {
    account_code: "4000",
    account_name: "Sales Revenue",
    account_type: "INCOME",
    statement_type: "PROFIT_OR_LOSS",
    statement_section: "REVENUE",
    normal_balance: "CREDIT",
    display_order: 4000,
  },
  {
    account_code: "4100",
    account_name: "Online Sales Revenue",
    account_type: "INCOME",
    parent_code: "4000",
    statement_section: "REVENUE",
    normal_balance: "CREDIT",
    display_order: 4100,
  },

  // -------------------------- EXPENSES --------------------------
  {
    account_code: "5000",
    account_name: "Cost of Goods Sold",
    account_type: "EXPENSE",
    statement_section: "COGS",
    normal_balance: "DEBIT",
    display_order: 5000,
  },
  {
    account_code: "5100",
    account_name: "Store Operating Expenses",
    account_type: "EXPENSE",
    statement_section: "EXPENSES",
    normal_balance: "DEBIT",
    display_order: 5100,
  },
  {
    account_code: "5200",
    account_name: "Marketing Expense",
    account_type: "EXPENSE",
    statement_section: "EXPENSES",
    normal_balance: "DEBIT",
    display_order: 5200,
  },
];
