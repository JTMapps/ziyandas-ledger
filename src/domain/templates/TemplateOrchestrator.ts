// ---------------------------------------------------------------------------
// TEMPLATE ORCHESTRATOR
// Connects template definitions → DB → applied accounts → journal rules
//
// Fix Option A:
// ✅ Keep orchestrator wrappers (entityId, amount, description?) so wizards
// can call stable 2–3 arg functions.
// ✅ Pick template group by (template_name + entity_type + is_active)
// ✅ Call apply_template_to_entity(entityId, templateGroupId) (2 args)
// ❌ Do NOT expose raw IndustryCaptureRules.* directly (they are (accounts, params))
// ---------------------------------------------------------------------------

import { supabase } from "../../lib/supabase";

import {
  BUSINESS_CHART_OF_ACCOUNTS,
  AppliedAccount as BusinessApplied,
  TemplateAccount,
} from "./business/businessChartOfAccounts";

import {
  PERSONAL_CHART_OF_ACCOUNTS,
  AppliedAccount as PersonalApplied,
} from "./personal/personalChartOfAccounts";

import { BusinessCaptureRules } from "./business/businessCaptureRules";
import { PersonalCaptureRules } from "./personal/personalCaptureRules";
import { IndustryCaptureRules } from "./industry/industryCaptureRules";

import { EventOrchestrator } from "../../orchestrators/EventOrchestrator";

import {
  RETAIL_COA,
  MANUFACTURING_COA,
  SERVICES_COA,
  REAL_ESTATE_COA,
  HOSPITALITY_COA,
} from "./industry";

// Combined type so hooks & UI can treat all accounts uniformly
export type AppliedAccount = BusinessApplied | PersonalApplied;

export type TemplateKind =
  | "BUSINESS"
  | "PERSONAL"
  | "RETAIL"
  | "MANUFACTURING"
  | "SERVICES"
  | "REAL_ESTATE"
  | "HOSPITALITY";

type EntityRowForDerive = {
  type: "Business" | "Personal";
  industry_type?: string | null;
};

// ---------------------------------------------------------------------------
// Template-name mapping (DB-facing)
// IMPORTANT: Must match account_template_groups.template_name in Postgres
// ---------------------------------------------------------------------------
const TEMPLATE_NAME_BY_KIND: Record<TemplateKind, string> = {
  BUSINESS: "Business",
  PERSONAL: "Personal",
  RETAIL: "Retail",
  MANUFACTURING: "Manufacturing",
  SERVICES: "Services",
  REAL_ESTATE: "Real Estate",
  HOSPITALITY: "Hospitality",
};

// ---------------------------------------------------------------------------
// STEP 0 — Derive TemplateKind without extra DB calls
// ---------------------------------------------------------------------------
export function deriveTemplateKindFromEntity(entity: EntityRowForDerive): TemplateKind {
  if (entity.type === "Personal") return "PERSONAL";

  const industryMap: Record<string, TemplateKind> = {
    Generic: "BUSINESS",
    Retail: "RETAIL",
    Manufacturing: "MANUFACTURING",
    Services: "SERVICES",
    RealEstate: "REAL_ESTATE",
    Hospitality: "HOSPITALITY",
  };

  const key = entity.industry_type ?? "Generic";
  return industryMap[key] ?? "BUSINESS";
}

// ---------------------------------------------------------------------------
// STEP 1 — ASSIGN TEMPLATE GROUP TO ENTITY (industry-aware)
// DB-driven using account_template_groups.template_name
// Writes entity_template_selection (upsert by entity_id)
// ---------------------------------------------------------------------------
export async function assignTemplateToEntity(
  entityId: string,
  kind: TemplateKind
): Promise<string> {
  const templateName = TEMPLATE_NAME_BY_KIND[kind];

  // Industry templates are still business entities in DB
  const entityTypeForGroup = kind === "PERSONAL" ? "Personal" : "Business";

  const { data: group, error: groupErr } = await supabase
    .from("account_template_groups")
    .select("id")
    .eq("template_name", templateName)
    .eq("entity_type", entityTypeForGroup)
    .eq("is_active", true)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (groupErr || !group?.id) {
    throw new Error(
      `No active template group found for template_name="${templateName}" entity_type="${entityTypeForGroup}".`
    );
  }

  const templateGroupId = group.id as string;

  const { error: upsertErr } = await supabase
    .from("entity_template_selection")
    .upsert(
      { entity_id: entityId, template_group_id: templateGroupId },
      { onConflict: "entity_id" }
    );

  if (upsertErr) throw upsertErr;

  return templateGroupId;
}

