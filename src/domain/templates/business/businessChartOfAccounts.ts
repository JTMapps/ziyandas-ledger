// ------------------------------------------------------------
// BUSINESS TEMPLATE – IFRS COMPLIANT CHART OF ACCOUNTS
// ------------------------------------------------------------

export interface TemplateAccount {
  account_code: string;
  account_name: string;
  account_type: string;             // ASSET / LIABILITY / EQUITY / INCOME / EXPENSE
  parent_code?: string;
  statement_type?: string;

  statement_section?: string;
  statement_subsection?: string;

    // NEW: template hierarchy
  level?: number;

  cash_flow_category?: string;
  tax_treatment?: string | null;
  is_contra?: boolean;
  is_cash_account?: boolean;
  normal_balance?: "DEBIT" | "CREDIT";
  display_order?: number;
}

export interface AppliedAccount {
  id: string;                       // ← DB ID after template applied
  account_code: string;
  account_name: string;
  account_type: string;
  parent_account_id?: string | null;
  statement_type?: string;
  statement_section?: string;
  statement_subsection?: string;
  cash_flow_category?: string;
  tax_treatment?: string | null;
  is_contra?: boolean;
  is_cash_account?: boolean;
  normal_balance?: "DEBIT" | "CREDIT";
  display_order?: number;
}

// ------------------------------------------------------------
// FULL IFRS BUSINESS COA (simplified but enterprise-ready)
// ------------------------------------------------------------

export const BUSINESS_CHART_OF_ACCOUNTS: TemplateAccount[] = [
  // -------------------------- ASSETS --------------------------
  {
    account_code: "1000",
    account_name: "Assets",
    account_type: "ASSET",
    statement_type: "STATEMENT_OF_FINANCIAL_POSITION",
    statement_section: "ASSETS",
    normal_balance: "DEBIT",
    display_order: 1000
  },
  {
    account_code: "1100",
    account_name: "Cash & Cash Equivalents",
    parent_code: "1000",
    account_type: "ASSET",
    statement_section: "ASSETS",
    cash_flow_category: "OPERATING",
    is_cash_account: true,
    normal_balance: "DEBIT",
    display_order: 1100
  },
  {
    account_code: "1200",
    account_name: "Trade Receivables",
    parent_code: "1000",
    account_type: "ASSET",
    cash_flow_category: "OPERATING",
    normal_balance: "DEBIT",
    display_order: 1200
  },
  // ---------------------- LIABILITIES ------------------------
  {
    account_code: "2000",
    account_name: "Liabilities",
    account_type: "LIABILITY",
    statement_section: "LIABILITIES",
    normal_balance: "CREDIT",
    display_order: 2000
  },
  {
    account_code: "2100",
    account_name: "Trade Payables",
    parent_code: "2000",
    account_type: "LIABILITY",
    cash_flow_category: "OPERATING",
    normal_balance: "CREDIT",
    display_order: 2100
  },
  // ------------------------ EQUITY ---------------------------
  {
    account_code: "3000",
    account_name: "Equity",
    account_type: "EQUITY",
    statement_section: "EQUITY",
    normal_balance: "CREDIT",
    display_order: 3000
  },
  {
    account_code: "3100",
    account_name: "Retained Earnings",
    parent_code: "3000",
    account_type: "EQUITY",
    statement_section: "EQUITY",
    cash_flow_category: "NON_CASH",
    normal_balance: "CREDIT",
    display_order: 3100
  },
  // ------------------------ INCOME ---------------------------
  {
    account_code: "4000",
    account_name: "Revenue",
    account_type: "INCOME",
    statement_type: "PROFIT_OR_LOSS",
    statement_section: "INCOME",
    normal_balance: "CREDIT",
    display_order: 4000
  },
  // ----------------------- EXPENSES --------------------------
  {
    account_code: "5000",
    account_name: "Cost of Sales",
    account_type: "EXPENSE",
    statement_type: "PROFIT_OR_LOSS",
    statement_section: "EXPENSES",
    normal_balance: "DEBIT",
    display_order: 5000
  },
  {
    account_code: "6000",
    account_name: "Operating Expenses",
    account_type: "EXPENSE",
    statement_type: "PROFIT_OR_LOSS",
    statement_section: "EXPENSES",
    normal_balance: "DEBIT",
    display_order: 6000
  }
];
