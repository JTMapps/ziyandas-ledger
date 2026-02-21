// scripts/seedAccountTemplates.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

// Import your COA arrays directly from your repo
import { BUSINESS_CHART_OF_ACCOUNTS } from "../src/domain/templates/business/businessChartOfAccounts";
import { PERSONAL_CHART_OF_ACCOUNTS } from "../src/domain/templates/personal/personalChartOfAccounts";

import { RETAIL_COA } from "../src/domain/templates/industry/retailChartOfAccounts";
import { MANUFACTURING_COA } from "../src/domain/templates/industry/manufacturingChartOfAccounts";
import { SERVICES_COA } from "../src/domain/templates/industry/servicesChartOfAccounts";
import { REAL_ESTATE_COA } from "../src/domain/templates/industry/realEstateChartOfAccounts";
import { HOSPITALITY_COA } from "../src/domain/templates/industry/hospitalityChartOfAccounts";

type EntityType = "Business" | "Personal";
type TemplateName =
  | "Business"
  | "Personal"
  | "Retail"
  | "Manufacturing"
  | "Services"
  | "Real Estate"
  | "Hospitality";

type TemplateAccount = {
  account_code: string;
  account_name: string;
  account_type: string; // event_effect_type in DB
  parent_code?: string;

  // Your TS templates already contain many of these (optional)
  level?: number;
  hierarchy_level?: number;

  statement_type?: string;
  statement_section?: string;
  statement_subsection?: string;

  cash_flow_category?: string;
  cash_flow_role?: string;
  tax_role?: string;

  tax_treatment?: string | null;
  ifrs_classification?: string | null;

  is_cash_account?: boolean;
  is_contra?: boolean;
  is_closing_account?: boolean;

  normal_balance?: "DEBIT" | "CREDIT";
  display_order?: number;

  statement_group?: string;

  // Any extra template metadata
  metadata?: Record<string, unknown>;
};

type GroupRow = {
  id: string;
  template_name: string;
  entity_type: EntityType;
};

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TEMPLATE_SOURCES: Array<{
  template_name: TemplateName;
  entity_type: EntityType;
  coa: TemplateAccount[];
}> = [
  { template_name: "Business", entity_type: "Business", coa: BUSINESS_CHART_OF_ACCOUNTS as any },
  { template_name: "Personal", entity_type: "Personal", coa: PERSONAL_CHART_OF_ACCOUNTS as any },

  { template_name: "Retail", entity_type: "Business", coa: RETAIL_COA as any },
  { template_name: "Manufacturing", entity_type: "Business", coa: MANUFACTURING_COA as any },
  { template_name: "Services", entity_type: "Business", coa: SERVICES_COA as any },
  { template_name: "Real Estate", entity_type: "Business", coa: REAL_ESTATE_COA as any },
  { template_name: "Hospitality", entity_type: "Business", coa: HOSPITALITY_COA as any },
];

// --- helpers ---
function normalizeBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function inferNormalBalance(account_type: string): "DEBIT" | "CREDIT" {
  // Matches your apply_template_to_entity fallback logic
  return account_type === "ASSET" || account_type === "EXPENSE" ? "DEBIT" : "CREDIT";
}

/**
 * Compute hierarchy_level from parent_code links.
 * If your TS arrays already provide `level`, we prefer that.
 */
function computeHierarchyLevels(coa: TemplateAccount[]): Map<string, number> {
  const byCode = new Map<string, TemplateAccount>();
  coa.forEach((a) => byCode.set(a.account_code, a));

  const memo = new Map<string, number>();

  const dfs = (code: string): number => {
    if (memo.has(code)) return memo.get(code)!;
    const node = byCode.get(code);
    if (!node) return 0;

    // Prefer explicit TS level if given
    const explicit =
      typeof node.level === "number"
        ? node.level
        : typeof node.hierarchy_level === "number"
          ? node.hierarchy_level
          : undefined;

    if (explicit !== undefined) {
      memo.set(code, explicit);
      return explicit;
    }

    const p = node.parent_code;
    if (!p) {
      memo.set(code, 0);
      return 0;
    }
    const lvl = dfs(p) + 1;
    memo.set(code, lvl);
    return lvl;
  };

  coa.forEach((a) => dfs(a.account_code));
  return memo;
}

async function getTemplateGroupId(template_name: string, entity_type: EntityType): Promise<string> {
  const { data, error } = await supabase
    .from("account_template_groups")
    .select("id, template_name, entity_type")
    .eq("template_name", template_name)
    .eq("entity_type", entity_type)
    .eq("is_active", true)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error(`No active template group found for ${template_name} / ${entity_type}`);
  return data.id as string;
}

async function upsertAccountTemplates(template_group_id: string, coa: TemplateAccount[]) {
  const levels = computeHierarchyLevels(coa);

  const rows = coa.map((a) => {
    const account_type = String(a.account_type).toUpperCase();

    return {
      template_group_id,

      account_code: a.account_code,
      account_name: a.account_name,
      account_type, // must match event_effect_type enum values

      // new columns you added
      parent_code: normalizeText(a.parent_code),
      hierarchy_level: levels.get(a.account_code) ?? 0,
      statement_type: normalizeText(a.statement_type),
      statement_section: normalizeText(a.statement_section),
      statement_subsection: normalizeText(a.statement_subsection),
      normal_balance: (a.normal_balance ?? inferNormalBalance(account_type)) as "DEBIT" | "CREDIT",
      is_contra: normalizeBool(a.is_contra, false),
      is_closing_account: normalizeBool(a.is_closing_account, false),
      cash_flow_category: normalizeText(a.cash_flow_category),
      display_order: typeof a.display_order === "number" ? a.display_order : null,
      statement_group: normalizeText(a.statement_group),
      cash_flow_role: normalizeText(a.cash_flow_role),
      tax_role: normalizeText(a.tax_role),

      // existing columns
      ifrs_classification: normalizeText(a.ifrs_classification),
      tax_treatment: normalizeText(a.tax_treatment),
      is_cash_account: normalizeBool(a.is_cash_account, false),
      metadata: a.metadata ?? {},
    };
  });

  // Upsert by unique(template_group_id, account_code)
  // If you prefer name uniqueness too, keep code as canonical key.
  const { error } = await supabase
    .from("account_templates")
    .upsert(rows, { onConflict: "template_group_id,account_code" });

  if (error) throw error;

  return rows.length;
}

async function countTemplates(template_group_id: string): Promise<number> {
  const { count, error } = await supabase
    .from("account_templates")
    .select("id", { count: "exact", head: true })
    .eq("template_group_id", template_group_id);

  if (error) throw error;
  return count ?? 0;
}

async function main() {
  console.log("Seeding account_templates from TS COA arrays…");

  for (const src of TEMPLATE_SOURCES) {
    const groupId = await getTemplateGroupId(src.template_name, src.entity_type);
    const before = await countTemplates(groupId);

    const inserted = await upsertAccountTemplates(groupId, src.coa);

    const after = await countTemplates(groupId);

    console.log(
      `✅ ${src.template_name} (${src.entity_type}) -> group ${groupId}\n   templates: ${before} -> ${after} (upserted ${inserted})`
    );
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});