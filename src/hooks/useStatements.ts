import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";

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
  statement_type: string;
  lines: RenderedStatementLine[] | null;
};

export function useStatement(entityId?: string, periodId?: string, statementType?: string) {
  const enabled = !!entityId && !!periodId && !!statementType;

  return useQuery({
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
      return data as RenderedStatement;
    },
  });
}
