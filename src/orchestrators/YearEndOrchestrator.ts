// src/orchestrators/YearEndOrchestrator.ts
import { eventEmitter } from "../lib/eventEmitter";
import { rpc } from "../lib/rpc";
import { requireAuth } from "../lib/auth";

export const YearEndOrchestrator = {
  /** Full enterprise year-end close pipeline */
  async runFullYearEndClose(entityId: string, year: number) {
    const user = await requireAuth();

    // DB: close_financial_year_enterprise(p_entity_id uuid, p_year integer, p_user uuid)
    const snapshotId = await rpc<string>("close_financial_year_enterprise", {
      p_entity_id: entityId,
      p_year: year,
      p_user: user.id,
    });

    eventEmitter.emit("YEAR_END_COMPLETED", { entityId, year, snapshotId });
    return snapshotId;
  },

  /** Opening balances generator */
  async generateOpeningBalances(entityId: string, year: number) {
    await requireAuth();

    await rpc<void>("generate_opening_balances", {
      p_entity_id: entityId,
      p_year: year,
    });

    eventEmitter.emit("OPENING_BALANCES_CREATED", { entityId, year });
  },

  /** IFRS cash flow generation */
  async generateCashFlow(entityId: string, periodId: string) {
    await requireAuth();

    const result = await rpc<string>("generate_cash_flow_indirect", {
      p_entity_id: entityId,
      p_period_id: periodId,
    });

    eventEmitter.emit("CASH_FLOW_GENERATED", { entityId, periodId, result });
    return result;
  },

  /** IAS 12 deferred tax */
  async postDeferredTax(entityId: string, year: number) {
    await requireAuth();

    await rpc<void>("post_deferred_tax_movement", {
      p_entity: entityId,
      p_year: year,
    });

    eventEmitter.emit("DEFERRED_TAX_POSTED", { entityId, year });
  },

  /** IFRS 9 ECL year-end (switched) */
  async postECLMovement(entityId: string, year: number) {
    await requireAuth();

    const eventId = await rpc<string>("post_ecl_year_end", {
      p_entity: entityId,
      p_year: year,
    });

    eventEmitter.emit("ECL_POSTED", { entityId, year, eventId });
    return eventId;
  },

  /** Force-regenerate statement lines for an existing snapshot */
  async rebuildStatements(snapshotId: string) {
    await requireAuth();

    await rpc<void>("build_financial_statements", { p_snapshot_id: snapshotId });

    eventEmitter.emit("STATEMENTS_REBUILT", { snapshotId });
  },
} as const;