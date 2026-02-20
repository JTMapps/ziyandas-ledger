import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ComplianceOrchestrator } from "../orchestrators/ComplianceOrchestrator";
import { qk } from "./queryKeys";

export function useCompliance() {
  const qc = useQueryClient();

  // -----------------------
  // VAT Report (DB RPC)
  // -----------------------
  function useVATReport(entityId?: string, start?: string, end?: string) {
    const enabled = !!entityId && !!start && !!end;

    return useQuery({
      queryKey: enabled ? qk.vatReport(entityId!, start!, end!) : ["vat-report", "disabled"],
      enabled,
      queryFn: async () => {
        // Prefer your DB function directly:
        const { data, error } = await supabase.rpc("generate_vat_report", {
          p_entity_id: entityId!,
          p_start: start!,
          p_end: end!,
        });
        if (error) throw error;
        return data as any; // { vat_output, vat_input, vat_payable }
      },
    });
  }

  // -----------------------
  // Audit Log (table read)
  // -----------------------
  function useAuditLog(limit = 200) {
    return useQuery({
      queryKey: qk.auditLog(limit),
      queryFn: async () => {
        const { data, error } = await supabase
          .from("audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data ?? [];
      },
    });
  }

  // -----------------------
  // Deferred Tax Posting
  // (keep orchestrator if it wraps more logic)
  // -----------------------
  const postDeferredTax = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      // If your orchestrator calls post_deferred_tax_movement() internally, keep it.
      // Otherwise you can call RPC directly with supabase.rpc("post_deferred_tax_movement", ...)
      return ComplianceOrchestrator.postDeferredTax(vars.entityId, vars.year);
    },
    onSuccess: async (_res, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.auditLog(200) }),
      ]);
    },
  });

  // -----------------------
  // ECL Posting
  // -----------------------
  const postECL = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      return ComplianceOrchestrator.postECL(vars.entityId, vars.year);
    },
    onSuccess: async (_res, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.auditLog(200) }),
      ]);
    },
  });

  return {
    useVATReport,
    useAuditLog,
    postDeferredTax, // postDeferredTax.mutate/mutateAsync
    postECL,         // postECL.mutate/mutateAsync
  };
}
