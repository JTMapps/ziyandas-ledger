// src/hooks/queryKeys.ts
import type { DbStatementType } from "../domain/statements/statementTypes";

export const qk = {
  user: () => ["user"] as const,
  entities: () => ["entities"] as const,
  entity: (entityId: string) => ["entity", entityId] as const,

  periods: (entityId: string) => ["periods", entityId] as const,
  currentPeriod: (entityId: string) => ["current-period", entityId] as const,

  statement: (entityId: string, periodId: string, statementType: DbStatementType) =>
    ["statement", entityId, periodId, statementType] as const,

  entitySnapshot: (entityId: string) => ["entity-snapshot", entityId] as const,
  personalKpis: (entityId: string, asOf: string) => ["personal-kpis", entityId, asOf] as const,

  vatReport: (entityId: string, start: string, end: string) =>
    ["vat-report", entityId, start, end] as const,
  auditLog: (limit: number) => ["audit-log", limit] as const,

  taxSummary: (entityId: string) => ["tax-summary", entityId] as const,

  economicEvents: (entityId: string, filters?: Record<string, unknown>) =>
    ["economic-events", entityId, filters ?? {}] as const,

  ecl: (entityId: string, year?: number) => ["ecl", entityId, year ?? "all"] as const,
  deferredTax: (entityId: string, year?: number) =>
    ["deferred-tax", entityId, year ?? "all"] as const,

  templates: () => ["templates"] as const,
} as const;