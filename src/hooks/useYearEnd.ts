// src/hooks/useYearEnd.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "./queryKeys";
import { YearEndOrchestrator } from "../orchestrators/YearEndOrchestrator";

export function useYearEnd() {
  const qc = useQueryClient();

  const runFullYearEndClose = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      // ✅ official preference
      return YearEndOrchestrator.runFullYearEndClose(vars.entityId, vars.year);
    },
    onSuccess: async (_snapshotId, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.economicEvents(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.ecl(vars.entityId, vars.year) }),
        qc.invalidateQueries({ queryKey: qk.deferredTax(vars.entityId, vars.year) }),
        qc.invalidateQueries({ queryKey: qk.auditLog(200) }),
      ]);
    },
  });

  const postDeferredTax = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      await YearEndOrchestrator.postDeferredTax(vars.entityId, vars.year);
      return true;
    },
    onSuccess: async (_ok, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.deferredTax(vars.entityId, vars.year) }),
        qc.invalidateQueries({ queryKey: qk.auditLog(200) }),
      ]);
    },
  });

  const postECLMovement = useMutation({
    mutationFn: async (vars: { entityId: string; year: number }) => {
      // returns eventId
      return YearEndOrchestrator.postECLMovement(vars.entityId, vars.year);
    },
    onSuccess: async (_eventId, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),
        qc.invalidateQueries({ queryKey: qk.ecl(vars.entityId, vars.year) }),
        qc.invalidateQueries({ queryKey: qk.auditLog(200) }),
      ]);
    },
  });

  return { runFullYearEndClose, postDeferredTax, postECLMovement };
}