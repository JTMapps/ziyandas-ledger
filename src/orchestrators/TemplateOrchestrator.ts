// src/orchestrators/TemplateOrchestrator.ts
import { rpc } from "../lib/rpc";
import { requireAuth } from "../lib/auth";

export type DbEntityType = "Business" | "Personal"; // align to your public.entity_type enum labels

export const TemplateOrchestrator = {
  /**
   * Ensures entity has a template selection row and accounts are applied.
   * DB function handles ordering (is_default + effective dates) and calls apply_template_to_entity.
   */
  async ensureEntityAccounts(entityId: string, entityType: DbEntityType) {
    await requireAuth();
    return rpc<string>("assign_template_to_entity", {
      p_entity_id: entityId,
      p_entity_type: entityType,
    });
  },
} as const;