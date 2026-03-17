// src/hooks/useStatements.ts
import { useQuery } from "@tanstack/react-query";
import { qk } from "./queryKeys";
import type { DbStatementType } from "../domain/statements/statementTypes";
import type {
  RenderedStatement as RenderedStatementRaw,
  RenderedStatementLine,
} from "../domain/statements/types";
import { StatementOrchestrator } from "../orchestrators/StatementOrchestrator";

export type RenderedStatement = Omit<RenderedStatementRaw, "lines"> & {
  lines: RenderedStatementLine[];
};

export function useStatement(
  entityId?: string,
  periodId?: string,
  statementType?: DbStatementType
) {
  const enabled = Boolean(entityId && periodId && statementType);

  return useQuery<RenderedStatement>({
    queryKey: enabled
      ? qk.statement(entityId!, periodId!, statementType!)
      : ["statement", "disabled"],
    enabled,
    queryFn: async () => {
      const raw = await StatementOrchestrator.renderStatement(
        entityId!,
        periodId!,
        statementType!
      );

      return {
        ...raw,
        lines: raw.lines ?? [],
      };
    },
    staleTime: 30_000,
  });
}