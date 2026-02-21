// src/hooks/useStatements.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";
import type { DbStatementType } from "../domain/statements/statementTypes";
import type {
  RenderedStatement as RenderedStatementRaw,
  RenderedStatementLine,
} from "../domain/statements/types";

// UI-safe type: lines is always an array
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
      const { data, error } = await supabase.rpc("render_financial_statement", {
        p_entity_id: entityId!,
        p_period_id: periodId!,
        p_statement_type: statementType!,
      });

      if (error) throw error;

      const raw = data as RenderedStatementRaw;
      return {
        ...raw,
        lines: raw.lines ?? [],
      };
    },
    staleTime: 30_000,
  });
}