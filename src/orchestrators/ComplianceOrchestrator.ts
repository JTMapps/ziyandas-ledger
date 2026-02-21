// src/orchestrators/ComplianceOrchestrator.ts
import { supabase } from "../lib/supabase";
import { eventEmitter } from "../lib/eventEmitter";
import { rpc } from "../lib/rpc";
import { requireAuth } from "../lib/auth";

export const ComplianceOrchestrator = {
  /** IAS 12 — Post Deferred Tax Movement */
  async postDeferredTax(entityId: string, year: number) {
    await requireAuth();

    const result = await rpc<void>("post_deferred_tax_movement", {
      p_entity: entityId,
      p_year: year,
    });

    eventEmitter.emit("IAS12_DEFERRED_TAX_POSTED", { entityId, year });
    return result;
  },

  /** IFRS 9 — Post ECL Year-End Movement (DB: post_ecl_year_end) */
  async postECL(entityId: string, year: number) {
    await requireAuth();

    const eventId = await rpc<string>("post_ecl_year_end", {
      p_entity: entityId,
      p_year: year,
    });

    eventEmitter.emit("IFRS9_ECL_POSTED", { entityId, year, eventId });
    return eventId;
  },

  /** VAT reporting */
  async generateVATReport(entityId: string, start: string, end: string) {
    await requireAuth();

    const report = await rpc<any>("generate_vat_report", {
      p_entity_id: entityId,
      p_start: start,
      p_end: end,
    });

    eventEmitter.emit("VAT_REPORT_GENERATED", { entityId, start, end });
    return report;
  },

  /** Audit Log viewer helper */
  async fetchAuditLog(limit = 200) {
    await requireAuth();

    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
  },
};