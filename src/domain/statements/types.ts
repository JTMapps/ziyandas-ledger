// src/domain/statements/types.ts
import type { DbStatementType } from "./statementTypes";

export type RenderedStatementLine = {
  account_id: string | null;
  code: string;
  name: string;
  level: number;
  amount: number | null;
  order: number;
};

export type RenderedStatement = {
  entity_id: string;
  period_id: string;
  statement_type: DbStatementType; // recommended: pass DB tokens, so it returns DB tokens
  lines: RenderedStatementLine[] | null; // json_agg can be null
};


export type EntitySnapshotRow = {
  label: string;
  value: number; // we normalize to number in the hook
};

export type EntitySnapshot = {
  netIncome: number;
  cashBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  retainedEarnings: number;
};