// ---------------------------------------------------------------------------
// STEP 2 — APPLY TEMPLATE (materialize accounts from templates)
// ✅ must pass BOTH p_entity_id + p_template_group_id (matches DB function)
// ---------------------------------------------------------------------------
export async function applyTemplateToEntity(
  entityId: string,
  templateGroupId: string
): Promise<void> {
  const { error } = await supabase.rpc("apply_template_to_entity", {
    p_entity_id: entityId,
    p_template_group_id: templateGroupId,
  });

  if (error) {
    console.error("apply_template_to_entity failed:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// STEP 3 — FETCH APPLIED ACCOUNTS
// ---------------------------------------------------------------------------
export async function loadAppliedAccounts(entityId: string): Promise<AppliedAccount[]> {
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
// STEP 4 — RESOLVE TEMPLATE HIERARCHY (utility)
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
// STEP 5 — DETERMINE TEMPLATE KIND (DB version; kept for other callers)
// ---------------------------------------------------------------------------
export async function getEntityTemplateKind(entityId: string): Promise<TemplateKind> {
  const { data, error } = await supabase
    .from("entities")
    .select("type, industry_type")
    .eq("id", entityId)
    .single();

  if (error) throw error;

  return deriveTemplateKindFromEntity(data as EntityRowForDerive);
}

// ---------------------------------------------------------------------------
// Internal helper — post a journal produced by capture rules
// ---------------------------------------------------------------------------
function todayYYYYMMDD() {
  return new Date().toISOString().slice(0, 10);
}

async function postJournalFromRule(entityId: string, journal: any) {
  return EventOrchestrator.recordEconomicEvent({
    entityId,
    eventType: journal.eventType,
    eventDate: todayYYYYMMDD(),
    description: journal.description,
    effects: journal.effects.map((e: any) => ({
      account_id: e.account_id,
      amount: Math.abs(Number(e.amount) || 0),
      effect_sign: e.effect_sign === -1 ? -1 : 1,
      tax_treatment: e.tax_treatment ?? null,
      deductible: e.deductible ?? false,
    })),
  });
}

// Add this helper near your other DB helpers
export async function getExistingTemplateSelection(entityId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("entity_template_selection")
    .select("template_group_id")
    .eq("entity_id", entityId)
    .single();

  // PGRST116 = no rows found
  if (error && (error as any).code !== "PGRST116") throw error;
  return (data?.template_group_id as string | undefined) ?? null;
}

/**
 * Re-apply existing selected template (no changes to selection allowed).
 * Use this when template is already selected but accounts are missing.
 */
export async function reapplySelectedTemplate(entityId: string): Promise<string> {
  const templateGroupId = await getExistingTemplateSelection(entityId);
  if (!templateGroupId) throw new Error("No template selection found for entity.");
  await applyTemplateToEntity(entityId, templateGroupId);
  return templateGroupId;
}

/**
 * Setup flow:
 * - If selection exists: DO NOT change it (DB forbids). Just apply it.
 * - If selection does not exist: assign then apply.
 */
export async function setupEntityTemplate(entityId: string, kind: TemplateKind) {
  const existing = await getExistingTemplateSelection(entityId);

  if (existing) {
    // DB forbids changing template assignment once set.
    // We only materialize accounts for the already-selected group.
    await applyTemplateToEntity(entityId, existing);

    return { kind, template_group_id: existing, reused_existing_selection: true as const };
  }

  const templateGroupId = await assignTemplateToEntity(entityId, kind);
  await applyTemplateToEntity(entityId, templateGroupId);

  return { kind, template_group_id: templateGroupId, reused_existing_selection: false as const };
}
// ---------------------------------------------------------------------------
// STEP 6 — JOURNAL ENGINE (Business + Personal + Industry)
// ✅ Stable wizard API: (entityId, amount, description?)
// ---------------------------------------------------------------------------
export const TemplateJournalEngine = {
  business: {
    revenue: async (entityId: string, amount: number, description?: string) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = BusinessCaptureRules.revenue(accounts, { amount, description });
      return postJournalFromRule(entityId, journal);
    },

    expense: async (entityId: string, amount: number, description?: string) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = BusinessCaptureRules.expense(accounts, { amount, description });
      return postJournalFromRule(entityId, journal);
    },
  },

  personal: {
    salary: async (entityId: string, amount: number, source?: string) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = PersonalCaptureRules.salary(accounts, { amount, source });
      return postJournalFromRule(entityId, journal);
    },

    expense: async (entityId: string, amount: number, category?: string) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = PersonalCaptureRules.expense(accounts, { amount, category });
      return postJournalFromRule(entityId, journal);
    },

    transfer: async (entityId: string, amount: number, from_code: string, to_code: string) => {
      const accounts = await loadAppliedAccounts(entityId);
      const journal = PersonalCaptureRules.transfer(accounts, { amount, from_code, to_code });
      return postJournalFromRule(entityId, journal);
    },
  },

  industry: {
    retail: {
      sale: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.retail.sale(accounts, { amount, description });
        return postJournalFromRule(entityId, journal);
      },

      purchaseInventory: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.retail.purchaseInventory(accounts, {
          amount,
          description,
        });
        return postJournalFromRule(entityId, journal);
      },
    },

    manufacturing: {
      consumeRawMaterials: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.manufacturing.consumeRawMaterials(accounts, {
          amount,
          description,
        });
        return postJournalFromRule(entityId, journal);
      },

      completeProductionBatch: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.manufacturing.completeProductionBatch(accounts, {
          amount,
          description,
        });
        return postJournalFromRule(entityId, journal);
      },
    },

    services: {
      clientInvoice: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.services.clientInvoice(accounts, {
          amount,
          description,
        });
        return postJournalFromRule(entityId, journal);
      },

      payContractor: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.services.payContractor(accounts, {
          amount,
          description,
        });
        return postJournalFromRule(entityId, journal);
      },
    },

    hospitality: {
      roomSale: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.hospitality.roomSale(accounts, { amount, description });
        return postJournalFromRule(entityId, journal);
      },

      serviceMeal: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.hospitality.serviceMeal(accounts, {
          amount,
          description,
        });
        return postJournalFromRule(entityId, journal);
      },
    },

    realEstate: {
      rentIncome: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.realEstate.rentIncome(accounts, { amount, description });
        return postJournalFromRule(entityId, journal);
      },

      maintenanceExpense: async (entityId: string, amount: number, description?: string) => {
        const accounts = await loadAppliedAccounts(entityId);
        const journal = IndustryCaptureRules.realEstate.maintenanceExpense(accounts, {
          amount,
          description,
        });
        return postJournalFromRule(entityId, journal);
      },
    },
  },
};

// ---------------------------------------------------------------------------
// TEMPLATE REGISTRY (front-end preview / rules; independent of DB templates)
// ---------------------------------------------------------------------------
export const TEMPLATE_REGISTRY: Record<TemplateKind, TemplateAccount[]> = {
  BUSINESS: BUSINESS_CHART_OF_ACCOUNTS,
  PERSONAL: PERSONAL_CHART_OF_ACCOUNTS,
  RETAIL: RETAIL_COA,
  MANUFACTURING: MANUFACTURING_COA,
  SERVICES: SERVICES_COA,
  REAL_ESTATE: REAL_ESTATE_COA,
  HOSPITALITY: HOSPITALITY_COA,
};

export function getTemplateDefinition(kind: TemplateKind): TemplateAccount[] {
  return TEMPLATE_REGISTRY[kind];
}

// ---------------------------------------------------------------------------
// STEP 7 — HIGH LEVEL SETUP FLOW (selected kind)
// ✅ assign returns templateGroupId, then apply uses same id
// ---------------------------------------------------------------------------

