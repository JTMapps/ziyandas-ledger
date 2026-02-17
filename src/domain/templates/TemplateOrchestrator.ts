// ---------------------------------------------------------------------------
// TEMPLATE ORCHESTRATOR
// Connects template definitions → DB → applied accounts → journal rules
// ---------------------------------------------------------------------------

import { supabase } from "../../lib/supabase";

import {
  BUSINESS_CHART_OF_ACCOUNTS,
  AppliedAccount as BusinessApplied,
} from "./business/businessChartOfAccounts";

import {
  PERSONAL_CHART_OF_ACCOUNTS,
  AppliedAccount as PersonalApplied,
} from "./personal/personalChartOfAccounts";

import { BusinessCaptureRules } from "./business/businessCaptureRules";
import { PersonalCaptureRules } from "./personal/personalCaptureRules";

import { EventOrchestrator } from "../../orchestrators/EventOrchestrator";

// Combined type so hooks & UI can treat all accounts uniformly
export type AppliedAccount = BusinessApplied | PersonalApplied;

export type TemplateKind = "BUSINESS" | "PERSONAL";

export interface ApplyTemplateResult {
  template_group_id: string;
  accounts_created: number;
}

// ---------------------------------------------------------------------------
// STEP 1 — ASSIGN TEMPLATE TO ENTITY (calls backend RPC)
// This sets entity_template_selection.template_group_id
// ---------------------------------------------------------------------------

export async function assignTemplateToEntity(
  entityId: string,
  entityType: "Business" | "Personal"
): Promise<string> {
  const { data, error } = await supabase.rpc("assign_template_to_entity", {
    p_entity_id: entityId,
    p_entity_type: entityType,
  });

  if (error) throw error;
  return data; // template_group_id
}

// ---------------------------------------------------------------------------
// STEP 2 — APPLY TEMPLATE (generate accounts inside `accounts` table)
// Calls PostgreSQL function: apply_template_to_entity
// ---------------------------------------------------------------------------

export async function applyTemplateToEntity(
  entityId: string
): Promise<ApplyTemplateResult> {
  const { data, error } = await supabase.rpc("apply_template_to_entity", {
    p_entity_id: entityId,
  });

  if (error) {
    console.error("apply_template_to_entity failed:", error);
    throw error;
  }

  return {
    template_group_id: data.template_group_id,
    accounts_created: data.accounts_created,
  };
}

// ---------------------------------------------------------------------------
// STEP 3 — FETCH APPLIED ACCOUNTS FOR AN ENTITY
// ---------------------------------------------------------------------------

export async function loadAppliedAccounts(
  entityId: string
): Promise<AppliedAccount[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select(
      `
      id,
      account_code,
      account_name,
      account_type,
      parent_account_id,
      statement_type,
      statement_section,
      statement_subsection,
      cash_flow_category,
      tax_treatment,
      is_contra,
      is_cash_account,
      normal_balance,
      display_order
  `
    )
    .eq("entity_id", entityId)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data as AppliedAccount[];
}

// ---------------------------------------------------------------------------
// STEP 4 — RESOLVE PARENT/CHILD HIERARCHY
// (Used for templates prior to being saved to DB)
// ---------------------------------------------------------------------------

export function resolveTemplateHierarchy(
  template: { account_code: string; parent_code?: string }[]
): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};

  template.forEach((acc) => {
    mapping[acc.account_code] = acc.parent_code ?? null;
  });

  return mapping;
}

// ---------------------------------------------------------------------------
// STEP 5 — GET WHICH TEMPLATE IS USED FOR AN ENTITY
// ---------------------------------------------------------------------------

export async function getEntityTemplateKind(
  entityId: string
): Promise<TemplateKind> {
  const { data, error } = await supabase
    .from("entities")
    .select("type")
    .eq("id", entityId)
    .single();

  if (error) throw error;

  return data.type === "Business" ? "BUSINESS" : "PERSONAL";
}

// ---------------------------------------------------------------------------
// STEP 6 — RUN CAPTURE RULES AND POST ENTRY
// These rules convert user-friendly input → double-entry journal
// ---------------------------------------------------------------------------

export const TemplateJournalEngine = {
  // ---------------- BUSINESS ----------------

  business: {
    revenue: async (entityId: string, amount: number, description?: string) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = BusinessCaptureRules.revenue(accounts, {
        amount,
        description,
      });

      return EventOrchestrator.recordEconomicEvent({
        entityId,
        eventType: journal.eventType,
        eventDate: new Date().toISOString(),
        description: journal.description,
        effects: journal.effects.map(e => ({
        account_id: e.account_id,
        amount: e.amount,
        effect_sign: e.effect_sign as 1 | -1,   // FIX HERE
        })),

      });
    },

    expense: async (entityId: string, amount: number, description?: string) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = BusinessCaptureRules.expense(accounts, {
        amount,
        description,
      });

      return EventOrchestrator.recordEconomicEvent({
        entityId,
        eventType: journal.eventType,
        eventDate: new Date().toISOString(),
        description: journal.description,
        effects: journal.effects.map(e => ({
        account_id: e.account_id,
        amount: e.amount,
        effect_sign: e.effect_sign as 1 | -1,   // FIX HERE
        })),

      });
    },
  },

  // ---------------- PERSONAL ----------------

  personal: {
    salary: async (entityId: string, amount: number, source?: string) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = PersonalCaptureRules.salary(accounts, {
        amount,
        source,
      });

      return EventOrchestrator.recordEconomicEvent({
        entityId,
        eventType: journal.eventType,
        eventDate: new Date().toISOString(),
        description: journal.description,
        effects: journal.effects.map(e => ({
          account_id: e.account_id,
          amount: e.amount,
          effect_sign: e.effect_sign as 1 | -1,
        })),
      });
    },

    expense: async (entityId: string, amount: number, category?: string) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = PersonalCaptureRules.expense(accounts, {
        amount,
        category,
      });

      return EventOrchestrator.recordEconomicEvent({
        entityId,
        eventType: journal.eventType,
        eventDate: new Date().toISOString(),
        description: journal.description,
        effects: journal.effects.map(e => ({
        account_id: e.account_id,
        amount: e.amount,
        effect_sign: e.effect_sign as 1 | -1,   // FIX HERE
        })),

      });
    },

    transfer: async (
      entityId: string,
      amount: number,
      from_code: string,
      to_code: string
    ) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = PersonalCaptureRules.transfer(accounts, {
        amount,
        from_code,
        to_code,
      });

      return EventOrchestrator.recordEconomicEvent({
        entityId,
        eventType: journal.eventType,
        eventDate: new Date().toISOString(),
        description: journal.description,
        effects: journal.effects.map(e => ({
        account_id: e.account_id,
        amount: e.amount,
        effect_sign: e.effect_sign as 1 | -1,   // FIX HERE
        })),

      });
    },
  },
};

// ---------------------------------------------------------------------------
// STEP 7 — HIGH LEVEL TEMPLATE FLOW CALLED BY UI
// ---------------------------------------------------------------------------

export async function setupEntityTemplate(entityId: string) {
  // 1. Determine type
  const kind = await getEntityTemplateKind(entityId);

  // 2. Assign template group
  const templateGroupId = await assignTemplateToEntity(
    entityId,
    kind === "BUSINESS" ? "Business" : "Personal"
  );

  // 3. Apply template → materialize accounts
  const applied = await applyTemplateToEntity(entityId);

  // 4. Return everything for the UI
  return {
    kind,
    template_group_id: templateGroupId,
    accounts_created: applied.accounts_created,
  };
}
