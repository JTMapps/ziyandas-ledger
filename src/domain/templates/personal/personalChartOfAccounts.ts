// ------------------------------------------------------------
// PERSONAL FINANCE TEMPLATE – SIMPLE + AUTOMATIC JOURNAL RULES
// ------------------------------------------------------------

export interface TemplateAccount {
  account_code: string;
  account_name: string;
  account_type: string;
  
  level?: number;
  parent_code?: string;

  statement_type?: string;
  statement_section?: string;
  
  cash_flow_category?: string;
  normal_balance?: "DEBIT" | "CREDIT";
  display_order?: number;
}

export interface AppliedAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_account_id?: string | null;
  statement_type?: string;
  statement_section?: string;
  cash_flow_category?: string;
  normal_balance?: "DEBIT" | "CREDIT";
  display_order?: number;
}

// ------------------------------------------------------------
// SIMPLE PERSONAL COA
// ------------------------------------------------------------

export const PERSONAL_CHART_OF_ACCOUNTS: TemplateAccount[] = [
  // -------------------------- ASSETS --------------------------
  {
    account_code: "100",
    account_name: "Cash",
    account_type: "ASSET",
    statement_section: "ASSETS",
    cash_flow_category: "OPERATING",
    normal_balance: "DEBIT",
    display_order: 100
  },
  {
    account_code: "110",
    account_name: "Savings",
    account_type: "ASSET",
    statement_section: "ASSETS",
    cash_flow_category: "INVESTING",
    normal_balance: "DEBIT",
    display_order: 110
  },
  // ------------------------ INCOME ---------------------------
  {
    account_code: "400",
    account_name: "Salary Income",
    account_type: "INCOME",
    statement_section: "INCOME",
    normal_balance: "CREDIT",
    display_order: 400
  },
  // ----------------------- EXPENSES --------------------------
  {
    account_code: "500",
    account_name: "Living Expenses",
    account_type: "EXPENSE",
    statement_section: "EXPENSES",
    normal_balance: "DEBIT",
    display_order: 500
  },
  {
    account_code: "510",
    account_name: "Transport Expenses",
    account_type: "EXPENSE",
    statement_section: "EXPENSES",
    normal_balance: "DEBIT",
    display_order: 510
  }
];
