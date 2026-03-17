// src/domain/statements/statementTypes.ts
export type DbStatementType =
  | "STATEMENT_OF_FINANCIAL_POSITION"
  | "PROFIT_OR_LOSS"
  | "OTHER_COMPREHENSIVE_INCOME"
  | "CASH_FLOW"
  | "EQUITY";

export type UiStatementType = "SOFP" | "P&L" | "OCI" | "CF" | "EQUITY";

export const STATEMENT_TYPE_MAP: Record<UiStatementType, DbStatementType> = {
  SOFP: "STATEMENT_OF_FINANCIAL_POSITION",
  "P&L": "PROFIT_OR_LOSS",
  OCI: "OTHER_COMPREHENSIVE_INCOME",
  CF: "CASH_FLOW",
  EQUITY: "EQUITY",
};


export const UI_STATEMENT_TYPES: UiStatementType[] = ["SOFP", "P&L", "OCI", "CF", "EQUITY"];

export const UI_STATEMENT_LABEL: Record<UiStatementType, string> = {
  SOFP: "Statement of Financial Position",
  "P&L": "Profit or Loss",
  OCI: "Other Comprehensive Income",
  CF: "Cash Flow",
  EQUITY: "Statement of Changes in Equity",
};