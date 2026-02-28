// src/orchestrators/StatementOrchestrator.ts
import { supabase } from "../lib/supabase";
import { eventEmitter } from "../lib/eventEmitter";
import { rpc } from "../lib/rpc";
import { requireAuth } from "../lib/auth";
import type { RenderedStatement } from "../domain/statements/types";
import type { DbStatementType } from "../domain/statements/statementTypes";

type SnapshotType = "DRAFT" | "FINAL" | "AUDITED";

export const StatementOrchestrator = {
  /**
   * Create a snapshot row (DRAFT).
   * Keep this only if you truly use snapshot/lines tables in your UI flow.
   */
  async createSnapshot(entityId: string, periodId: string, statementType: DbStatementType) {
    await requireAuth();

    const snapshotId = await rpc<string>("create_financial_snapshot", {
      p_entity_id: entityId,
      p_period_id: periodId,
      p_statement_type: statementType,
      p_snapshot_type: "DRAFT",
    });

    eventEmitter.emit("SNAPSHOT_CREATED", { snapshotId, statementType });
    return snapshotId;
  },

  /** Build lines for an existing snapshot */
  async rebuildSnapshot(snapshotId: string) {
    await requireAuth();
    await rpc<void>("build_financial_statements", { p_snapshot_id: snapshotId });
    eventEmitter.emit("STATEMENT_REBUILT", { snapshotId });
  },

  /**
   * Render statement via DB RPC.
   * IMPORTANT: your DB signature RETURNS json, not uuid.
   */
  async renderStatement(entityId: string, periodId: string, statementType: DbStatementType) {
    await requireAuth();

    const rendered = await rpc<RenderedStatement>("render_financial_statement", {
      p_entity_id: entityId,
      p_period_id: periodId,
      p_statement_type: statementType,
    });

    eventEmitter.emit("STATEMENT_RENDERED", { entityId, periodId, statementType });
    return rendered;
  },

  /** Optional: load statement lines table (only needed if UI uses snapshot lines directly) */
  async getStatementLines(snapshotId: string) {
    await requireAuth();

    const { data, error } = await supabase
      .from("financial_statement_lines")
      .select("*")
      .eq("snapshot_id", snapshotId)
      .order("display_order", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /** Mark snapshot FINAL (DB triggers/indexes will enforce lock/uniqueness rules) */
  async finalizeSnapshot(snapshotId: string) {
    await requireAuth();

    const { error } = await supabase
      .from("financial_statement_snapshots")
      .update({ snapshot_type: "FINAL" satisfies SnapshotType })
      .eq("id", snapshotId);

    if (error) throw new Error(error.message);
    eventEmitter.emit("SNAPSHOT_FINALIZED", { snapshotId });
  },
} as const;