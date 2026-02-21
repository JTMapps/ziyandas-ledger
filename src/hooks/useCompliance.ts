// src/hooks/useCompliance.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ComplianceOrchestrator } from "../orchestrators/ComplianceOrchestrator";
import { qk } from "./queryKeys";

export type VatReport = {
  vat_output: number;
  vat_input: number;
  vat_payable: number;
  // if your RPC returns more fields, extend here
};

export type AuditLogRow = {
  id: string;
  table_name: string;
  operation: "INSERT" | "UPDATE" | "DELETE" | string;
  record_id: string;
  before_state: unknown | null;
  after_state: unknown | null;
  changed_by: string | null;
  created_at: string;
};

export function useCompliance() {
  const qc = useQueryClient();

  // -----------------------
  // VAT Report (READ-ONLY) -> direct RPC
  // -----------------------
  function useVATReport(entityId?: string, start?: string, end?: string) {
    const enabled = Boolean(entityId && start && end);

    return useQuery<VatReport>({
      queryKey: enabled ? qk.vatReport(entityId!, start!, end!) : ["vat-report", "disabled"],
      enabled,
      queryFn: async () => {
        const { data, error } = await supabase.rpc("generate_vat_report", {
          p_entity_id: entityId!,
          p_start: start!,
          p_end: end!,
        });

        if (error) throw error;

        // Supabase may return numerics as strings depending on your settings;
        // normalize safely.
        const r = (data ?? {}) as any;
        return {
          vat_output: Number(r.vat_output ?? 0),
          vat_input: Number(r.vat_input ?? 0),
          vat_payable: Number(r.vat_payable ?? 0),
        };
      },
      staleTime: 60_000,
    });
  }

  // -----------------------
  // Audit Log (READ-ONLY) -> direct table read
  // -----------------------
  function useAuditLog(limit = 200) {
    return useQuery<AuditLogRow[]>({
      queryKey: qk.auditLog(limit),
      queryFn: async () => {
        const { data, error } = await supabase
          .from("audit_log")
          .select(
            "id, table_name, operation, record_id, before_state, after_state, changed_by, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return (data ?? []) as AuditLogRow[];
      },
      staleTime: 15_000,
    });
  }

  // -----------------------
  // Deferred Tax Posting (WORKFLOW) -> orchestrator
  // -----------------------
  const postDeferredTax = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      await ComplianceOrchestrator.postDeferredTax(vars.entityId, vars.year);
      return true;
    },
    onSuccess: async (_res, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.auditLog(200) }),
        qc.invalidateQueries({ queryKey: qk.deferredTax(vars.entityId, vars.year) }),
      ]);
    },
  });

  // -----------------------
  // ECL Posting (WORKFLOW) -> orchestrator (now uses post_ecl_year_end)
  // -----------------------
  const postECL = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      const eventId = await ComplianceOrchestrator.postECL(vars.entityId, vars.year);
      return eventId; // uuid
    },
    onSuccess: async (_eventId, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.auditLog(200) }),
        qc.invalidateQueries({ queryKey: qk.ecl(vars.entityId, vars.year) }),
      ]);
    },
  });

  return {
    // read-only hooks
    useVATReport,
    useAuditLog,

    // workflows
    postDeferredTax,
    postECL,
  };
}