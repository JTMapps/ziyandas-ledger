// src/domain/statements/labels.ts
import type { DbStatementType } from "./statementTypes";

export const DB_STATEMENT_LABEL: Record<DbStatementType, string> = {
  STATEMENT_OF_FINANCIAL_POSITION: "Statement of Financial Position",
  PROFIT_OR_LOSS: "Profit or Loss",
  OTHER_COMPREHENSIVE_INCOME: "Other Comprehensive Income",
  CASH_FLOW: "Cash Flow",
  EQUITY: "Statement of Changes in Equity",
};