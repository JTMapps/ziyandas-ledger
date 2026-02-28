SOFTWARE PROJECTS\\ZIYANDAS LEDGER\\SRC

│   index.css

│   main.tsx

│

├───assets

│       finance\_codex\_doc.docx

│       react.svg

│

├───components

│   │   EntitySwitcher.tsx

│   │

│   ├───events

│   │       JournalEntryModal.tsx

│   │

│   ├───industry

│   │       IndustryOperationHeader.tsx

│   │

│   ├───layout

│   │       DashboardLayout.tsx

│   │

│   ├───pickers

│   │       AccountPicker.tsx

│   │       EntityPicker.tsx

│   │

│   ├───statements

│   │       CashFlowIndirect.tsx

│   │       StatementRenderer.tsx

│   │       StatementSection.tsx

│   │

│   └───templates

│           BusinessTemplatePreview.tsx

│           IndustryHospitalityPreview.tsx

│           IndustryManufacturingPreview.tsx

│           IndustryRealEstatePreview.tsx

│           IndustryRetailPreview.tsx

│           IndustryServicesPreview.tsx

│           IndustryTemplatePreview.tsx

│           PersonalTemplatePreview.tsx

│

├───context

│       EntityContext.jsx

│

├───domain

│   ├───statements

│   │       labels.ts

│   │       statementTypes.ts

│   │       types.ts

│   │

│   └───templates

│       │   TemplateOrchestrator.ts

│       │

│       ├───business

│       │       businessCaptureRules.ts

│       │       businessChartOfAccounts.ts

│       │

│       ├───industry

│       │       hospitalityChartOfAccounts.ts

│       │       index.ts

│       │       industryCaptureRules.ts

│       │       manufacturingChartOfAccounts.ts

│       │       nonprofitChartOfAccounts.ts

│       │       realEstateChartOfAccounts.ts

│       │       retailChartOfAccounts.ts

│       │       servicesChartOfAccounts.ts

│       │

│       ├───personal

│       │       personalCaptureRules.ts

│       │       personalChartOfAccounts.ts

│       │

│       └───personalCapture

│               ExpenseWizard.tsx

│               SalaryWizard.tsx

│               TransferWizard.tsx

│

├───hooks

│       queryKeys.ts

│       useCompliance.ts

│       useEconomicEvents.ts

│       useKpis.ts

│       useReportingPeriods.ts

│       useStatements.ts

│       useTemplates.ts

│       useYearEnd.ts

│

├───lib

│       auth.ts

│       eventEmitter.ts

│       rpc.ts

│       supabase.ts

│

├───orchestrators

│       ComplianceOrchestrator.ts

│       EventOrchestrator.ts

│       StatementOrchestrator.ts

│       YearEndOrchestrator.ts

│

├───pages

│   │   App.tsx

│   │   AuthPage.tsx

│   │   EntityDashboard.tsx

│   │   EntityGate.tsx

│   │   ProfilePage.tsx

│   │

│   ├───dashboard

│   │       LedgerPage.tsx

│   │       OverviewPage.tsx

│   │       StatementsPage.tsx

│   │       TaxECLPage.tsx

│   │       YearEndPage.tsx

│   │

│   ├───entity

│   │       EntityCreatePage.tsx

│   │       EntityTemplateSetup.tsx

│   │

│   ├───industryCapture

│   │       HospitalityMealServiceWizard.tsx

│   │       HospitalityRoomSaleWizard.tsx

│   │       IndustryRouter.tsx

│   │       ManufacturingCompleteBatchWizard.tsx

│   │       ManufacturingConsumeRawMaterialsWizard.tsx

│   │       RealEstateMaintenanceWizard.tsx

│   │       RealEstateRentIncomeWizard.tsx

│   │       RetailPurchaseWizard.tsx

│   │       RetailSaleWizard.tsx

│   │       ServicesClientInvoiceWizard.tsx

│   │       ServicesPayContractorWizard.tsx

│   │

│   ├───personal

│   │       PersonalDashboard.tsx

│   │

│   └───tabs

│           BusinessTabs.ts

│           PersonalTabs.ts

│           types.ts

│

└───repositories

└───repositories

&nbsp;       entityRepository.ts

&nbsp;       eventRepository.ts



SOFTWARE PROJECTS\\ZIYANDAS LEDGER\\SCRIPTS\\
seedAccountTemplates.ts

// scripts/seedAccountTemplates.ts

import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";



// Import your COA arrays directly from your repo

import { BUSINESS\_CHART\_OF\_ACCOUNTS } from "../src/domain/templates/business/businessChartOfAccounts";

import { PERSONAL\_CHART\_OF\_ACCOUNTS } from "../src/domain/templates/personal/personalChartOfAccounts";



import { RETAIL\_COA } from "../src/domain/templates/industry/retailChartOfAccounts";

import { MANUFACTURING\_COA } from "../src/domain/templates/industry/manufacturingChartOfAccounts";

import { SERVICES\_COA } from "../src/domain/templates/industry/servicesChartOfAccounts";

import { REAL\_ESTATE\_COA } from "../src/domain/templates/industry/realEstateChartOfAccounts";

import { HOSPITALITY\_COA } from "../src/domain/templates/industry/hospitalityChartOfAccounts";



type EntityType = "Business" | "Personal";

type TemplateName =

&nbsp; | "Business"

&nbsp; | "Personal"

&nbsp; | "Retail"

&nbsp; | "Manufacturing"

&nbsp; | "Services"

&nbsp; | "Real Estate"

&nbsp; | "Hospitality";



type TemplateAccount = {

&nbsp; account\_code: string;

&nbsp; account\_name: string;

&nbsp; account\_type: string; // event\_effect\_type in DB

&nbsp; parent\_code?: string;



&nbsp; // Your TS templates already contain many of these (optional)

&nbsp; level?: number;

&nbsp; hierarchy\_level?: number;



&nbsp; statement\_type?: string;

&nbsp; statement\_section?: string;

&nbsp; statement\_subsection?: string;



&nbsp; cash\_flow\_category?: string;

&nbsp; cash\_flow\_role?: string;

&nbsp; tax\_role?: string;



&nbsp; tax\_treatment?: string | null;

&nbsp; ifrs\_classification?: string | null;



&nbsp; is\_cash\_account?: boolean;

&nbsp; is\_contra?: boolean;

&nbsp; is\_closing\_account?: boolean;



&nbsp; normal\_balance?: "DEBIT" | "CREDIT";

&nbsp; display\_order?: number;



&nbsp; statement\_group?: string;



&nbsp; // Any extra template metadata

&nbsp; metadata?: Record<string, unknown>;

};



type GroupRow = {

&nbsp; id: string;

&nbsp; template\_name: string;

&nbsp; entity\_type: EntityType;

};



const SUPABASE\_URL =

&nbsp; process.env.SUPABASE\_URL ||

&nbsp; process.env.VITE\_SUPABASE\_URL;

const SUPABASE\_SERVICE\_ROLE\_KEY = process.env.SUPABASE\_SERVICE\_ROLE\_KEY!;



if (!SUPABASE\_URL || !SUPABASE\_SERVICE\_ROLE\_KEY) {

&nbsp; throw new Error("Missing SUPABASE\_URL or SUPABASE\_SERVICE\_ROLE\_KEY in .env");

}



const supabase = createClient(SUPABASE\_URL, SUPABASE\_SERVICE\_ROLE\_KEY, {

&nbsp; auth: { persistSession: false },

});



const TEMPLATE\_SOURCES: Array<{

&nbsp; template\_name: TemplateName;

&nbsp; entity\_type: EntityType;

&nbsp; coa: TemplateAccount\[];

}> = \[

&nbsp; { template\_name: "Business", entity\_type: "Business", coa: BUSINESS\_CHART\_OF\_ACCOUNTS as any },

&nbsp; { template\_name: "Personal", entity\_type: "Personal", coa: PERSONAL\_CHART\_OF\_ACCOUNTS as any },



&nbsp; { template\_name: "Retail", entity\_type: "Business", coa: RETAIL\_COA as any },

&nbsp; { template\_name: "Manufacturing", entity\_type: "Business", coa: MANUFACTURING\_COA as any },

&nbsp; { template\_name: "Services", entity\_type: "Business", coa: SERVICES\_COA as any },

&nbsp; { template\_name: "Real Estate", entity\_type: "Business", coa: REAL\_ESTATE\_COA as any },

&nbsp; { template\_name: "Hospitality", entity\_type: "Business", coa: HOSPITALITY\_COA as any },

];



// --- helpers ---

function normalizeBool(v: unknown, fallback = false): boolean {

&nbsp; return typeof v === "boolean" ? v : fallback;

}



function normalizeText(v: unknown): string | null {

&nbsp; if (v === undefined || v === null) return null;

&nbsp; const s = String(v).trim();

&nbsp; return s.length ? s : null;

}



function inferNormalBalance(account\_type: string): "DEBIT" | "CREDIT" {

&nbsp; // Matches your apply\_template\_to\_entity fallback logic

&nbsp; return account\_type === "ASSET" || account\_type === "EXPENSE" ? "DEBIT" : "CREDIT";

}



/\*\*

&nbsp;\* Compute hierarchy\_level from parent\_code links.

&nbsp;\* If your TS arrays already provide `level`, we prefer that.

&nbsp;\*/

function computeHierarchyLevels(coa: TemplateAccount\[]): Map<string, number> {

&nbsp; const byCode = new Map<string, TemplateAccount>();

&nbsp; coa.forEach((a) => byCode.set(a.account\_code, a));



&nbsp; const memo = new Map<string, number>();



&nbsp; const dfs = (code: string): number => {

&nbsp;   if (memo.has(code)) return memo.get(code)!;

&nbsp;   const node = byCode.get(code);

&nbsp;   if (!node) return 0;



&nbsp;   // Prefer explicit TS level if given

&nbsp;   const explicit =

&nbsp;     typeof node.level === "number"

&nbsp;       ? node.level

&nbsp;       : typeof node.hierarchy\_level === "number"

&nbsp;         ? node.hierarchy\_level

&nbsp;         : undefined;



&nbsp;   if (explicit !== undefined) {

&nbsp;     memo.set(code, explicit);

&nbsp;     return explicit;

&nbsp;   }



&nbsp;   const p = node.parent\_code;

&nbsp;   if (!p) {

&nbsp;     memo.set(code, 0);

&nbsp;     return 0;

&nbsp;   }

&nbsp;   const lvl = dfs(p) + 1;

&nbsp;   memo.set(code, lvl);

&nbsp;   return lvl;

&nbsp; };



&nbsp; coa.forEach((a) => dfs(a.account\_code));

&nbsp; return memo;

}



async function getTemplateGroupId(template\_name: string, entity\_type: EntityType): Promise<string> {

&nbsp; const { data, error } = await supabase

&nbsp;   .from("account\_template\_groups")

&nbsp;   .select("id, template\_name, entity\_type")

&nbsp;   .eq("template\_name", template\_name)

&nbsp;   .eq("entity\_type", entity\_type)

&nbsp;   .eq("is\_active", true)

&nbsp;   .order("version\_number", { ascending: false })

&nbsp;   .limit(1)

&nbsp;   .single();



&nbsp; if (error) throw error;

&nbsp; if (!data?.id) throw new Error(`No active template group found for ${template\_name} / ${entity\_type}`);

&nbsp; return data.id as string;

}



async function upsertAccountTemplates(template\_group\_id: string, coa: TemplateAccount\[]) {

&nbsp; const levels = computeHierarchyLevels(coa);



&nbsp; const rows = coa.map((a) => {

&nbsp;   const account\_type = String(a.account\_type).toUpperCase();



&nbsp;   return {

&nbsp;     template\_group\_id,



&nbsp;     account\_code: a.account\_code,

&nbsp;     account\_name: a.account\_name,

&nbsp;     account\_type, // must match event\_effect\_type enum values



&nbsp;     // new columns you added

&nbsp;     parent\_code: normalizeText(a.parent\_code),

&nbsp;     hierarchy\_level: levels.get(a.account\_code) ?? 0,

&nbsp;     statement\_type: normalizeText(a.statement\_type),

&nbsp;     statement\_section: normalizeText(a.statement\_section),

&nbsp;     statement\_subsection: normalizeText(a.statement\_subsection),

&nbsp;     normal\_balance: (a.normal\_balance ?? inferNormalBalance(account\_type)) as "DEBIT" | "CREDIT",

&nbsp;     is\_contra: normalizeBool(a.is\_contra, false),

&nbsp;     is\_closing\_account: normalizeBool(a.is\_closing\_account, false),

&nbsp;     cash\_flow\_category: normalizeText(a.cash\_flow\_category),

&nbsp;     display\_order: typeof a.display\_order === "number" ? a.display\_order : null,

&nbsp;     statement\_group: normalizeText(a.statement\_group),

&nbsp;     cash\_flow\_role: normalizeText(a.cash\_flow\_role),

&nbsp;     tax\_role: normalizeText(a.tax\_role),



&nbsp;     // existing columns

&nbsp;     ifrs\_classification: normalizeText(a.ifrs\_classification),

&nbsp;     tax\_treatment: normalizeText(a.tax\_treatment),

&nbsp;     is\_cash\_account: normalizeBool(a.is\_cash\_account, false),

&nbsp;     metadata: a.metadata ?? {},

&nbsp;   };

&nbsp; });



&nbsp; // Upsert by unique(template\_group\_id, account\_code)

&nbsp; // If you prefer name uniqueness too, keep code as canonical key.

&nbsp; const { error } = await supabase

&nbsp;   .from("account\_templates")

&nbsp;   .upsert(rows, { onConflict: "template\_group\_id,account\_code" });



&nbsp; if (error) throw error;



&nbsp; return rows.length;

}



async function countTemplates(template\_group\_id: string): Promise<number> {

&nbsp; const { count, error } = await supabase

&nbsp;   .from("account\_templates")

&nbsp;   .select("id", { count: "exact", head: true })

&nbsp;   .eq("template\_group\_id", template\_group\_id);



&nbsp; if (error) throw error;

&nbsp; return count ?? 0;

}



async function main() {

&nbsp; console.log("Seeding account\_templates from TS COA arrays…");



&nbsp; for (const src of TEMPLATE\_SOURCES) {

&nbsp;   const groupId = await getTemplateGroupId(src.template\_name, src.entity\_type);

&nbsp;   const before = await countTemplates(groupId);



&nbsp;   const inserted = await upsertAccountTemplates(groupId, src.coa);



&nbsp;   const after = await countTemplates(groupId);



&nbsp;   console.log(

&nbsp;     `✅ ${src.template\_name} (${src.entity\_type}) -> group ${groupId}\\n   templates: ${before} -> ${after} (upserted ${inserted})`

&nbsp;   );

&nbsp; }



&nbsp; console.log("\\nDone.");

}



main().catch((e) => {

&nbsp; console.error("Seed failed:", e);

&nbsp; process.exit(1);

});

import { createContext, useContext, useEffect, useState } from 'react'

import { supabase } from '../lib/supabase'



const EntityContext = createContext()



export function EntityProvider({ children, entityId = null }) {

&nbsp; const \[entities, setEntities] = useState(\[])

&nbsp; const \[entity, setEntity] = useState(null)

&nbsp; const \[loading, setLoading] = useState(true)



&nbsp; useEffect(() => {

&nbsp;   loadEntities()

&nbsp; }, \[entityId])



&nbsp; async function loadEntities() {

&nbsp;   setLoading(true)



&nbsp;   const {

&nbsp;     data: { user },

&nbsp;   } = await supabase.auth.getUser()



&nbsp;   if (!user) {

&nbsp;     setLoading(false)

&nbsp;     return

&nbsp;   }



&nbsp;   const { data, error } = await supabase

&nbsp;     .from('entities')

&nbsp;     .select('\*')

&nbsp;     .eq('created\_by', user.id)

&nbsp;     .order('created\_at', { ascending: true })



&nbsp;   if (!error \&\& data.length > 0) {

&nbsp;     setEntities(data)

&nbsp;     

&nbsp;     // If entityId is provided, select that specific entity

&nbsp;     // Otherwise, default to first entity

&nbsp;     if (entityId) {

&nbsp;       const selectedEntity = data.find(e => e.id === entityId)

&nbsp;       setEntity(selectedEntity || data\[0])

&nbsp;     } else {

&nbsp;       setEntity(prev => prev ?? data\[0])

&nbsp;     }

&nbsp;   }



&nbsp;   setLoading(false)

&nbsp; }



&nbsp; function selectEntity(entityId) {

&nbsp;   const selected = entities.find(e => e.id === entityId)

&nbsp;   if (selected) {

&nbsp;     setEntity(selected)

&nbsp;   }

&nbsp; }



&nbsp; return (

&nbsp;   <EntityContext.Provider

&nbsp;     value={{

&nbsp;       entities,

&nbsp;       entity,

&nbsp;       setEntity: selectEntity,

&nbsp;       reloadEntities: loadEntities,

&nbsp;       loading,

&nbsp;     }}

&nbsp;   >

&nbsp;     {children}

&nbsp;   </EntityContext.Provider>

&nbsp; )

}



export function useEntity() {

&nbsp; const context = useContext(EntityContext)

&nbsp; if (!context) {

&nbsp;   throw new Error('useEntity must be used within EntityProvider')

&nbsp; }

&nbsp; return context

}



// src/domain/statements/labels.ts

import type { DbStatementType } from "./statementTypes";



export const DB\_STATEMENT\_LABEL: Record<DbStatementType, string> = {

&nbsp; STATEMENT\_OF\_FINANCIAL\_POSITION: "Statement of Financial Position",

&nbsp; PROFIT\_OR\_LOSS: "Profit or Loss",

&nbsp; OTHER\_COMPREHENSIVE\_INCOME: "Other Comprehensive Income",

&nbsp; CASH\_FLOW: "Cash Flow",

&nbsp; EQUITY: "Statement of Changes in Equity",

};



// src/domain/statements/statementTypes.ts

export type DbStatementType =

&nbsp; | "STATEMENT\_OF\_FINANCIAL\_POSITION"

&nbsp; | "PROFIT\_OR\_LOSS"

&nbsp; | "OTHER\_COMPREHENSIVE\_INCOME"

&nbsp; | "CASH\_FLOW"

&nbsp; | "EQUITY";



export type UiStatementType = "SOFP" | "P\&L" | "OCI" | "CF" | "EQUITY";



export const STATEMENT\_TYPE\_MAP: Record<UiStatementType, DbStatementType> = {

&nbsp; SOFP: "STATEMENT\_OF\_FINANCIAL\_POSITION",

&nbsp; "P\&L": "PROFIT\_OR\_LOSS",

&nbsp; OCI: "OTHER\_COMPREHENSIVE\_INCOME",

&nbsp; CF: "CASH\_FLOW",

&nbsp; EQUITY: "EQUITY",

};



export const UI\_STATEMENT\_TYPES: UiStatementType\[] = \["SOFP", "P\&L", "OCI", "CF"];



export const UI\_STATEMENT\_LABEL: Record<UiStatementType, string> = {

&nbsp; SOFP: "Statement of Financial Position",

&nbsp; "P\&L": "Profit or Loss",

&nbsp; OCI: "Other Comprehensive Income",

&nbsp; CF: "Cash Flow",

&nbsp; EQUITY: "Statement of Changes in Equity",

};


// src/domain/statements/types.ts

import type { DbStatementType } from "./statementTypes";



export type RenderedStatementLine = {

&nbsp; account\_id: string | null;

&nbsp; code: string;

&nbsp; name: string;

&nbsp; level: number;

&nbsp; amount: number | null;

&nbsp; order: number;

};



export type RenderedStatement = {

&nbsp; entity\_id: string;

&nbsp; period\_id: string;

&nbsp; statement\_type: DbStatementType; // recommended: pass DB tokens, so it returns DB tokens

&nbsp; lines: RenderedStatementLine\[] | null; // json\_agg can be null

};





export type EntitySnapshotRow = {

&nbsp; label: string;

&nbsp; value: number; // we normalize to number in the hook

};



export type EntitySnapshot = {

&nbsp; netIncome: number;

&nbsp; cashBalance: number;

&nbsp; totalAssets: number;

&nbsp; totalLiabilities: number;

&nbsp; retainedEarnings: number;

};






import { AppliedAccount } from "./businessChartOfAccounts";



// ------------------------------------------------------------

// Helper

// ------------------------------------------------------------

function findAccount(accounts: AppliedAccount\[], code: string): AppliedAccount {

&nbsp; const acc = accounts.find(a => a.account\_code === code);

&nbsp; if (!acc) throw new Error(`Account ${code} not found`);

&nbsp; return acc;

}



export interface BusinessCaptureInput {

&nbsp; amount: number;

&nbsp; description?: string;

}



// ------------------------------------------------------------

// BUSINESS CAPTURE RULES (convert business operations → journals)

// ------------------------------------------------------------



export const BusinessCaptureRules = {

&nbsp; revenue(accounts: AppliedAccount\[], input: BusinessCaptureInput) {

&nbsp;   const cash = findAccount(accounts, "1100");

&nbsp;   const revenue = findAccount(accounts, "4000");



&nbsp;   return {

&nbsp;     eventType: "BUSINESS\_REVENUE",

&nbsp;     description: input.description ?? "Revenue recognised",

&nbsp;     effects: \[

&nbsp;       { account\_id: cash.id, amount: input.amount, effect\_sign: 1 },

&nbsp;       { account\_id: revenue.id, amount: input.amount, effect\_sign: -1 }

&nbsp;     ]

&nbsp;   };

&nbsp; },



&nbsp; expense(accounts: AppliedAccount\[], input: BusinessCaptureInput) {

&nbsp;   const expense = findAccount(accounts, "6000");

&nbsp;   const cash = findAccount(accounts, "1100");



&nbsp;   return {

&nbsp;     eventType: "BUSINESS\_EXPENSE",

&nbsp;     description: input.description ?? "Operating expense",

&nbsp;     effects: \[

&nbsp;       { account\_id: expense.id, amount: input.amount, effect\_sign: 1 },

&nbsp;       { account\_id: cash.id, amount: input.amount, effect\_sign: -1 }

&nbsp;     ]

&nbsp;   };

&nbsp; }

};




// ------------------------------------------------------------

// BUSINESS TEMPLATE – IFRS COMPLIANT CHART OF ACCOUNTS

// ------------------------------------------------------------



export interface TemplateAccount {

&nbsp; account\_code: string;

&nbsp; account\_name: string;

&nbsp; account\_type: string;             // ASSET / LIABILITY / EQUITY / INCOME / EXPENSE

&nbsp; parent\_code?: string;

&nbsp; statement\_type?: string;



&nbsp; statement\_section?: string;

&nbsp; statement\_subsection?: string;



&nbsp;   // NEW: template hierarchy

&nbsp; level?: number;



&nbsp; cash\_flow\_category?: string;

&nbsp; tax\_treatment?: string | null;

&nbsp; is\_contra?: boolean;

&nbsp; is\_cash\_account?: boolean;

&nbsp; normal\_balance?: "DEBIT" | "CREDIT";

&nbsp; display\_order?: number;

}



export interface AppliedAccount {

&nbsp; id: string;                       // ← DB ID after template applied

&nbsp; account\_code: string;

&nbsp; account\_name: string;

&nbsp; account\_type: string;

&nbsp; parent\_account\_id?: string | null;

&nbsp; statement\_type?: string;

&nbsp; statement\_section?: string;

&nbsp; statement\_subsection?: string;

&nbsp; cash\_flow\_category?: string;

&nbsp; tax\_treatment?: string | null;

&nbsp; is\_contra?: boolean;

&nbsp; is\_cash\_account?: boolean;

&nbsp; normal\_balance?: "DEBIT" | "CREDIT";

&nbsp; display\_order?: number;

}



// ------------------------------------------------------------

// FULL IFRS BUSINESS COA (simplified but enterprise-ready)

// ------------------------------------------------------------



export const BUSINESS\_CHART\_OF\_ACCOUNTS: TemplateAccount\[] = \[

&nbsp; // -------------------------- ASSETS --------------------------

&nbsp; {

&nbsp;   account\_code: "1000",

&nbsp;   account\_name: "Assets",

&nbsp;   account\_type: "ASSET",

&nbsp;   statement\_type: "STATEMENT\_OF\_FINANCIAL\_POSITION",

&nbsp;   statement\_section: "ASSETS",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1000

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1100",

&nbsp;   account\_name: "Cash \& Cash Equivalents",

&nbsp;   parent\_code: "1000",

&nbsp;   account\_type: "ASSET",

&nbsp;   statement\_section: "ASSETS",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   is\_cash\_account: true,

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1100

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1200",

&nbsp;   account\_name: "Trade Receivables",

&nbsp;   parent\_code: "1000",

&nbsp;   account\_type: "ASSET",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1200

&nbsp; },

&nbsp; // ---------------------- LIABILITIES ------------------------

&nbsp; {

&nbsp;   account\_code: "2000",

&nbsp;   account\_name: "Liabilities",

&nbsp;   account\_type: "LIABILITY",

&nbsp;   statement\_section: "LIABILITIES",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 2000

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "2100",

&nbsp;   account\_name: "Trade Payables",

&nbsp;   parent\_code: "2000",

&nbsp;   account\_type: "LIABILITY",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 2100

&nbsp; },

&nbsp; // ------------------------ EQUITY ---------------------------

&nbsp; {

&nbsp;   account\_code: "3000",

&nbsp;   account\_name: "Equity",

&nbsp;   account\_type: "EQUITY",

&nbsp;   statement\_section: "EQUITY",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 3000

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "3100",

&nbsp;   account\_name: "Retained Earnings",

&nbsp;   parent\_code: "3000",

&nbsp;   account\_type: "EQUITY",

&nbsp;   statement\_section: "EQUITY",

&nbsp;   cash\_flow\_category: "NON\_CASH",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 3100

&nbsp; },

&nbsp; // ------------------------ INCOME ---------------------------

&nbsp; {

&nbsp;   account\_code: "4000",

&nbsp;   account\_name: "Revenue",

&nbsp;   account\_type: "INCOME",

&nbsp;   statement\_type: "PROFIT\_OR\_LOSS",

&nbsp;   statement\_section: "INCOME",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 4000

&nbsp; },

&nbsp; // ----------------------- EXPENSES --------------------------

&nbsp; {

&nbsp;   account\_code: "5000",

&nbsp;   account\_name: "Cost of Sales",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_type: "PROFIT\_OR\_LOSS",

&nbsp;   statement\_section: "EXPENSES",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5000

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "6000",

&nbsp;   account\_name: "Operating Expenses",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_type: "PROFIT\_OR\_LOSS",

&nbsp;   statement\_section: "EXPENSES",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 6000

&nbsp; }

];





import { TemplateAccount } from "../business/businessChartOfAccounts";



export const HOSPITALITY\_COA: TemplateAccount\[] = \[

&nbsp; // ASSETS

&nbsp; {

&nbsp;   account\_code: "1000",

&nbsp;   account\_name: "Assets",

&nbsp;   account\_type: "ASSET",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1100",

&nbsp;   account\_name: "Cash",

&nbsp;   account\_type: "ASSET",

&nbsp;   parent\_code: "1000",

&nbsp;   is\_cash\_account: true,

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1100,

&nbsp; },



&nbsp; // INCOME

&nbsp; {

&nbsp;   account\_code: "4000",

&nbsp;   account\_name: "Room Revenue",

&nbsp;   account\_type: "INCOME",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 4000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "4100",

&nbsp;   account\_name: "Food \& Beverage Revenue",

&nbsp;   account\_type: "INCOME",

&nbsp;   parent\_code: "4000",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 4100,

&nbsp; },



&nbsp; // EXPENSES

&nbsp; {

&nbsp;   account\_code: "5000",

&nbsp;   account\_name: "Housekeeping Costs",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "5100",

&nbsp;   account\_name: "Food \& Beverage Costs",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5100,

&nbsp; },

];



export { RETAIL\_COA } from "./retailChartOfAccounts";

export { MANUFACTURING\_COA } from "./manufacturingChartOfAccounts";

export { SERVICES\_COA } from "./servicesChartOfAccounts";

export { REAL\_ESTATE\_COA } from "./realEstateChartOfAccounts";

export { HOSPITALITY\_COA } from "./hospitalityChartOfAccounts";



export type IndustryTemplateKind =

&nbsp; | "RETAIL"

&nbsp; | "MANUFACTURING"

&nbsp; | "SERVICES"

&nbsp; | "REAL\_ESTATE"

&nbsp; | "HOSPITALITY";



// ------------------------------------------------------------

// INDUSTRY CAPTURE RULES

// Each industry converts business actions → double-entry journal

// ------------------------------------------------------------



import { AppliedAccount } from "../business/businessChartOfAccounts";



function findAccount(accounts: AppliedAccount\[], code: string) {

&nbsp; const acc = accounts.find(a => a.account\_code === code);

&nbsp; if (!acc) throw new Error(`Account not found: ${code}`);

&nbsp; return acc.id;

}



export const IndustryCaptureRules = {

&nbsp; // ------------------------------------------------------------

&nbsp; // RETAIL

&nbsp; // ------------------------------------------------------------

&nbsp; retail: {

&nbsp;   sale: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Retail Sale" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const cash = findAccount(accounts, "1100");

&nbsp;     const revenue = findAccount(accounts, "4000");



&nbsp;     return {

&nbsp;       eventType: "RETAIL\_SALE",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: cash, amount, effect\_sign: 1 },

&nbsp;         { account\_id: revenue, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },



&nbsp;   purchaseInventory: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Inventory Purchase" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const inventory = findAccount(accounts, "1200");

&nbsp;     const cash = findAccount(accounts, "1100");



&nbsp;     return {

&nbsp;       eventType: "RETAIL\_INVENTORY\_PURCHASE",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: inventory, amount, effect\_sign: 1 },

&nbsp;         { account\_id: cash, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },

&nbsp; },



&nbsp; // ------------------------------------------------------------

&nbsp; // MANUFACTURING

&nbsp; // ------------------------------------------------------------

&nbsp; manufacturing: {

&nbsp;   consumeRawMaterials: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Consume Raw Materials" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const raw = findAccount(accounts, "1200");

&nbsp;     const wip = findAccount(accounts, "1210");



&nbsp;     return {

&nbsp;       eventType: "MANUFACTURING\_WIP\_CONSUMPTION",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: wip, amount, effect\_sign: 1 },

&nbsp;         { account\_id: raw, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },



&nbsp;   completeProductionBatch: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Production Completed" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const wip = findAccount(accounts, "1210");

&nbsp;     const finished = findAccount(accounts, "1220");



&nbsp;     return {

&nbsp;       eventType: "MANUFACTURING\_FINISHED\_GOODS",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: finished, amount, effect\_sign: 1 },

&nbsp;         { account\_id: wip, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },

&nbsp; },



&nbsp; // ------------------------------------------------------------

&nbsp; // SERVICES

&nbsp; // ------------------------------------------------------------

&nbsp; services: {

&nbsp;   clientInvoice: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Service Revenue" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const receivable = findAccount(accounts, "1200");

&nbsp;     const revenue = findAccount(accounts, "4000");



&nbsp;     return {

&nbsp;       eventType: "SERVICE\_REVENUE",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: receivable, amount, effect\_sign: 1 },

&nbsp;         { account\_id: revenue, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },



&nbsp;   payContractor: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Contractor Expense" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const contractor = findAccount(accounts, "5000");

&nbsp;     const cash = findAccount(accounts, "1100");



&nbsp;     return {

&nbsp;       eventType: "SERVICE\_CONTRACTOR\_EXPENSE",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: contractor, amount, effect\_sign: 1 },

&nbsp;         { account\_id: cash, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },

&nbsp; },



&nbsp; // ------------------------------------------------------------

&nbsp; // HOSPITALITY

&nbsp; // ------------------------------------------------------------

&nbsp; hospitality: {

&nbsp;   roomSale: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Room Sale" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const cash = findAccount(accounts, "1100");

&nbsp;     const revenue = findAccount(accounts, "4000");



&nbsp;     return {

&nbsp;       eventType: "HOSPITALITY\_ROOM\_SALE",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: cash, amount, effect\_sign: 1 },

&nbsp;         { account\_id: revenue, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },



&nbsp;   serviceMeal: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Meal Sale" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const cash = findAccount(accounts, "1100");

&nbsp;     const fnbRevenue = findAccount(accounts, "4100");



&nbsp;     return {

&nbsp;       eventType: "HOSPITALITY\_MEAL\_SALE",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: cash, amount, effect\_sign: 1 },

&nbsp;         { account\_id: fnbRevenue, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },

&nbsp; },



&nbsp; // ------------------------------------------------------------

&nbsp; // REAL ESTATE

&nbsp; // ------------------------------------------------------------

&nbsp; realEstate: {

&nbsp;   rentIncome: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Rent Income" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const cash = findAccount(accounts, "1100");

&nbsp;     const rentIncome = findAccount(accounts, "4000");



&nbsp;     return {

&nbsp;       eventType: "REAL\_ESTATE\_RENT\_INCOME",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: cash, amount, effect\_sign: 1 },

&nbsp;         { account\_id: rentIncome, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },



&nbsp;   maintenanceExpense: (

&nbsp;     accounts: AppliedAccount\[],

&nbsp;     { amount, description = "Maintenance Expense" }: { amount: number; description?: string }

&nbsp;   ) => {

&nbsp;     const expense = findAccount(accounts, "5000");

&nbsp;     const cash = findAccount(accounts, "1100");



&nbsp;     return {

&nbsp;       eventType: "REAL\_ESTATE\_MAINTENANCE\_EXPENSE",

&nbsp;       description,

&nbsp;       effects: \[

&nbsp;         { account\_id: expense, amount, effect\_sign: 1 },

&nbsp;         { account\_id: cash, amount, effect\_sign: -1 },

&nbsp;       ],

&nbsp;     };

&nbsp;   },

&nbsp; },

};



import { TemplateAccount } from "../business/businessChartOfAccounts";



export const MANUFACTURING\_COA: TemplateAccount\[] = \[

&nbsp; // -------------------------- ASSETS --------------------------

&nbsp; {

&nbsp;   account\_code: "1000",

&nbsp;   account\_name: "Assets",

&nbsp;   account\_type: "ASSET",

&nbsp;   statement\_section: "ASSETS",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1100",

&nbsp;   account\_name: "Cash",

&nbsp;   account\_type: "ASSET",

&nbsp;   is\_cash\_account: true,

&nbsp;   parent\_code: "1000",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1100,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1200",

&nbsp;   account\_name: "Raw Materials",

&nbsp;   account\_type: "ASSET",

&nbsp;   parent\_code: "1000",

&nbsp;   statement\_section: "INVENTORY",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1200,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1210",

&nbsp;   account\_name: "Work In Progress (WIP)",

&nbsp;   account\_type: "ASSET",

&nbsp;   parent\_code: "1000",

&nbsp;   statement\_section: "INVENTORY",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1210,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1220",

&nbsp;   account\_name: "Finished Goods",

&nbsp;   account\_type: "ASSET",

&nbsp;   parent\_code: "1000",

&nbsp;   statement\_section: "INVENTORY",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1220,

&nbsp; },



&nbsp; // -------------------------- LIABILITIES --------------------------

&nbsp; {

&nbsp;   account\_code: "2000",

&nbsp;   account\_name: "Liabilities",

&nbsp;   account\_type: "LIABILITY",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 2000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "2100",

&nbsp;   account\_name: "Accounts Payable",

&nbsp;   parent\_code: "2000",

&nbsp;   account\_type: "LIABILITY",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   display\_order: 2100,

&nbsp; },



&nbsp; // -------------------------- EQUITY --------------------------

&nbsp; {

&nbsp;   account\_code: "3000",

&nbsp;   account\_name: "Equity",

&nbsp;   account\_type: "EQUITY",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 3000,

&nbsp; },



&nbsp; // -------------------------- INCOME --------------------------

&nbsp; {

&nbsp;   account\_code: "4000",

&nbsp;   account\_name: "Sales Revenue",

&nbsp;   account\_type: "INCOME",

&nbsp;   statement\_section: "REVENUE",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 4000,

&nbsp; },



&nbsp; // -------------------------- EXPENSES --------------------------

&nbsp; {

&nbsp;   account\_code: "5000",

&nbsp;   account\_name: "Cost of Raw Materials",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_section: "COGS",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "5100",

&nbsp;   account\_name: "Direct Labor",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_section: "COGS",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5100,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "5200",

&nbsp;   account\_name: "Factory Overheads",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_section: "COGS",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5200,

&nbsp; },

];




nonprofitChartOfAccounts.ts currently empty.

import { TemplateAccount } from "../business/businessChartOfAccounts";



export const REAL\_ESTATE\_COA: TemplateAccount\[] = \[

&nbsp; // ASSETS

&nbsp; {

&nbsp;   account\_code: "1000",

&nbsp;   account\_name: "Assets",

&nbsp;   account\_type: "ASSET",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1100",

&nbsp;   account\_name: "Cash",

&nbsp;   parent\_code: "1000",

&nbsp;   account\_type: "ASSET",

&nbsp;   is\_cash\_account: true,

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1100,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1200",

&nbsp;   account\_name: "Investment Property",

&nbsp;   parent\_code: "1000",

&nbsp;   account\_type: "ASSET",

&nbsp;   statement\_section: "NON\_CURRENT\_ASSETS",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1200,

&nbsp; },



&nbsp; // INCOME

&nbsp; {

&nbsp;   account\_code: "4000",

&nbsp;   account\_name: "Rental Income",

&nbsp;   account\_type: "INCOME",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 4000,

&nbsp; },



&nbsp; // EXPENSES

&nbsp; {

&nbsp;   account\_code: "5000",

&nbsp;   account\_name: "Property Maintenance",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "5100",

&nbsp;   account\_name: "Municipal Costs",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5100,

&nbsp; },

];



import { TemplateAccount } from "../business/businessChartOfAccounts";



export const RETAIL\_COA: TemplateAccount\[] = \[

&nbsp; // -------------------------- ASSETS --------------------------

&nbsp; {

&nbsp;   account\_code: "1000",

&nbsp;   account\_name: "Assets",

&nbsp;   account\_type: "ASSET",

&nbsp;   statement\_section: "ASSETS",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1100",

&nbsp;   account\_name: "Cash \& Cash Equivalents",

&nbsp;   account\_type: "ASSET",

&nbsp;   parent\_code: "1000",

&nbsp;   is\_cash\_account: true,

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1100,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1200",

&nbsp;   account\_name: "Inventory",

&nbsp;   account\_type: "ASSET",

&nbsp;   parent\_code: "1000",

&nbsp;   statement\_section: "INVENTORY",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1200,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1300",

&nbsp;   account\_name: "Accounts Receivable",

&nbsp;   account\_type: "ASSET",

&nbsp;   parent\_code: "1000",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1300,

&nbsp; },



&nbsp; // -------------------------- LIABILITIES --------------------------

&nbsp; {

&nbsp;   account\_code: "2000",

&nbsp;   account\_name: "Liabilities",

&nbsp;   account\_type: "LIABILITY",

&nbsp;   statement\_section: "LIABILITIES",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 2000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "2100",

&nbsp;   account\_name: "Accounts Payable",

&nbsp;   parent\_code: "2000",

&nbsp;   account\_type: "LIABILITY",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 2100,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "2200",

&nbsp;   account\_name: "Deferred Revenue",

&nbsp;   parent\_code: "2000",

&nbsp;   account\_type: "LIABILITY",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 2200,

&nbsp; },



&nbsp; // -------------------------- EQUITY --------------------------

&nbsp; {

&nbsp;   account\_code: "3000",

&nbsp;   account\_name: "Equity",

&nbsp;   account\_type: "EQUITY",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 3000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "3100",

&nbsp;   account\_name: "Retained Earnings",

&nbsp;   parent\_code: "3000",

&nbsp;   account\_type: "EQUITY",

&nbsp;   cash\_flow\_category: "NON\_CASH",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 3100,

&nbsp; },



&nbsp; // -------------------------- INCOME --------------------------

&nbsp; {

&nbsp;   account\_code: "4000",

&nbsp;   account\_name: "Sales Revenue",

&nbsp;   account\_type: "INCOME",

&nbsp;   statement\_type: "PROFIT\_OR\_LOSS",

&nbsp;   statement\_section: "REVENUE",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 4000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "4100",

&nbsp;   account\_name: "Online Sales Revenue",

&nbsp;   account\_type: "INCOME",

&nbsp;   parent\_code: "4000",

&nbsp;   statement\_section: "REVENUE",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 4100,

&nbsp; },



&nbsp; // -------------------------- EXPENSES --------------------------

&nbsp; {

&nbsp;   account\_code: "5000",

&nbsp;   account\_name: "Cost of Goods Sold",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_section: "COGS",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "5100",

&nbsp;   account\_name: "Store Operating Expenses",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_section: "EXPENSES",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5100,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "5200",

&nbsp;   account\_name: "Marketing Expense",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_section: "EXPENSES",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5200,

&nbsp; },

];



import { TemplateAccount } from "../business/businessChartOfAccounts";



export const SERVICES\_COA: TemplateAccount\[] = \[

&nbsp; {

&nbsp;   account\_code: "1000",

&nbsp;   account\_name: "Assets",

&nbsp;   account\_type: "ASSET",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 1000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1100",

&nbsp;   account\_name: "Cash",

&nbsp;   parent\_code: "1000",

&nbsp;   account\_type: "ASSET",

&nbsp;   is\_cash\_account: true,

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   display\_order: 1100,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "1200",

&nbsp;   account\_name: "Accounts Receivable",

&nbsp;   parent\_code: "1000",

&nbsp;   account\_type: "ASSET",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   display\_order: 1200,

&nbsp; },



&nbsp; // INCOME

&nbsp; {

&nbsp;   account\_code: "4000",

&nbsp;   account\_name: "Service Revenue",

&nbsp;   account\_type: "INCOME",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 4000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "4100",

&nbsp;   account\_name: "Consulting Revenue",

&nbsp;   parent\_code: "4000",

&nbsp;   account\_type: "INCOME",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 4100,

&nbsp; },



&nbsp; // EXPENSES

&nbsp; {

&nbsp;   account\_code: "5000",

&nbsp;   account\_name: "Contractor Fees",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5000,

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "5100",

&nbsp;   account\_name: "Software Subscriptions",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 5100,

&nbsp; },

];



import { AppliedAccount } from "./personalChartOfAccounts";



// ------------------------------------------------------------

// Helper

// ------------------------------------------------------------

function findAccount(accounts: AppliedAccount\[], code: string): AppliedAccount {

&nbsp; const acc = accounts.find(a => a.account\_code === code);

&nbsp; if (!acc) throw new Error(`Account ${code} not found`);

&nbsp; return acc;

}



// ------------------------------------------------------------

// PERSONAL CAPTURE INPUT TYPES

// ------------------------------------------------------------

export interface SalaryInput {

&nbsp; amount: number;

&nbsp; source?: string;

}



export interface ExpenseInput {

&nbsp; amount: number;

&nbsp; category?: string;

}



export interface TransferInput {

&nbsp; amount: number;

&nbsp; from\_code: string;

&nbsp; to\_code: string;

}



// ------------------------------------------------------------

// PERSONAL CAPTURE RULES (automatic journals)

// ------------------------------------------------------------



export const PersonalCaptureRules = {

&nbsp; salary(accounts: AppliedAccount\[], input: SalaryInput) {

&nbsp;   const cash = findAccount(accounts, "100");

&nbsp;   const income = findAccount(accounts, "400");



&nbsp;   return {

&nbsp;     eventType: "PERSONAL\_SALARY",

&nbsp;     description: input.source ?? "Salary",

&nbsp;     effects: \[

&nbsp;       { account\_id: cash.id, amount: input.amount, effect\_sign: 1 },

&nbsp;       { account\_id: income.id, amount: input.amount, effect\_sign: -1 }

&nbsp;     ]

&nbsp;   };

&nbsp; },



&nbsp; expense(accounts: AppliedAccount\[], input: ExpenseInput) {

&nbsp;   const cash = findAccount(accounts, "100");

&nbsp;   const expense = findAccount(accounts, "500");



&nbsp;   return {

&nbsp;     eventType: "PERSONAL\_EXPENSE",

&nbsp;     description: input.category ?? "Expense",

&nbsp;     effects: \[

&nbsp;       { account\_id: expense.id, amount: input.amount, effect\_sign: 1 },

&nbsp;       { account\_id: cash.id, amount: input.amount, effect\_sign: -1 }

&nbsp;     ]

&nbsp;   };

&nbsp; },



&nbsp; transfer(accounts: AppliedAccount\[], input: TransferInput) {

&nbsp;   const from = findAccount(accounts, input.from\_code);

&nbsp;   const to = findAccount(accounts, input.to\_code);



&nbsp;   return {

&nbsp;     eventType: "PERSONAL\_TRANSFER",

&nbsp;     description: "Internal transfer",

&nbsp;     effects: \[

&nbsp;       { account\_id: to.id, amount: input.amount, effect\_sign: 1 },

&nbsp;       { account\_id: from.id, amount: input.amount, effect\_sign: -1 }

&nbsp;     ]

&nbsp;   };

&nbsp; }

};



// ------------------------------------------------------------

// PERSONAL FINANCE TEMPLATE – SIMPLE + AUTOMATIC JOURNAL RULES

// ------------------------------------------------------------



export interface TemplateAccount {

&nbsp; account\_code: string;

&nbsp; account\_name: string;

&nbsp; account\_type: string;

&nbsp; 

&nbsp; level?: number;

&nbsp; parent\_code?: string;



&nbsp; statement\_type?: string;

&nbsp; statement\_section?: string;

&nbsp; 

&nbsp; cash\_flow\_category?: string;

&nbsp; normal\_balance?: "DEBIT" | "CREDIT";

&nbsp; display\_order?: number;

}



export interface AppliedAccount {

&nbsp; id: string;

&nbsp; account\_code: string;

&nbsp; account\_name: string;

&nbsp; account\_type: string;

&nbsp; parent\_account\_id?: string | null;

&nbsp; statement\_type?: string;

&nbsp; statement\_section?: string;

&nbsp; cash\_flow\_category?: string;

&nbsp; normal\_balance?: "DEBIT" | "CREDIT";

&nbsp; display\_order?: number;

}



// ------------------------------------------------------------

// SIMPLE PERSONAL COA

// ------------------------------------------------------------



export const PERSONAL\_CHART\_OF\_ACCOUNTS: TemplateAccount\[] = \[

&nbsp; // -------------------------- ASSETS --------------------------

&nbsp; {

&nbsp;   account\_code: "100",

&nbsp;   account\_name: "Cash",

&nbsp;   account\_type: "ASSET",

&nbsp;   statement\_section: "ASSETS",

&nbsp;   cash\_flow\_category: "OPERATING",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 100

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "110",

&nbsp;   account\_name: "Savings",

&nbsp;   account\_type: "ASSET",

&nbsp;   statement\_section: "ASSETS",

&nbsp;   cash\_flow\_category: "INVESTING",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 110

&nbsp; },

&nbsp; // ------------------------ INCOME ---------------------------

&nbsp; {

&nbsp;   account\_code: "400",

&nbsp;   account\_name: "Salary Income",

&nbsp;   account\_type: "INCOME",

&nbsp;   statement\_section: "INCOME",

&nbsp;   normal\_balance: "CREDIT",

&nbsp;   display\_order: 400

&nbsp; },

&nbsp; // ----------------------- EXPENSES --------------------------

&nbsp; {

&nbsp;   account\_code: "500",

&nbsp;   account\_name: "Living Expenses",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_section: "EXPENSES",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 500

&nbsp; },

&nbsp; {

&nbsp;   account\_code: "510",

&nbsp;   account\_name: "Transport Expenses",

&nbsp;   account\_type: "EXPENSE",

&nbsp;   statement\_section: "EXPENSES",

&nbsp;   normal\_balance: "DEBIT",

&nbsp;   display\_order: 510

&nbsp; }

];



// src/domain/templates/personalCapture/ExpenseWizard.tsx



import { useState, useEffect } from "react";

import { loadAppliedAccounts } from "../TemplateOrchestrator";

import { TemplateJournalEngine } from "../TemplateOrchestrator";



interface Props {

&nbsp; entityId: string;

&nbsp; onClose: () => void;

}



export default function ExpenseWizard({ entityId, onClose }: Props) {

&nbsp; const \[accounts, setAccounts] = useState<any\[]>(\[]);

&nbsp; const \[amount, setAmount] = useState(0);

&nbsp; const \[category, setCategory] = useState<string>("");

&nbsp; const \[loading, setLoading] = useState(false);

&nbsp; const \[error, setError] = useState<string | null>(null);



&nbsp; useEffect(() => {

&nbsp;   loadAppliedAccounts(entityId).then((data) => {

&nbsp;     const expenseAccounts = data.filter(

&nbsp;       (a) => a.account\_type === "EXPENSE"

&nbsp;     );

&nbsp;     setAccounts(expenseAccounts);

&nbsp;   });

&nbsp; }, \[entityId]);



&nbsp; async function submit() {

&nbsp;   try {

&nbsp;     setError(null);

&nbsp;     setLoading(true);



&nbsp;     if (!category) throw new Error("Choose an expense category.");

&nbsp;     if (amount <= 0) throw new Error("Amount must be positive.");



&nbsp;     await TemplateJournalEngine.personal.expense(entityId, amount, category);



&nbsp;     onClose();

&nbsp;   } catch (err: any) {

&nbsp;     setError(err.message);

&nbsp;   } finally {

&nbsp;     setLoading(false);

&nbsp;   }

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-4 space-y-4">

&nbsp;     <h2 className="text-lg font-bold">Record Expense</h2>



&nbsp;     <input

&nbsp;       type="number"

&nbsp;       className="border p-2 w-full rounded"

&nbsp;       placeholder="Amount spent"

&nbsp;       value={amount}

&nbsp;       onChange={(e) => setAmount(Number(e.target.value))}

&nbsp;     />



&nbsp;     <select

&nbsp;       className="border p-2 w-full rounded"

&nbsp;       value={category}

&nbsp;       onChange={(e) => setCategory(e.target.value)}

&nbsp;     >

&nbsp;       <option value="">Select expense category…</option>

&nbsp;       {accounts.map((a) => (

&nbsp;         <option key={a.id} value={a.account\_code}>

&nbsp;           {a.account\_name}

&nbsp;         </option>

&nbsp;       ))}

&nbsp;     </select>



&nbsp;     {error \&\& <div className="text-red-600">{error}</div>}



&nbsp;     <button

&nbsp;       onClick={submit}

&nbsp;       disabled={loading}

&nbsp;       className="bg-black text-white w-full py-2 rounded"

&nbsp;     >

&nbsp;       {loading ? "Posting…" : "Post Expense"}

&nbsp;     </button>

&nbsp;   </div>

&nbsp; );

}



// src/domain/templates/personalCapture/SalaryWizard.tsx



import { useState } from "react";

import { TemplateJournalEngine } from "../TemplateOrchestrator";



interface Props {

&nbsp; entityId: string;

&nbsp; onClose: () => void;

}



export default function SalaryWizard({ entityId, onClose }: Props) {

&nbsp; const \[amount, setAmount] = useState<number>(0);

&nbsp; const \[source, setSource] = useState<string>("");

&nbsp; const \[loading, setLoading] = useState(false);

&nbsp; const \[error, setError] = useState<string | null>(null);



&nbsp; async function submit() {

&nbsp;   try {

&nbsp;     setError(null);

&nbsp;     setLoading(true);



&nbsp;     if (amount <= 0) {

&nbsp;       throw new Error("Amount must be greater than 0.");

&nbsp;     }



&nbsp;     await TemplateJournalEngine.personal.salary(entityId, amount, source);



&nbsp;     onClose();

&nbsp;   } catch (err: any) {

&nbsp;     setError(err.message);

&nbsp;   } finally {

&nbsp;     setLoading(false);

&nbsp;   }

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-4 space-y-4">

&nbsp;     <h2 className="text-lg font-bold">Record Salary Income</h2>



&nbsp;     <input

&nbsp;       type="number"

&nbsp;       className="border p-2 w-full rounded"

&nbsp;       placeholder="Amount received"

&nbsp;       value={amount}

&nbsp;       onChange={(e) => setAmount(Number(e.target.value))}

&nbsp;     />



&nbsp;     <input

&nbsp;       type="text"

&nbsp;       className="border p-2 w-full rounded"

&nbsp;       placeholder="Income source (optional)"

&nbsp;       value={source}

&nbsp;       onChange={(e) => setSource(e.target.value)}

&nbsp;     />



&nbsp;     {error \&\& <div className="text-red-600">{error}</div>}



&nbsp;     <button

&nbsp;       onClick={submit}

&nbsp;       disabled={loading}

&nbsp;       className="bg-black text-white w-full py-2 rounded"

&nbsp;     >

&nbsp;       {loading ? "Posting…" : "Post Salary"}

&nbsp;     </button>

&nbsp;   </div>

&nbsp; );

}



// src/domain/templates/personalCapture/TransferWizard.tsx



import { useState, useEffect } from "react";

import { loadAppliedAccounts } from "../TemplateOrchestrator";

import { TemplateJournalEngine } from "../TemplateOrchestrator";



interface Props {

&nbsp; entityId: string;

&nbsp; onClose: () => void;

}



export default function TransferWizard({ entityId, onClose }: Props) {

&nbsp; const \[accounts, setAccounts] = useState<any\[]>(\[]);

&nbsp; const \[amount, setAmount] = useState(0);

&nbsp; const \[fromAcc, setFromAcc] = useState("");

&nbsp; const \[toAcc, setToAcc] = useState("");

&nbsp; const \[error, setError] = useState<string | null>(null);

&nbsp; const \[loading, setLoading] = useState(false);



&nbsp; useEffect(() => {

&nbsp;   loadAppliedAccounts(entityId).then((data) => {

&nbsp;     const assetAccounts = data.filter(

&nbsp;       (a) => a.account\_type === "ASSET"

&nbsp;     );

&nbsp;     setAccounts(assetAccounts);

&nbsp;   });

&nbsp; }, \[entityId]);



&nbsp; async function submit() {

&nbsp;   try {

&nbsp;     setError(null);

&nbsp;     setLoading(true);



&nbsp;     if (!fromAcc || !toAcc)

&nbsp;       throw new Error("Select both accounts.");

&nbsp;     if (fromAcc === toAcc)

&nbsp;       throw new Error("Cannot transfer to same account.");

&nbsp;     if (amount <= 0)

&nbsp;       throw new Error("Amount must be positive.");



&nbsp;     await TemplateJournalEngine.personal.transfer(

&nbsp;       entityId,

&nbsp;       amount,

&nbsp;       fromAcc,

&nbsp;       toAcc

&nbsp;     );



&nbsp;     onClose();

&nbsp;   } catch (err: any) {

&nbsp;     setError(err.message);

&nbsp;   } finally {

&nbsp;     setLoading(false);

&nbsp;   }

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-4 space-y-4">

&nbsp;     <h2 className="text-lg font-bold">Transfer Between Accounts</h2>



&nbsp;     <input

&nbsp;       type="number"

&nbsp;       className="border p-2 w-full rounded"

&nbsp;       placeholder="Amount"

&nbsp;       value={amount}

&nbsp;       onChange={(e) => setAmount(Number(e.target.value))}

&nbsp;     />



&nbsp;     <select

&nbsp;       className="border p-2 w-full rounded"

&nbsp;       value={fromAcc}

&nbsp;       onChange={(e) => setFromAcc(e.target.value)}

&nbsp;     >

&nbsp;       <option value="">From account…</option>

&nbsp;       {accounts.map((a) => (

&nbsp;         <option key={a.id} value={a.account\_code}>

&nbsp;           {a.account\_name}

&nbsp;         </option>

&nbsp;       ))}

&nbsp;     </select>



&nbsp;     <select

&nbsp;       className="border p-2 w-full rounded"

&nbsp;       value={toAcc}

&nbsp;       onChange={(e) => setToAcc(e.target.value)}

&nbsp;     >

&nbsp;       <option value="">To account…</option>

&nbsp;       {accounts.map((a) => (

&nbsp;         <option key={a.id} value={a.account\_code}>

&nbsp;           {a.account\_name}

&nbsp;         </option>

&nbsp;       ))}

&nbsp;     </select>



&nbsp;     {error \&\& <div className="text-red-600">{error}</div>}



&nbsp;     <button

&nbsp;       onClick={submit}

&nbsp;       disabled={loading}

&nbsp;       className="bg-black text-white w-full py-2 rounded"

&nbsp;     >

&nbsp;       {loading ? "Posting…" : "Post Transfer"}

&nbsp;     </button>

&nbsp;   </div>

&nbsp; );

}



// ---------------------------------------------------------------------------

// TEMPLATE ORCHESTRATOR

// Connects template definitions → DB → applied accounts → journal rules

//

// Fix Option A:

// ✅ Keep orchestrator wrappers (entityId, amount, description?) so wizards

// can call stable 2–3 arg functions.

// ✅ Pick template group by (template\_name + entity\_type + is\_active)

// ✅ Call apply\_template\_to\_entity(entityId, templateGroupId) (2 args)

// ❌ Do NOT expose raw IndustryCaptureRules.\* directly (they are (accounts, params))

// ---------------------------------------------------------------------------



import { supabase } from "../../lib/supabase";



import {

&nbsp; BUSINESS\_CHART\_OF\_ACCOUNTS,

&nbsp; AppliedAccount as BusinessApplied,

&nbsp; TemplateAccount,

} from "./business/businessChartOfAccounts";



import {

&nbsp; PERSONAL\_CHART\_OF\_ACCOUNTS,

&nbsp; AppliedAccount as PersonalApplied,

} from "./personal/personalChartOfAccounts";



import { BusinessCaptureRules } from "./business/businessCaptureRules";

import { PersonalCaptureRules } from "./personal/personalCaptureRules";

import { IndustryCaptureRules } from "./industry/industryCaptureRules";



import { EventOrchestrator } from "../../orchestrators/EventOrchestrator";



import {

&nbsp; RETAIL\_COA,

&nbsp; MANUFACTURING\_COA,

&nbsp; SERVICES\_COA,

&nbsp; REAL\_ESTATE\_COA,

&nbsp; HOSPITALITY\_COA,

} from "./industry";



// Combined type so hooks \& UI can treat all accounts uniformly

export type AppliedAccount = BusinessApplied | PersonalApplied;



export type TemplateKind =

&nbsp; | "BUSINESS"

&nbsp; | "PERSONAL"

&nbsp; | "RETAIL"

&nbsp; | "MANUFACTURING"

&nbsp; | "SERVICES"

&nbsp; | "REAL\_ESTATE"

&nbsp; | "HOSPITALITY";



type EntityRowForDerive = {

&nbsp; type: "Business" | "Personal";

&nbsp; industry\_type?: string | null;

};



// ---------------------------------------------------------------------------

// Template-name mapping (DB-facing)

// IMPORTANT: Must match account\_template\_groups.template\_name in Postgres

// ---------------------------------------------------------------------------

const TEMPLATE\_NAME\_BY\_KIND: Record<TemplateKind, string> = {

&nbsp; BUSINESS: "Business",

&nbsp; PERSONAL: "Personal",

&nbsp; RETAIL: "Retail",

&nbsp; MANUFACTURING: "Manufacturing",

&nbsp; SERVICES: "Services",

&nbsp; REAL\_ESTATE: "Real Estate",

&nbsp; HOSPITALITY: "Hospitality",

};



// ---------------------------------------------------------------------------

// STEP 0 — Derive TemplateKind without extra DB calls

// ---------------------------------------------------------------------------

export function deriveTemplateKindFromEntity(entity: EntityRowForDerive): TemplateKind {

&nbsp; if (entity.type === "Personal") return "PERSONAL";



&nbsp; const industryMap: Record<string, TemplateKind> = {

&nbsp;   Generic: "BUSINESS",

&nbsp;   Retail: "RETAIL",

&nbsp;   Manufacturing: "MANUFACTURING",

&nbsp;   Services: "SERVICES",

&nbsp;   RealEstate: "REAL\_ESTATE",

&nbsp;   Hospitality: "HOSPITALITY",

&nbsp; };



&nbsp; const key = entity.industry\_type ?? "Generic";

&nbsp; return industryMap\[key] ?? "BUSINESS";

}



// ---------------------------------------------------------------------------

// STEP 1 — ASSIGN TEMPLATE GROUP TO ENTITY (industry-aware)

// DB-driven using account\_template\_groups.template\_name

// Writes entity\_template\_selection (upsert by entity\_id)

// ---------------------------------------------------------------------------

export async function assignTemplateToEntity(

&nbsp; entityId: string,

&nbsp; kind: TemplateKind

): Promise<string> {

&nbsp; const templateName = TEMPLATE\_NAME\_BY\_KIND\[kind];



&nbsp; // Industry templates are still business entities in DB

&nbsp; const entityTypeForGroup = kind === "PERSONAL" ? "Personal" : "Business";



&nbsp; const { data: group, error: groupErr } = await supabase

&nbsp;   .from("account\_template\_groups")

&nbsp;   .select("id")

&nbsp;   .eq("template\_name", templateName)

&nbsp;   .eq("entity\_type", entityTypeForGroup)

&nbsp;   .eq("is\_active", true)

&nbsp;   .order("version\_number", { ascending: false })

&nbsp;   .limit(1)

&nbsp;   .single();



&nbsp; if (groupErr || !group?.id) {

&nbsp;   throw new Error(

&nbsp;     `No active template group found for template\_name="${templateName}" entity\_type="${entityTypeForGroup}".`

&nbsp;   );

&nbsp; }



&nbsp; const templateGroupId = group.id as string;



&nbsp; const { error: upsertErr } = await supabase

&nbsp;   .from("entity\_template\_selection")

&nbsp;   .upsert(

&nbsp;     { entity\_id: entityId, template\_group\_id: templateGroupId },

&nbsp;     { onConflict: "entity\_id" }

&nbsp;   );



&nbsp; if (upsertErr) throw upsertErr;



&nbsp; return templateGroupId;

}



// ---------------------------------------------------------------------------

// STEP 2 — APPLY TEMPLATE (materialize accounts from templates)

// ✅ must pass BOTH p\_entity\_id + p\_template\_group\_id (matches DB function)

// ---------------------------------------------------------------------------

export async function applyTemplateToEntity(

&nbsp; entityId: string,

&nbsp; templateGroupId: string

): Promise<void> {

&nbsp; const { error } = await supabase.rpc("apply\_template\_to\_entity", {

&nbsp;   p\_entity\_id: entityId,

&nbsp;   p\_template\_group\_id: templateGroupId,

&nbsp; });



&nbsp; if (error) {

&nbsp;   console.error("apply\_template\_to\_entity failed:", error);

&nbsp;   throw error;

&nbsp; }

}



// ---------------------------------------------------------------------------

// STEP 3 — FETCH APPLIED ACCOUNTS

// ---------------------------------------------------------------------------

export async function loadAppliedAccounts(entityId: string): Promise<AppliedAccount\[]> {

&nbsp; const { data, error } = await supabase

&nbsp;   .from("accounts")

&nbsp;   .select(

&nbsp;     `

&nbsp;     id,

&nbsp;     account\_code,

&nbsp;     account\_name,

&nbsp;     account\_type,

&nbsp;     parent\_account\_id,

&nbsp;     statement\_type,

&nbsp;     statement\_section,

&nbsp;     statement\_subsection,

&nbsp;     cash\_flow\_category,

&nbsp;     tax\_treatment,

&nbsp;     is\_contra,

&nbsp;     is\_cash\_account,

&nbsp;     normal\_balance,

&nbsp;     display\_order

&nbsp;   `

&nbsp;   )

&nbsp;   .eq("entity\_id", entityId)

&nbsp;   .order("display\_order", { ascending: true });



&nbsp; if (error) throw error;

&nbsp; return data as AppliedAccount\[];

}



// ---------------------------------------------------------------------------

// STEP 4 — RESOLVE TEMPLATE HIERARCHY (utility)

// ---------------------------------------------------------------------------

export function resolveTemplateHierarchy(

&nbsp; template: { account\_code: string; parent\_code?: string }\[]

): Record<string, string | null> {

&nbsp; const mapping: Record<string, string | null> = {};

&nbsp; template.forEach((acc) => {

&nbsp;   mapping\[acc.account\_code] = acc.parent\_code ?? null;

&nbsp; });

&nbsp; return mapping;

}



// ---------------------------------------------------------------------------

// STEP 5 — DETERMINE TEMPLATE KIND (DB version; kept for other callers)

// ---------------------------------------------------------------------------

export async function getEntityTemplateKind(entityId: string): Promise<TemplateKind> {

&nbsp; const { data, error } = await supabase

&nbsp;   .from("entities")

&nbsp;   .select("type, industry\_type")

&nbsp;   .eq("id", entityId)

&nbsp;   .single();



&nbsp; if (error) throw error;



&nbsp; return deriveTemplateKindFromEntity(data as EntityRowForDerive);

}



// ---------------------------------------------------------------------------

// Internal helper — post a journal produced by capture rules

// ---------------------------------------------------------------------------

function todayYYYYMMDD() {

&nbsp; return new Date().toISOString().slice(0, 10);

}



async function postJournalFromRule(entityId: string, journal: any) {

&nbsp; return EventOrchestrator.recordEconomicEvent({

&nbsp;   entityId,

&nbsp;   eventType: journal.eventType,

&nbsp;   eventDate: todayYYYYMMDD(),

&nbsp;   description: journal.description,

&nbsp;   effects: journal.effects.map((e: any) => ({

&nbsp;     account\_id: e.account\_id,

&nbsp;     amount: Math.abs(Number(e.amount) || 0),

&nbsp;     effect\_sign: e.effect\_sign === -1 ? -1 : 1,

&nbsp;     tax\_treatment: e.tax\_treatment ?? null,

&nbsp;     deductible: e.deductible ?? false,

&nbsp;   })),

&nbsp; });

}



// Add this helper near your other DB helpers

export async function getExistingTemplateSelection(entityId: string): Promise<string | null> {

&nbsp; const { data, error } = await supabase

&nbsp;   .from("entity\_template\_selection")

&nbsp;   .select("template\_group\_id")

&nbsp;   .eq("entity\_id", entityId)

&nbsp;   .single();



&nbsp; // PGRST116 = no rows found

&nbsp; if (error \&\& (error as any).code !== "PGRST116") throw error;

&nbsp; return (data?.template\_group\_id as string | undefined) ?? null;

}



/\*\*

&nbsp;\* Re-apply existing selected template (no changes to selection allowed).

&nbsp;\* Use this when template is already selected but accounts are missing.

&nbsp;\*/

export async function reapplySelectedTemplate(entityId: string): Promise<string> {

&nbsp; const templateGroupId = await getExistingTemplateSelection(entityId);

&nbsp; if (!templateGroupId) throw new Error("No template selection found for entity.");

&nbsp; await applyTemplateToEntity(entityId, templateGroupId);

&nbsp; return templateGroupId;

}



/\*\*

&nbsp;\* Setup flow:

&nbsp;\* - If selection exists: DO NOT change it (DB forbids). Just apply it.

&nbsp;\* - If selection does not exist: assign then apply.

&nbsp;\*/

export async function setupEntityTemplate(entityId: string, kind: TemplateKind) {

&nbsp; const existing = await getExistingTemplateSelection(entityId);



&nbsp; if (existing) {

&nbsp;   // DB forbids changing template assignment once set.

&nbsp;   // We only materialize accounts for the already-selected group.

&nbsp;   await applyTemplateToEntity(entityId, existing);



&nbsp;   return { kind, template\_group\_id: existing, reused\_existing\_selection: true as const };

&nbsp; }



&nbsp; const templateGroupId = await assignTemplateToEntity(entityId, kind);

&nbsp; await applyTemplateToEntity(entityId, templateGroupId);



&nbsp; return { kind, template\_group\_id: templateGroupId, reused\_existing\_selection: false as const };

}

// ---------------------------------------------------------------------------

// STEP 6 — JOURNAL ENGINE (Business + Personal + Industry)

// ✅ Stable wizard API: (entityId, amount, description?)

// ---------------------------------------------------------------------------

export const TemplateJournalEngine = {

&nbsp; business: {

&nbsp;   revenue: async (entityId: string, amount: number, description?: string) => {

&nbsp;     const accounts = await loadAppliedAccounts(entityId);

&nbsp;     const journal = BusinessCaptureRules.revenue(accounts, { amount, description });

&nbsp;     return postJournalFromRule(entityId, journal);

&nbsp;   },



&nbsp;   expense: async (entityId: string, amount: number, description?: string) => {

&nbsp;     const accounts = await loadAppliedAccounts(entityId);

&nbsp;     const journal = BusinessCaptureRules.expense(accounts, { amount, description });

&nbsp;     return postJournalFromRule(entityId, journal);

&nbsp;   },

&nbsp; },



&nbsp; personal: {

&nbsp;   salary: async (entityId: string, amount: number, source?: string) => {

&nbsp;     const accounts = await loadAppliedAccounts(entityId);

&nbsp;     const journal = PersonalCaptureRules.salary(accounts, { amount, source });

&nbsp;     return postJournalFromRule(entityId, journal);

&nbsp;   },



&nbsp;   expense: async (entityId: string, amount: number, category?: string) => {

&nbsp;     const accounts = await loadAppliedAccounts(entityId);

&nbsp;     const journal = PersonalCaptureRules.expense(accounts, { amount, category });

&nbsp;     return postJournalFromRule(entityId, journal);

&nbsp;   },



&nbsp;   transfer: async (entityId: string, amount: number, from\_code: string, to\_code: string) => {

&nbsp;     const accounts = await loadAppliedAccounts(entityId);

&nbsp;     const journal = PersonalCaptureRules.transfer(accounts, { amount, from\_code, to\_code });

&nbsp;     return postJournalFromRule(entityId, journal);

&nbsp;   },

&nbsp; },



&nbsp; industry: {

&nbsp;   retail: {

&nbsp;     sale: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.retail.sale(accounts, { amount, description });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },



&nbsp;     purchaseInventory: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.retail.purchaseInventory(accounts, {

&nbsp;         amount,

&nbsp;         description,

&nbsp;       });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },

&nbsp;   },



&nbsp;   manufacturing: {

&nbsp;     consumeRawMaterials: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.manufacturing.consumeRawMaterials(accounts, {

&nbsp;         amount,

&nbsp;         description,

&nbsp;       });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },



&nbsp;     completeProductionBatch: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.manufacturing.completeProductionBatch(accounts, {

&nbsp;         amount,

&nbsp;         description,

&nbsp;       });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },

&nbsp;   },



&nbsp;   services: {

&nbsp;     clientInvoice: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.services.clientInvoice(accounts, {

&nbsp;         amount,

&nbsp;         description,

&nbsp;       });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },



&nbsp;     payContractor: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.services.payContractor(accounts, {

&nbsp;         amount,

&nbsp;         description,

&nbsp;       });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },

&nbsp;   },



&nbsp;   hospitality: {

&nbsp;     roomSale: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.hospitality.roomSale(accounts, { amount, description });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },



&nbsp;     serviceMeal: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.hospitality.serviceMeal(accounts, {

&nbsp;         amount,

&nbsp;         description,

&nbsp;       });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },

&nbsp;   },



&nbsp;   realEstate: {

&nbsp;     rentIncome: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.realEstate.rentIncome(accounts, { amount, description });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },



&nbsp;     maintenanceExpense: async (entityId: string, amount: number, description?: string) => {

&nbsp;       const accounts = await loadAppliedAccounts(entityId);

&nbsp;       const journal = IndustryCaptureRules.realEstate.maintenanceExpense(accounts, {

&nbsp;         amount,

&nbsp;         description,

&nbsp;       });

&nbsp;       return postJournalFromRule(entityId, journal);

&nbsp;     },

&nbsp;   },

&nbsp; },

};



// ---------------------------------------------------------------------------

// TEMPLATE REGISTRY (front-end preview / rules; independent of DB templates)

// ---------------------------------------------------------------------------

export const TEMPLATE\_REGISTRY: Record<TemplateKind, TemplateAccount\[]> = {

&nbsp; BUSINESS: BUSINESS\_CHART\_OF\_ACCOUNTS,

&nbsp; PERSONAL: PERSONAL\_CHART\_OF\_ACCOUNTS,

&nbsp; RETAIL: RETAIL\_COA,

&nbsp; MANUFACTURING: MANUFACTURING\_COA,

&nbsp; SERVICES: SERVICES\_COA,

&nbsp; REAL\_ESTATE: REAL\_ESTATE\_COA,

&nbsp; HOSPITALITY: HOSPITALITY\_COA,

};



export function getTemplateDefinition(kind: TemplateKind): TemplateAccount\[] {

&nbsp; return TEMPLATE\_REGISTRY\[kind];

}



// ---------------------------------------------------------------------------

// STEP 7 — HIGH LEVEL SETUP FLOW (selected kind)

// ✅ assign returns templateGroupId, then apply uses same id

// ---------------------------------------------------------------------------



//moved

// src/hooks/queryKeys.ts

import type { DbStatementType } from "../domain/statements/statementTypes";



export const qk = {

&nbsp; user: () => \["user"] as const,

&nbsp; entities: () => \["entities"] as const,

&nbsp; entity: (entityId: string) => \["entity", entityId] as const,



&nbsp; periods: (entityId: string) => \["periods", entityId] as const,

&nbsp; currentPeriod: (entityId: string) => \["current-period", entityId] as const,



&nbsp; statement: (entityId: string, periodId: string, statementType: DbStatementType) =>

&nbsp;   \["statement", entityId, periodId, statementType] as const,



&nbsp; entitySnapshot: (entityId: string) => \["entity-snapshot", entityId] as const,

&nbsp; personalKpis: (entityId: string, asOf: string) => \["personal-kpis", entityId, asOf] as const,



&nbsp; vatReport: (entityId: string, start: string, end: string) =>

&nbsp;   \["vat-report", entityId, start, end] as const,

&nbsp; auditLog: (limit: number) => \["audit-log", limit] as const,



&nbsp; taxSummary: (entityId: string) => \["tax-summary", entityId] as const,



&nbsp; economicEvents: (entityId: string, filters?: Record<string, unknown>) =>

&nbsp;   \["economic-events", entityId, filters ?? {}] as const,



&nbsp; ecl: (entityId: string, year?: number) => \["ecl", entityId, year ?? "all"] as const,

&nbsp; deferredTax: (entityId: string, year?: number) =>

&nbsp;   \["deferred-tax", entityId, year ?? "all"] as const,



&nbsp; templates: () => \["templates"] as const,



&nbsp; accounts: (entityId: string) => \["accounts", entityId] as const,

&nbsp; accountsCount: (entityId: string) => \["accounts-count", entityId] as const,

&nbsp; enumValues: (typeName: string) => \["enum", typeName] as const,

} as const;


// src/hooks/useCompliance.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";

import { ComplianceOrchestrator } from "../orchestrators/ComplianceOrchestrator";

import { qk } from "./queryKeys";



export type VatReport = {

&nbsp; vat\_output: number;

&nbsp; vat\_input: number;

&nbsp; vat\_payable: number;

&nbsp; // if your RPC returns more fields, extend here

};



export type AuditLogRow = {

&nbsp; id: string;

&nbsp; table\_name: string;

&nbsp; operation: "INSERT" | "UPDATE" | "DELETE" | string;

&nbsp; record\_id: string;

&nbsp; before\_state: unknown | null;

&nbsp; after\_state: unknown | null;

&nbsp; changed\_by: string | null;

&nbsp; created\_at: string;

};



export function useCompliance() {

&nbsp; const qc = useQueryClient();



&nbsp; // -----------------------

&nbsp; // VAT Report (READ-ONLY) -> direct RPC

&nbsp; // -----------------------

&nbsp; function useVATReport(entityId?: string, start?: string, end?: string) {

&nbsp;   const enabled = Boolean(entityId \&\& start \&\& end);



&nbsp;   return useQuery<VatReport>({

&nbsp;     queryKey: enabled ? qk.vatReport(entityId!, start!, end!) : \["vat-report", "disabled"],

&nbsp;     enabled,

&nbsp;     queryFn: async () => {

&nbsp;       const { data, error } = await supabase.rpc("generate\_vat\_report", {

&nbsp;         p\_entity\_id: entityId!,

&nbsp;         p\_start: start!,

&nbsp;         p\_end: end!,

&nbsp;       });



&nbsp;       if (error) throw error;



&nbsp;       // Supabase may return numerics as strings depending on your settings;

&nbsp;       // normalize safely.

&nbsp;       const r = (data ?? {}) as any;

&nbsp;       return {

&nbsp;         vat\_output: Number(r.vat\_output ?? 0),

&nbsp;         vat\_input: Number(r.vat\_input ?? 0),

&nbsp;         vat\_payable: Number(r.vat\_payable ?? 0),

&nbsp;       };

&nbsp;     },

&nbsp;     staleTime: 60\_000,

&nbsp;   });

&nbsp; }



&nbsp; // -----------------------

&nbsp; // Audit Log (READ-ONLY) -> direct table read

&nbsp; // -----------------------

&nbsp; function useAuditLog(limit = 200) {

&nbsp;   return useQuery<AuditLogRow\[]>({

&nbsp;     queryKey: qk.auditLog(limit),

&nbsp;     queryFn: async () => {

&nbsp;       const { data, error } = await supabase

&nbsp;         .from("audit\_log")

&nbsp;         .select(

&nbsp;           "id, table\_name, operation, record\_id, before\_state, after\_state, changed\_by, created\_at"

&nbsp;         )

&nbsp;         .order("created\_at", { ascending: false })

&nbsp;         .limit(limit);



&nbsp;       if (error) throw error;

&nbsp;       return (data ?? \[]) as AuditLogRow\[];

&nbsp;     },

&nbsp;     staleTime: 15\_000,

&nbsp;   });

&nbsp; }



&nbsp; // -----------------------

&nbsp; // Deferred Tax Posting (WORKFLOW) -> orchestrator

&nbsp; // -----------------------

&nbsp; const postDeferredTax = useMutation({

&nbsp;   mutationFn: async (vars: { entityId: string; year: number }) => {

&nbsp;     await ComplianceOrchestrator.postDeferredTax(vars.entityId, vars.year);

&nbsp;     return true;

&nbsp;   },

&nbsp;   onSuccess: async (\_res, vars) => {

&nbsp;     await Promise.all(\[

&nbsp;       qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.auditLog(200) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.deferredTax(vars.entityId, vars.year) }),

&nbsp;     ]);

&nbsp;   },

&nbsp; });



&nbsp; // -----------------------

&nbsp; // ECL Posting (WORKFLOW) -> orchestrator (now uses post\_ecl\_year\_end)

&nbsp; // -----------------------

&nbsp; const postECL = useMutation({

&nbsp;   mutationFn: async (vars: { entityId: string; year: number }) => {

&nbsp;     const eventId = await ComplianceOrchestrator.postECL(vars.entityId, vars.year);

&nbsp;     return eventId; // uuid

&nbsp;   },

&nbsp;   onSuccess: async (\_eventId, vars) => {

&nbsp;     await Promise.all(\[

&nbsp;       qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.auditLog(200) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.ecl(vars.entityId, vars.year) }),

&nbsp;     ]);

&nbsp;   },

&nbsp; });



&nbsp; return {

&nbsp;   // read-only hooks

&nbsp;   useVATReport,

&nbsp;   useAuditLog,



&nbsp;   // workflows

&nbsp;   postDeferredTax,

&nbsp;   postECL,

&nbsp; };

}


// src/hooks/useEconomicEvents.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";

import { qk } from "./queryKeys";



type EffectInput = {

&nbsp; account\_id: string;

&nbsp; amount: number;

&nbsp; effect\_sign: 1 | -1;

&nbsp; tax\_treatment?: string | null;

&nbsp; deductible?: boolean;

};



type RecordEconomicEventParams = {

&nbsp; entityId: string;

&nbsp; eventType: string; // economic\_event\_type

&nbsp; eventDate: string; // yyyy-mm-dd

&nbsp; description?: string;

&nbsp; effects: EffectInput\[];

};



function toDateYYYYMMDD(value: string) {

&nbsp; if (/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return value;

&nbsp; const d = new Date(value);

&nbsp; return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);

}



function normalizeEffects(effects: EffectInput\[]): EffectInput\[] {

&nbsp; return effects.map((e) => ({

&nbsp;   ...e,

&nbsp;   amount: Math.abs(Number(e.amount) || 0),

&nbsp;   effect\_sign: e.effect\_sign === -1 ? -1 : 1,

&nbsp;   tax\_treatment: e.tax\_treatment ?? null,

&nbsp;   deductible: e.deductible ?? false,

&nbsp; }));

}



export function useEconomicEvents() {

&nbsp; const qc = useQueryClient();



&nbsp; const recordEconomicEvent = useMutation({

&nbsp;   mutationFn: async (params: RecordEconomicEventParams): Promise<string> => {

&nbsp;     const { data, error } = await supabase.rpc("record\_economic\_event", {

&nbsp;       p\_entity\_id: params.entityId,

&nbsp;       p\_event\_type: params.eventType,

&nbsp;       p\_event\_date: toDateYYYYMMDD(params.eventDate),

&nbsp;       p\_description: params.description ?? "",

&nbsp;       p\_effects: normalizeEffects(params.effects),

&nbsp;     });



&nbsp;     if (error) throw error;

&nbsp;     return data as string; // event\_id (uuid)

&nbsp;   },



&nbsp;   onSuccess: async (\_eventId, vars) => {

&nbsp;     await Promise.all(\[

&nbsp;       qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.economicEvents(vars.entityId) }),

&nbsp;     ]);

&nbsp;   },

&nbsp; });



&nbsp; return { recordEconomicEvent };

}


// src/hooks/useKpis.ts

import { useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";

import { qk } from "./queryKeys";



export type EntitySnapshotRow = { label: string; value: number };

export type EntitySnapshotMap = Record<string, number>;



function toNum(v: unknown) {

&nbsp; if (typeof v === "number") return v;

&nbsp; const n = Number(v);

&nbsp; return Number.isFinite(n) ? n : 0;

}



export function useEntitySnapshot(entityId?: string) {

&nbsp; const enabled = !!entityId;



&nbsp; return useQuery({

&nbsp;   queryKey: enabled ? qk.entitySnapshot(entityId!) : \["entity-snapshot", "disabled"],

&nbsp;   enabled,

&nbsp;   queryFn: async (): Promise<EntitySnapshotMap> => {

&nbsp;     const { data, error } = await supabase.rpc("get\_entity\_snapshot", { p\_entity\_id: entityId! });

&nbsp;     if (error) throw error;



&nbsp;     const rows = (data ?? \[]) as Array<{ label: unknown; value: unknown }>;

&nbsp;     return rows.reduce<EntitySnapshotMap>((acc, r) => {

&nbsp;       acc\[String(r.label ?? "")] = toNum(r.value);

&nbsp;       return acc;

&nbsp;     }, {});

&nbsp;   },

&nbsp; });

}


// src/hooks/useReportingPeriods.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";

import { qk } from "./queryKeys";



export type ReportingPeriod = {

&nbsp; id: string;

&nbsp; entity\_id: string;

&nbsp; period\_start: string;

&nbsp; period\_end: string;

&nbsp; is\_closed: boolean;

};



type PeriodType = "MONTHLY" | "QUARTERLY" | "ANNUAL";



export function useReportingPeriods(entityId?: string, periodType: PeriodType = "MONTHLY") {

&nbsp; const qc = useQueryClient();

&nbsp; const enabled = !!entityId;



&nbsp; const periodsQuery = useQuery<ReportingPeriod\[]>({

&nbsp;   queryKey: enabled ? qk.periods(entityId!) : \["periods", "disabled"],

&nbsp;   enabled,

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase

&nbsp;       .from("reporting\_periods")

&nbsp;       .select("id, entity\_id, period\_start, period\_end, is\_closed")

&nbsp;       .eq("entity\_id", entityId!)

&nbsp;       .order("period\_start", { ascending: false });



&nbsp;     if (error) throw error;

&nbsp;     return (data ?? \[]) as ReportingPeriod\[];

&nbsp;   },

&nbsp; });



&nbsp; const createNextPeriod = useMutation({

&nbsp;   mutationFn: async () => {

&nbsp;     if (!entityId) throw new Error("Missing entityId");



&nbsp;     // ✅ DB signature: create\_next\_reporting\_period(p\_entity\_id uuid, p\_period\_type text)

&nbsp;     const { data, error } = await supabase.rpc("create\_next\_reporting\_period", {

&nbsp;       p\_entity\_id: entityId,

&nbsp;       p\_period\_type: periodType,

&nbsp;     });



&nbsp;     if (error) throw error;

&nbsp;     return data;

&nbsp;   },

&nbsp;   onSuccess: async () => {

&nbsp;     if (!entityId) return;

&nbsp;     await qc.invalidateQueries({ queryKey: qk.periods(entityId) });

&nbsp;   },

&nbsp; });



&nbsp; const ensureCurrentPeriod = useMutation({

&nbsp;   mutationFn: async () => {

&nbsp;     if (!entityId) throw new Error("Missing entityId");

&nbsp;     const { data, error } = await supabase.rpc("get\_or\_create\_current\_period", {

&nbsp;       p\_entity\_id: entityId,

&nbsp;     });

&nbsp;     if (error) throw error;

&nbsp;     return data as string; // period\_id

&nbsp;   },

&nbsp;   onSuccess: async () => {

&nbsp;     if (!entityId) return;

&nbsp;     await Promise.all(\[

&nbsp;       qc.invalidateQueries({ queryKey: qk.periods(entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.currentPeriod(entityId) }),

&nbsp;     ]);

&nbsp;   },

&nbsp; });



&nbsp; async function createIfMissing() {

&nbsp;   const periods = periodsQuery.data ?? \[];

&nbsp;   if (periods.length === 0) {

&nbsp;     await createNextPeriod.mutateAsync();

&nbsp;     return true;

&nbsp;   }

&nbsp;   return false;

&nbsp; }



&nbsp; return {

&nbsp;   periodsQuery,

&nbsp;   periods: periodsQuery.data ?? \[],

&nbsp;   createNextPeriod,

&nbsp;   createIfMissing,

&nbsp;   ensureCurrentPeriod,

&nbsp; };

}



// src/hooks/useStatements.ts

import { useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";

import { qk } from "./queryKeys";

import type { DbStatementType } from "../domain/statements/statementTypes";

import type {

&nbsp; RenderedStatement as RenderedStatementRaw,

&nbsp; RenderedStatementLine,

} from "../domain/statements/types";



// UI-safe type: lines is always an array

export type RenderedStatement = Omit<RenderedStatementRaw, "lines"> \& {

&nbsp; lines: RenderedStatementLine\[];

};



export function useStatement(

&nbsp; entityId?: string,

&nbsp; periodId?: string,

&nbsp; statementType?: DbStatementType

) {

&nbsp; const enabled = Boolean(entityId \&\& periodId \&\& statementType);



&nbsp; return useQuery<RenderedStatement>({

&nbsp;   queryKey: enabled

&nbsp;     ? qk.statement(entityId!, periodId!, statementType!)

&nbsp;     : \["statement", "disabled"],

&nbsp;   enabled,

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase.rpc("render\_financial\_statement", {

&nbsp;       p\_entity\_id: entityId!,

&nbsp;       p\_period\_id: periodId!,

&nbsp;       p\_statement\_type: statementType!,

&nbsp;     });



&nbsp;     if (error) throw error;



&nbsp;     const raw = data as RenderedStatementRaw;

&nbsp;     return {

&nbsp;       ...raw,

&nbsp;       lines: raw.lines ?? \[],

&nbsp;     };

&nbsp;   },

&nbsp;   staleTime: 30\_000,

&nbsp; });

}




import { useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";

import { qk } from "./queryKeys";



export type TemplateGroupRow = {

&nbsp; id: string;

&nbsp; template\_name: string;

&nbsp; entity\_type: "Business" | "Personal" | string;

&nbsp; is\_active: boolean;

&nbsp; version\_number: number;

&nbsp; created\_at?: string;

};



type UseTemplatesOptions = {

&nbsp; entityType?: "Business" | "Personal";

};



export function useTemplates(opts: UseTemplatesOptions = {}) {

&nbsp; const templatesQuery = useQuery<TemplateGroupRow\[]>({

&nbsp;   queryKey: qk.templates(),

&nbsp;   queryFn: async () => {

&nbsp;     let query = supabase

&nbsp;       .from("account\_template\_groups")

&nbsp;       .select("id, template\_name, entity\_type, is\_active, version\_number, created\_at")

&nbsp;       .eq("is\_active", true);



&nbsp;     if (opts.entityType) {

&nbsp;       query = query.eq("entity\_type", opts.entityType);

&nbsp;     }



&nbsp;     // Prefer deterministic ordering: name, entity\_type, latest version first

&nbsp;     const { data, error } = await query

&nbsp;       .order("template\_name", { ascending: true })

&nbsp;       .order("entity\_type", { ascending: true })

&nbsp;       .order("version\_number", { ascending: false });



&nbsp;     if (error) throw error;

&nbsp;     return (data ?? \[]) as TemplateGroupRow\[];

&nbsp;   },

&nbsp;   staleTime: 60 \* 60 \* 1000, // 1 hour: templates rarely change

&nbsp; });



&nbsp; return {

&nbsp;   templatesQuery,

&nbsp;   templates: templatesQuery.data ?? \[],

&nbsp; };

}



// src/hooks/useYearEnd.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { qk } from "./queryKeys";

import { YearEndOrchestrator } from "../orchestrators/YearEndOrchestrator";



export function useYearEnd() {

&nbsp; const qc = useQueryClient();



&nbsp; const runFullYearEndClose = useMutation({

&nbsp;   mutationFn: async (vars: { entityId: string; year: number }) => {

&nbsp;     // ✅ official preference

&nbsp;     return YearEndOrchestrator.runFullYearEndClose(vars.entityId, vars.year);

&nbsp;   },

&nbsp;   onSuccess: async (\_snapshotId, vars) => {

&nbsp;     await Promise.all(\[

&nbsp;       qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.periods(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.economicEvents(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.ecl(vars.entityId, vars.year) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.deferredTax(vars.entityId, vars.year) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.auditLog(200) }),

&nbsp;     ]);

&nbsp;   },

&nbsp; });



&nbsp; const postDeferredTax = useMutation({

&nbsp;   mutationFn: async (vars: { entityId: string; year: number }) => {

&nbsp;     await YearEndOrchestrator.postDeferredTax(vars.entityId, vars.year);

&nbsp;     return true;

&nbsp;   },

&nbsp;   onSuccess: async (\_ok, vars) => {

&nbsp;     await Promise.all(\[

&nbsp;       qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.taxSummary(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.deferredTax(vars.entityId, vars.year) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.auditLog(200) }),

&nbsp;     ]);

&nbsp;   },

&nbsp; });



&nbsp; const postECLMovement = useMutation({

&nbsp;   mutationFn: async (vars: { entityId: string; year: number }) => {

&nbsp;     // returns eventId

&nbsp;     return YearEndOrchestrator.postECLMovement(vars.entityId, vars.year);

&nbsp;   },

&nbsp;   onSuccess: async (\_eventId, vars) => {

&nbsp;     await Promise.all(\[

&nbsp;       qc.invalidateQueries({ queryKey: qk.entitySnapshot(vars.entityId) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.ecl(vars.entityId, vars.year) }),

&nbsp;       qc.invalidateQueries({ queryKey: qk.auditLog(200) }),

&nbsp;     ]);

&nbsp;   },

&nbsp; });



&nbsp; return { runFullYearEndClose, postDeferredTax, postECLMovement };

}



// src/lib/auth.ts

import { supabase } from "./supabase";



export async function requireAuth() {

&nbsp; const { data, error } = await supabase.auth.getUser();

&nbsp; if (error || !data.user) throw new Error("User not authenticated");

&nbsp; return data.user;

}


// src/lib/eventEmitter.ts

type Handler<T = any> = (payload: T) => void



class EventEmitter {

&nbsp; private listeners: Record<string, Set<Handler>> = {}



&nbsp; on<T = any>(event: string, handler: Handler<T>) {

&nbsp;   if (!this.listeners\[event]) this.listeners\[event] = new Set()

&nbsp;   this.listeners\[event].add(handler as Handler)

&nbsp;   return () => this.off(event, handler)

&nbsp; }



&nbsp; off<T = any>(event: string, handler: Handler<T>) {

&nbsp;   this.listeners\[event]?.delete(handler as Handler)

&nbsp; }



&nbsp; emit<T = any>(event: string, payload?: T) {

&nbsp;   this.listeners\[event]?.forEach((handler) => handler(payload))

&nbsp; }



&nbsp; clear(event?: string) {

&nbsp;   if (event) delete this.listeners\[event]

&nbsp;   else this.listeners = {}

&nbsp; }

}



export const eventEmitter = new EventEmitter()



&nbsp;   //strongly-typed event names

export const DomainEvents = {

&nbsp; ECONOMIC\_EVENT\_RECORDED: 'ECONOMIC\_EVENT\_RECORDED',

&nbsp; STATEMENT\_RENDERED: 'STATEMENT\_RENDERED',

&nbsp; STATEMENT\_REBUILT: 'STATEMENT\_REBUILT',

&nbsp; SNAPSHOT\_FINALIZED: 'SNAPSHOT\_FINALIZED'

} as const




// src/lib/rpc.ts

import { supabase } from "./supabase";



export async function rpc<T>(fn: string, params: Record<string, unknown>): Promise<T> {

&nbsp; const { data, error } = await supabase.rpc(fn, params);

&nbsp; if (error) {

&nbsp;   console.error(`\[RPC ERROR] ${fn}`, error);

&nbsp;   throw new Error(error.message ?? "RPC failed");

&nbsp; }

&nbsp; return data as T;

}



export async function closeFinancialYearEnterprise(entityId: string, year: number) {

&nbsp; const { data, error } = await supabase.rpc("close\_financial\_year\_enterprise", {

&nbsp;   p\_entity\_id: entityId,

&nbsp;   p\_year: year,

&nbsp; });



&nbsp; if (error) throw error;

&nbsp; return data; // likely UUID of the close event

}



// src/lib/supabase.ts

/// <reference types="vite/client" />

import { createClient, type SupabaseClient } from '@supabase/supabase-js'



const supabaseUrl = import.meta.env.VITE\_SUPABASE\_URL as string | undefined

const supabaseAnonKey = import.meta.env.VITE\_SUPABASE\_ANON\_KEY as string | undefined



if (!supabaseUrl || !supabaseAnonKey) {

&nbsp; throw new Error('Missing Supabase environment variables (VITE\_SUPABASE\_URL / VITE\_SUPABASE\_ANON\_KEY)')

}



export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)



/\*\* ---------------------------------------------------------

&nbsp;\* Auth helpers

&nbsp;\* -------------------------------------------------------- \*/



export async function getCurrentUser(): Promise<{

&nbsp; user: Awaited<ReturnType<typeof supabase.auth.getUser>>\['data']\['user']

&nbsp; error: Awaited<ReturnType<typeof supabase.auth.getUser>>\['error']

}> {

&nbsp; const { data, error } = await supabase.auth.getUser()

&nbsp; return { user: data.user, error }

}



export async function getSession(): Promise<{

&nbsp; session: Awaited<ReturnType<typeof supabase.auth.getSession>>\['data']\['session']

&nbsp; error: Awaited<ReturnType<typeof supabase.auth.getSession>>\['error']

}> {

&nbsp; const { data, error } = await supabase.auth.getSession()

&nbsp; return { session: data.session, error }

}



/\*\* ---------------------------------------------------------

&nbsp;\* RPC helpers

&nbsp;\* -------------------------------------------------------- \*/



type EnumValueRow = { value: string }



export async function getEnumValues(typeName: string): Promise<string\[]> {

&nbsp; const { data, error } = await supabase.rpc('get\_enum\_values', {

&nbsp;   type\_name: typeName

&nbsp; })



&nbsp; if (error) throw error



&nbsp; // data can be null depending on RPC return; keep it safe

&nbsp; const rows = (data ?? \[]) as EnumValueRow\[]

&nbsp; return rows.map((row) => row.value)

}



/\*\* ---------------------------------------------------------

&nbsp;\* RLS note:

&nbsp;\* Prefer RLS policies over "queryAsUser" style filtering.

&nbsp;\* Keep the helpers below only if you truly need them.

&nbsp;\* -------------------------------------------------------- \*/



/\*\*

&nbsp;\* Helper: Insert with user\_id

&nbsp;\* Automatically adds current user ID to payload

&nbsp;\*/

export async function insertAsUser<T extends Record<string, any>>(

&nbsp; table: string,

&nbsp; payload: T,

&nbsp; userIdColumn: string = 'user\_id'

) {

&nbsp; const { user } = await getCurrentUser()

&nbsp; if (!user) throw new Error('Not authenticated')



&nbsp; return supabase

&nbsp;   .from(table)

&nbsp;   .insert({

&nbsp;     ...payload,

&nbsp;     \[userIdColumn]: user.id

&nbsp;   })

&nbsp;   .select()

}



/\*\*

&nbsp;\* Helper: Query rows by current user id (optional utility).

&nbsp;\* NOTE: This was broken in your JS version because getUser() is async.

&nbsp;\*/

export async function queryAsUser(

&nbsp; table: string,

&nbsp; userIdColumn: string = 'user\_id'

) {

&nbsp; const { user } = await getCurrentUser()

&nbsp; if (!user) throw new Error('Not authenticated')



&nbsp; return supabase.from(table).select('\*').eq(userIdColumn, user.id)

}



/\*\* ---------------------------------------------------------

&nbsp;\* Error normalization

&nbsp;\* -------------------------------------------------------- \*/



export type NormalizedError = {

&nbsp; code: string

&nbsp; message: string

&nbsp; details: any

&nbsp; hint: string | null

}



export function normalizeError(error: any): NormalizedError {

&nbsp; return {

&nbsp;   code: error?.code ?? 'UNKNOWN',

&nbsp;   message: error?.message ?? 'Unknown error',

&nbsp;   details: error?.details ?? null,

&nbsp;   hint: error?.hint ?? null

&nbsp; }

}




// src/orchestrators/ComplianceOrchestrator.ts

import { supabase } from "../lib/supabase";

import { eventEmitter } from "../lib/eventEmitter";

import { rpc } from "../lib/rpc";

import { requireAuth } from "../lib/auth";



export const ComplianceOrchestrator = {

&nbsp; /\*\* IAS 12 — Post Deferred Tax Movement \*/

&nbsp; async postDeferredTax(entityId: string, year: number) {

&nbsp;   await requireAuth();



&nbsp;   const result = await rpc<void>("post\_deferred\_tax\_movement", {

&nbsp;     p\_entity: entityId,

&nbsp;     p\_year: year,

&nbsp;   });



&nbsp;   eventEmitter.emit("IAS12\_DEFERRED\_TAX\_POSTED", { entityId, year });

&nbsp;   return result;

&nbsp; },



&nbsp; /\*\* IFRS 9 — Post ECL Year-End Movement (DB: post\_ecl\_year\_end) \*/

&nbsp; async postECL(entityId: string, year: number) {

&nbsp;   await requireAuth();



&nbsp;   const eventId = await rpc<string>("post\_ecl\_year\_end", {

&nbsp;     p\_entity: entityId,

&nbsp;     p\_year: year,

&nbsp;   });



&nbsp;   eventEmitter.emit("IFRS9\_ECL\_POSTED", { entityId, year, eventId });

&nbsp;   return eventId;

&nbsp; },



&nbsp; /\*\* VAT reporting \*/

&nbsp; async generateVATReport(entityId: string, start: string, end: string) {

&nbsp;   await requireAuth();



&nbsp;   const report = await rpc<any>("generate\_vat\_report", {

&nbsp;     p\_entity\_id: entityId,

&nbsp;     p\_start: start,

&nbsp;     p\_end: end,

&nbsp;   });



&nbsp;   eventEmitter.emit("VAT\_REPORT\_GENERATED", { entityId, start, end });

&nbsp;   return report;

&nbsp; },



&nbsp; /\*\* Audit Log viewer helper \*/

&nbsp; async fetchAuditLog(limit = 200) {

&nbsp;   await requireAuth();



&nbsp;   const { data, error } = await supabase

&nbsp;     .from("audit\_log")

&nbsp;     .select("\*")

&nbsp;     .order("created\_at", { ascending: false })

&nbsp;     .limit(limit);



&nbsp;   if (error) throw new Error(error.message);

&nbsp;   return data ?? \[];

&nbsp; },

};


// src/orchestrators/EventOrchestrator.ts

import { supabase } from "../lib/supabase";

import { eventEmitter } from "../lib/eventEmitter";



export interface EconomicEventEffect {

&nbsp; account\_id: string;          // uuid

&nbsp; amount: number;              // must be > 0 (DB CHECK)

&nbsp; effect\_sign: 1 | -1;         // must be 1 or -1

&nbsp; tax\_treatment?: string | null; // DB casts to tax\_treatment enum or NULL

&nbsp; deductible?: boolean;        // DB defaults false if not provided

&nbsp; metadata?: Record<string, any>;

}



export interface RecordEconomicEventParams {

&nbsp; entityId: string;

&nbsp; eventType: string;  // economic\_event\_type enum value

&nbsp; eventDate: string;  // yyyy-mm-dd

&nbsp; description?: string | null;

&nbsp; effects: EconomicEventEffect\[];

}



function toDateYYYYMMDD(d: Date = new Date()) {

&nbsp; return d.toISOString().slice(0, 10);

}



function normalizeEffect(e: EconomicEventEffect): EconomicEventEffect {

&nbsp; const amt = Math.abs(Number(e.amount) || 0);

&nbsp; const sign: 1 | -1 = e.effect\_sign === -1 ? -1 : 1;



&nbsp; return {

&nbsp;   ...e,

&nbsp;   amount: amt,

&nbsp;   effect\_sign: sign,

&nbsp;   tax\_treatment: e.tax\_treatment ?? null,

&nbsp;   deductible: e.deductible ?? false,

&nbsp; };

}



// RPC wrapper

async function rpc<T>(fn: string, params: any): Promise<T> {

&nbsp; const { data, error } = await supabase.rpc(fn, params);

&nbsp; if (error) {

&nbsp;   console.error(`\[RPC ERROR] ${fn}`, error);

&nbsp;   throw new Error(error.message);

&nbsp; }

&nbsp; return data as T;

}



export const EventOrchestrator = {

&nbsp; async recordEconomicEvent(params: RecordEconomicEventParams) {

&nbsp;   const { entityId, eventType, eventDate, description, effects } = params;



&nbsp;   if (!entityId) throw new Error("entityId is required");

&nbsp;   if (!eventType) throw new Error("eventType is required");

&nbsp;   if (!effects || effects.length < 2) throw new Error("At least 2 effects are required");



&nbsp;   // Ensure yyyy-mm-dd for DB date

&nbsp;   const safeDate =

&nbsp;     /^\\d{4}-\\d{2}-\\d{2}$/.test(eventDate) ? eventDate : toDateYYYYMMDD(new Date(eventDate));



&nbsp;   const normalizedEffects = effects.map(normalizeEffect);



&nbsp;   // Optional: client-side balance check (DB enforces too)

&nbsp;   const sum = normalizedEffects.reduce((acc, e) => acc + e.amount \* e.effect\_sign, 0);

&nbsp;   // allow tiny float error, though DB uses numeric

&nbsp;   if (Math.abs(sum) > 0.0001) {

&nbsp;     throw new Error(`Event is not balanced (sum=${sum}). Check debits/credits.`);

&nbsp;   }



&nbsp;   const eventId = await rpc<string>("record\_economic\_event", {

&nbsp;     p\_entity\_id: entityId,

&nbsp;     p\_event\_type: eventType,

&nbsp;     p\_event\_date: safeDate,

&nbsp;     p\_description: description ?? "",

&nbsp;     p\_effects: normalizedEffects,

&nbsp;   });



&nbsp;   eventEmitter.emit("ECONOMIC\_EVENT\_RECORDED", { eventId });

&nbsp;   return eventId;

&nbsp; },

};


// src/orchestrators/StatementOrchestrator.ts

import { supabase } from "../lib/supabase";

import { eventEmitter } from "../lib/eventEmitter";

import { rpc } from "../lib/rpc";

import { requireAuth } from "../lib/auth";

import type { RenderedStatement } from "../domain/statements/types";

import type { DbStatementType } from "../domain/statements/statementTypes";



type SnapshotType = "DRAFT" | "FINAL" | "AUDITED";



export const StatementOrchestrator = {

&nbsp; /\*\*

&nbsp;  \* Create a snapshot row (DRAFT).

&nbsp;  \* Keep this only if you truly use snapshot/lines tables in your UI flow.

&nbsp;  \*/

&nbsp; async createSnapshot(entityId: string, periodId: string, statementType: DbStatementType) {

&nbsp;   await requireAuth();



&nbsp;   const { data, error } = await supabase

&nbsp;     .from("financial\_statement\_snapshots")

&nbsp;     .insert(\[

&nbsp;       {

&nbsp;         entity\_id: entityId,

&nbsp;         reporting\_period\_id: periodId,

&nbsp;         statement\_type: statementType,

&nbsp;         snapshot\_type: "DRAFT" satisfies SnapshotType,

&nbsp;         financial\_year: null,

&nbsp;         generated\_at: new Date().toISOString(),

&nbsp;       },

&nbsp;     ])

&nbsp;     .select("id")

&nbsp;     .single();



&nbsp;   if (error) throw new Error(error.message);

&nbsp;   if (!data?.id) throw new Error("Snapshot created but no id returned.");



&nbsp;   const snapshotId = data.id as string;

&nbsp;   eventEmitter.emit("SNAPSHOT\_CREATED", { snapshotId, statementType });

&nbsp;   return snapshotId;

&nbsp; },



&nbsp; /\*\* Build lines for an existing snapshot \*/

&nbsp; async rebuildSnapshot(snapshotId: string) {

&nbsp;   await requireAuth();

&nbsp;   await rpc<void>("build\_financial\_statements", { p\_snapshot\_id: snapshotId });

&nbsp;   eventEmitter.emit("STATEMENT\_REBUILT", { snapshotId });

&nbsp; },



&nbsp; /\*\*

&nbsp;  \* Render statement via DB RPC.

&nbsp;  \* IMPORTANT: your DB signature RETURNS json, not uuid.

&nbsp;  \*/

&nbsp; async renderStatement(entityId: string, periodId: string, statementType: DbStatementType) {

&nbsp;   await requireAuth();



&nbsp;   const rendered = await rpc<RenderedStatement>("render\_financial\_statement", {

&nbsp;     p\_entity\_id: entityId,

&nbsp;     p\_period\_id: periodId,

&nbsp;     p\_statement\_type: statementType,

&nbsp;   });



&nbsp;   eventEmitter.emit("STATEMENT\_RENDERED", { entityId, periodId, statementType });

&nbsp;   return rendered;

&nbsp; },



&nbsp; /\*\* Optional: load statement lines table (only needed if UI uses snapshot lines directly) \*/

&nbsp; async getStatementLines(snapshotId: string) {

&nbsp;   await requireAuth();



&nbsp;   const { data, error } = await supabase

&nbsp;     .from("financial\_statement\_lines")

&nbsp;     .select("\*")

&nbsp;     .eq("snapshot\_id", snapshotId)

&nbsp;     .order("display\_order", { ascending: true });



&nbsp;   if (error) throw new Error(error.message);

&nbsp;   return data ?? \[];

&nbsp; },



&nbsp; /\*\* Mark snapshot FINAL (DB triggers/indexes will enforce lock/uniqueness rules) \*/

&nbsp; async finalizeSnapshot(snapshotId: string) {

&nbsp;   await requireAuth();



&nbsp;   const { error } = await supabase

&nbsp;     .from("financial\_statement\_snapshots")

&nbsp;     .update({ snapshot\_type: "FINAL" satisfies SnapshotType })

&nbsp;     .eq("id", snapshotId);



&nbsp;   if (error) throw new Error(error.message);

&nbsp;   eventEmitter.emit("SNAPSHOT\_FINALIZED", { snapshotId });

&nbsp; },

} as const;



// src/orchestrators/YearEndOrchestrator.ts

import { eventEmitter } from "../lib/eventEmitter";

import { rpc } from "../lib/rpc";

import { requireAuth } from "../lib/auth";



export const YearEndOrchestrator = {

&nbsp; /\*\* Full enterprise year-end close pipeline \*/

&nbsp; async runFullYearEndClose(entityId: string, year: number) {

&nbsp;   const user = await requireAuth();



&nbsp;   // DB: close\_financial\_year\_enterprise(p\_entity\_id uuid, p\_year integer, p\_user uuid)

&nbsp;   const snapshotId = await rpc<string>("close\_financial\_year\_enterprise", {

&nbsp;     p\_entity\_id: entityId,

&nbsp;     p\_year: year,

&nbsp;     p\_user: user.id,

&nbsp;   });



&nbsp;   eventEmitter.emit("YEAR\_END\_COMPLETED", { entityId, year, snapshotId });

&nbsp;   return snapshotId;

&nbsp; },



&nbsp; /\*\* Opening balances generator \*/

&nbsp; async generateOpeningBalances(entityId: string, year: number) {

&nbsp;   await requireAuth();



&nbsp;   await rpc<void>("generate\_opening\_balances", {

&nbsp;     p\_entity\_id: entityId,

&nbsp;     p\_year: year,

&nbsp;   });



&nbsp;   eventEmitter.emit("OPENING\_BALANCES\_CREATED", { entityId, year });

&nbsp; },



&nbsp; /\*\* IFRS cash flow generation \*/

&nbsp; async generateCashFlow(entityId: string, periodId: string) {

&nbsp;   await requireAuth();



&nbsp;   const result = await rpc<string>("generate\_cash\_flow\_indirect", {

&nbsp;     p\_entity\_id: entityId,

&nbsp;     p\_period\_id: periodId,

&nbsp;   });



&nbsp;   eventEmitter.emit("CASH\_FLOW\_GENERATED", { entityId, periodId, result });

&nbsp;   return result;

&nbsp; },



&nbsp; /\*\* IAS 12 deferred tax \*/

&nbsp; async postDeferredTax(entityId: string, year: number) {

&nbsp;   await requireAuth();



&nbsp;   await rpc<void>("post\_deferred\_tax\_movement", {

&nbsp;     p\_entity: entityId,

&nbsp;     p\_year: year,

&nbsp;   });



&nbsp;   eventEmitter.emit("DEFERRED\_TAX\_POSTED", { entityId, year });

&nbsp; },



&nbsp; /\*\* IFRS 9 ECL year-end (switched) \*/

&nbsp; async postECLMovement(entityId: string, year: number) {

&nbsp;   await requireAuth();



&nbsp;   const eventId = await rpc<string>("post\_ecl\_year\_end", {

&nbsp;     p\_entity: entityId,

&nbsp;     p\_year: year,

&nbsp;   });



&nbsp;   eventEmitter.emit("ECL\_POSTED", { entityId, year, eventId });

&nbsp;   return eventId;

&nbsp; },



&nbsp; /\*\* Force-regenerate statement lines for an existing snapshot \*/

&nbsp; async rebuildStatements(snapshotId: string) {

&nbsp;   await requireAuth();



&nbsp;   await rpc<void>("build\_financial\_statements", { p\_snapshot\_id: snapshotId });



&nbsp;   eventEmitter.emit("STATEMENTS\_REBUILT", { snapshotId });

&nbsp; },

} as const;






// src/pages/dashboard/LedgerPage.tsx

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useNavigate, useParams } from "react-router-dom";



import { supabase, getEnumValues } from "../../lib/supabase";

import JournalEntryModal from "../../components/events/JournalEntryModal";

import { qk } from "../../hooks/queryKeys";



type LedgerEventRow = {

&nbsp; id: string;

&nbsp; event\_date: string;

&nbsp; description: string | null;

&nbsp; event\_type: string | null;

&nbsp; created\_at: string;

};



export default function LedgerPage() {

&nbsp; const { entityId } = useParams<{ entityId: string }>();

&nbsp; const navigate = useNavigate();

&nbsp; const \[showModal, setShowModal] = useState(false);



&nbsp; if (!entityId) return <div className="p-4">Missing entityId in route.</div>;



&nbsp; const eventTypesQuery = useQuery<string\[]>({

&nbsp;   queryKey: qk.enumValues("economic\_event\_type"),

&nbsp;   queryFn: async () => getEnumValues("economic\_event\_type"),

&nbsp;   staleTime: 60 \* 60 \* 1000,

&nbsp; });



&nbsp; const eventTypes = useMemo(() => eventTypesQuery.data ?? \[], \[eventTypesQuery.data]);



&nbsp; const accountsCountQuery = useQuery<number>({

&nbsp;   queryKey: qk.accountsCount(entityId),

&nbsp;   enabled: !!entityId,

&nbsp;   queryFn: async () => {

&nbsp;     const { count, error } = await supabase

&nbsp;       .from("accounts")

&nbsp;       .select("id", { count: "exact", head: true })

&nbsp;       .eq("entity\_id", entityId)

&nbsp;       .eq("is\_active", true)

&nbsp;       .is("deleted\_at", null);



&nbsp;     if (error) throw error;

&nbsp;     return count ?? 0;

&nbsp;   },

&nbsp;   staleTime: 30\_000,

&nbsp; });



&nbsp; const hasAccounts = (accountsCountQuery.data ?? 0) > 0;



&nbsp; const eventsQuery = useQuery<LedgerEventRow\[]>({

&nbsp;   queryKey: qk.economicEvents(entityId),

&nbsp;   enabled: !!entityId,

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase

&nbsp;       .from("economic\_events\_active")

&nbsp;       .select("id, event\_date, description, event\_type, created\_at")

&nbsp;       .eq("entity\_id", entityId)

&nbsp;       .order("event\_date", { ascending: false });



&nbsp;     if (error) throw error;

&nbsp;     return (data ?? \[]) as LedgerEventRow\[];

&nbsp;   },

&nbsp; });



&nbsp; const events = eventsQuery.data ?? \[];

&nbsp; const canOpenModal = hasAccounts \&\& eventTypes.length > 0 \&\& !eventTypesQuery.isLoading;



&nbsp; return (

&nbsp;   <div className="space-y-8">

&nbsp;     <div className="flex justify-between items-center">

&nbsp;       <h2 className="text-2xl font-bold">Ledger / Economic Events</h2>



&nbsp;       <button

&nbsp;         type="button"

&nbsp;         className="px-4 py-2 bg-black text-white rounded shadow disabled:opacity-50"

&nbsp;         onClick={() => setShowModal(true)}

&nbsp;         disabled={!canOpenModal}

&nbsp;         title={

&nbsp;           !hasAccounts

&nbsp;             ? "Apply a template to create accounts first."

&nbsp;             : eventTypes.length === 0

&nbsp;               ? "No economic\_event\_type values found in DB."

&nbsp;               : "Record a journal entry"

&nbsp;         }

&nbsp;       >

&nbsp;         + Record Journal Entry

&nbsp;       </button>

&nbsp;     </div>



&nbsp;     {!accountsCountQuery.isLoading \&\& !hasAccounts \&\& (

&nbsp;       <div className="border rounded p-4 bg-yellow-50 text-sm space-y-2">

&nbsp;         <div className="font-semibold">No accounts found for this entity.</div>

&nbsp;         <div className="text-gray-700">

&nbsp;           This usually means the template wasn’t applied (no chart of accounts was materialized into{" "}

&nbsp;           <code>accounts</code>). Go to the entity’s template setup and apply one.

&nbsp;         </div>



&nbsp;         <div className="flex gap-3">

&nbsp;           <button

&nbsp;             type="button"

&nbsp;             className="px-3 py-2 rounded bg-blue-600 text-white"

&nbsp;             onClick={() => navigate(`/entities/${entityId}/template`)}

&nbsp;           >

&nbsp;             Go to Template Setup

&nbsp;           </button>



&nbsp;           <button

&nbsp;             type="button"

&nbsp;             className="px-3 py-2 rounded border"

&nbsp;             onClick={() => accountsCountQuery.refetch()}

&nbsp;           >

&nbsp;             Re-check Accounts

&nbsp;           </button>

&nbsp;         </div>

&nbsp;       </div>

&nbsp;     )}



&nbsp;     {showModal \&\& (

&nbsp;       <JournalEntryModal

&nbsp;         entityId={entityId}

&nbsp;         eventTypes={eventTypes}

&nbsp;         onClose={() => setShowModal(false)}

&nbsp;       />

&nbsp;     )}



&nbsp;     {(eventsQuery.error || eventTypesQuery.error || accountsCountQuery.error) \&\& (

&nbsp;       <div className="text-red-600 text-sm whitespace-pre-wrap">

&nbsp;         {eventsQuery.error

&nbsp;           ? `Failed to load events: ${String((eventsQuery.error as any)?.message ?? eventsQuery.error)}\\n`

&nbsp;           : ""}

&nbsp;         {eventTypesQuery.error

&nbsp;           ? `Failed to load event types: ${String(

&nbsp;               (eventTypesQuery.error as any)?.message ?? eventTypesQuery.error

&nbsp;             )}\\n`

&nbsp;           : ""}

&nbsp;         {accountsCountQuery.error

&nbsp;           ? `Failed to check accounts: ${String(

&nbsp;               (accountsCountQuery.error as any)?.message ?? accountsCountQuery.error

&nbsp;             )}\\n`

&nbsp;           : ""}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     <div className="bg-white border rounded shadow-sm overflow-hidden">

&nbsp;       <table className="min-w-full text-sm">

&nbsp;         <thead className="bg-gray-100 border-b">

&nbsp;           <tr>

&nbsp;             <th className="p-2 border-r">Date</th>

&nbsp;             <th className="p-2 border-r">Description</th>

&nbsp;             <th className="p-2 border-r">Type</th>

&nbsp;             <th className="p-2">Created</th>

&nbsp;           </tr>

&nbsp;         </thead>



&nbsp;         <tbody>

&nbsp;           {eventsQuery.isLoading \&\& (

&nbsp;             <tr>

&nbsp;               <td className="p-4 text-center" colSpan={4}>

&nbsp;                 Loading…

&nbsp;               </td>

&nbsp;             </tr>

&nbsp;           )}



&nbsp;           {events.map((ev) => (

&nbsp;             <tr key={ev.id} className="border-b hover:bg-gray-50">

&nbsp;               <td className="p-2 border-r">{ev.event\_date}</td>

&nbsp;               <td className="p-2 border-r">{ev.description ?? "—"}</td>

&nbsp;               <td className="p-2 border-r">{ev.event\_type ?? "—"}</td>

&nbsp;               <td className="p-2">{new Date(ev.created\_at).toLocaleString()}</td>

&nbsp;             </tr>

&nbsp;           ))}



&nbsp;           {!eventsQuery.isLoading \&\& events.length === 0 \&\& (

&nbsp;             <tr>

&nbsp;               <td colSpan={4} className="text-center p-4 text-gray-500">

&nbsp;                 No events recorded yet.

&nbsp;               </td>

&nbsp;             </tr>

&nbsp;           )}

&nbsp;         </tbody>

&nbsp;       </table>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}


// src/pages/dashboard/OverviewPage.tsx

import { useQuery } from "@tanstack/react-query";

import { useParams } from "react-router-dom";

import { supabase } from "../../lib/supabase";

import { qk } from "../../hooks/queryKeys";



type KPIResult = {

&nbsp; label: string;

&nbsp; value: number | string | null;

};



function toNumber(v: number | string | null): number | null {

&nbsp; if (v === null) return null;

&nbsp; if (typeof v === "number") return v;

&nbsp; const n = Number(v);

&nbsp; return Number.isFinite(n) ? n : null;

}



function formatValue(v: number | string | null) {

&nbsp; const n = toNumber(v);

&nbsp; if (n === null) return "—";

&nbsp; return n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

}



export default function OverviewPage() {

&nbsp; const { entityId } = useParams<{ entityId: string }>();

&nbsp; if (!entityId) return <div className="p-4">Missing entityId in route.</div>;



&nbsp; const kpisQuery = useQuery<KPIResult\[]>({

&nbsp;   queryKey: qk.entitySnapshot(entityId),

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase.rpc("get\_entity\_snapshot", {

&nbsp;       p\_entity\_id: entityId,

&nbsp;     });

&nbsp;     if (error) throw error;



&nbsp;     // DB returns TABLE(label text, value numeric) => array rows

&nbsp;     return Array.isArray(data) ? (data as KPIResult\[]) : \[];

&nbsp;   },

&nbsp;   staleTime: 15\_000,

&nbsp; });



&nbsp; if (kpisQuery.isLoading) return <div className="p-4">Loading KPI data…</div>;



&nbsp; if (kpisQuery.isError) {

&nbsp;   return (

&nbsp;     <div className="p-4 text-red-600">

&nbsp;       Failed to load KPIs: {String((kpisQuery.error as any)?.message ?? kpisQuery.error)}

&nbsp;     </div>

&nbsp;   );

&nbsp; }



&nbsp; const kpis = kpisQuery.data ?? \[];

&nbsp; if (kpis.length === 0) {

&nbsp;   return (

&nbsp;     <div className="p-4 text-gray-600">

&nbsp;       No KPI data available.

&nbsp;       <br />

&nbsp;       Try adding economic events.

&nbsp;     </div>

&nbsp;   );

&nbsp; }



&nbsp; return (

&nbsp;   <div className="space-y-6">

&nbsp;     <h2 className="text-xl font-bold">Key Performance Indicators</h2>



&nbsp;     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

&nbsp;       {kpis.map((k) => (

&nbsp;         <div key={k.label} className="border rounded p-4 bg-white shadow-sm flex flex-col">

&nbsp;           <div className="text-sm text-gray-500">{k.label}</div>

&nbsp;           <div className="text-2xl font-bold mt-1">{formatValue(k.value)}</div>

&nbsp;         </div>

&nbsp;       ))}

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}



// src/pages/dashboard/StatementsPage.tsx

import { useMemo, useState } from "react";

import { useParams } from "react-router-dom";



import StatementRenderer from "../../components/statements/StatementRenderer";

import CashFlowIndirect from "../../components/statements/CashFlowIndirect";

import { useReportingPeriods } from "../../hooks/useReportingPeriods";

import { useStatement } from "../../hooks/useStatements";



import {

&nbsp; UI\_STATEMENT\_TYPES,

&nbsp; STATEMENT\_TYPE\_MAP,

&nbsp; UI\_STATEMENT\_LABEL,

&nbsp; type UiStatementType,

} from "../../domain/statements/statementTypes";



export default function StatementsPage() {

&nbsp; const { entityId } = useParams<{ entityId: string }>();

&nbsp; if (!entityId) return <div className="p-4">Missing entityId in route.</div>;



&nbsp; const { periods, createIfMissing } = useReportingPeriods(entityId);



&nbsp; const \[uiType, setUiType] = useState<UiStatementType>("SOFP");

&nbsp; const \[periodId, setPeriodId] = useState<string | null>(null);



&nbsp; // DB-aligned type for RPC

&nbsp; const dbType = useMemo(() => STATEMENT\_TYPE\_MAP\[uiType], \[uiType]);



&nbsp; const statementQuery = useStatement(entityId, periodId ?? undefined, dbType);



&nbsp; return (

&nbsp;   <div className="space-y-8 p-6">

&nbsp;     <h1 className="text-2xl font-bold">Financial Statements</h1>



&nbsp;     <div className="flex flex-wrap gap-3">

&nbsp;       {UI\_STATEMENT\_TYPES.map((t) => (

&nbsp;         <button

&nbsp;           key={t}

&nbsp;           onClick={() => setUiType(t)}

&nbsp;           className={`px-4 py-2 border rounded ${

&nbsp;             uiType === t ? "bg-black text-white" : "bg-white"

&nbsp;           }`}

&nbsp;           type="button"

&nbsp;           title={UI\_STATEMENT\_LABEL\[t]}

&nbsp;         >

&nbsp;           {t}

&nbsp;         </button>

&nbsp;       ))}

&nbsp;     </div>



&nbsp;     <div className="flex items-center gap-3">

&nbsp;       <select

&nbsp;         className="border p-2"

&nbsp;         value={periodId ?? ""}

&nbsp;         onChange={(e) => setPeriodId(e.target.value || null)}

&nbsp;       >

&nbsp;         <option value="">Select period…</option>

&nbsp;         {periods.map((p) => (

&nbsp;           <option key={p.id} value={p.id}>

&nbsp;             {p.period\_start} → {p.period\_end}

&nbsp;           </option>

&nbsp;         ))}

&nbsp;       </select>



&nbsp;       <button

&nbsp;         onClick={() => createIfMissing()}

&nbsp;         className="px-4 py-2 bg-blue-600 text-white rounded"

&nbsp;         type="button"

&nbsp;       >

&nbsp;         Auto-Create Periods

&nbsp;       </button>

&nbsp;     </div>



&nbsp;     {statementQuery.error \&\& (

&nbsp;       <div className="text-sm text-red-600">

&nbsp;         Failed to load statement:{" "}

&nbsp;         {String((statementQuery.error as any)?.message ?? statementQuery.error)}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     {statementQuery.isLoading \&\& periodId \&\& <div>Loading statement…</div>}



&nbsp;     {statementQuery.data \&\& periodId \&\& (

&nbsp;       <>

&nbsp;         {uiType === "CF" ? (

&nbsp;           <CashFlowIndirect entityId={entityId} periodId={periodId} />

&nbsp;         ) : (

&nbsp;           <StatementRenderer data={statementQuery.data} />

&nbsp;         )}

&nbsp;       </>

&nbsp;     )}



&nbsp;     {!periodId \&\& (

&nbsp;       <div className="text-sm text-gray-600">

&nbsp;         Select a reporting period to render a statement.

&nbsp;       </div>

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

}



// src/pages/dashboard/TaxECLPage.tsx

import { useQuery } from "@tanstack/react-query";

import { useState } from "react";

import { useParams } from "react-router-dom";



import { supabase } from "../../lib/supabase";

import { useYearEnd } from "../../hooks/useYearEnd";

import { qk } from "../../hooks/queryKeys";



type DeferredTaxItem = Record<string, unknown>;

type EclItem = Record<string, unknown>;



export default function TaxECLPage() {

&nbsp; const { entityId } = useParams<{ entityId: string }>();

&nbsp; const \[year, setYear] = useState<number>(new Date().getFullYear());



&nbsp; if (!entityId) return <div className="p-4">Missing entityId in route.</div>;



&nbsp; const { postDeferredTax, postECLMovement } = useYearEnd();



&nbsp; const dtiQuery = useQuery<DeferredTaxItem\[]>({

&nbsp;   queryKey: qk.deferredTax(entityId, year),

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase

&nbsp;       .from("deferred\_tax\_items")

&nbsp;       .select("\*")

&nbsp;       .eq("entity\_id", entityId);



&nbsp;     if (error) throw error;

&nbsp;     return (data ?? \[]) as DeferredTaxItem\[];

&nbsp;   },

&nbsp; });



&nbsp; const eclQuery = useQuery<EclItem\[]>({

&nbsp;   queryKey: qk.ecl(entityId, year),

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase

&nbsp;       .from("expected\_credit\_losses")

&nbsp;       .select("\*")

&nbsp;       .eq("entity\_id", entityId);



&nbsp;     if (error) throw error;

&nbsp;     return (data ?? \[]) as EclItem\[];

&nbsp;   },

&nbsp; });



&nbsp; const isBusy =

&nbsp;   dtiQuery.isLoading ||

&nbsp;   eclQuery.isLoading ||

&nbsp;   postDeferredTax.isPending ||

&nbsp;   postECLMovement.isPending;



&nbsp; return (

&nbsp;   <div className="space-y-6">

&nbsp;     <h2 className="text-xl font-bold">Tax \& Expected Credit Losses</h2>



&nbsp;     <div className="flex flex-wrap gap-4 items-center">

&nbsp;       <input

&nbsp;         type="number"

&nbsp;         value={year}

&nbsp;         onChange={(e) => setYear(Number(e.target.value))}

&nbsp;         className="border p-2 w-32"

&nbsp;       />



&nbsp;       <button

&nbsp;         className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"

&nbsp;         disabled={isBusy}

&nbsp;         onClick={() => postDeferredTax.mutate({ entityId, year })}

&nbsp;         type="button"

&nbsp;       >

&nbsp;         {postDeferredTax.isPending ? "Posting…" : "Post Deferred Tax"}

&nbsp;       </button>



&nbsp;       <button

&nbsp;         className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"

&nbsp;         disabled={isBusy}

&nbsp;         onClick={() => postECLMovement.mutate({ entityId, year })}

&nbsp;         type="button"

&nbsp;       >

&nbsp;         {postECLMovement.isPending ? "Posting…" : "Post ECL (Year-End)"}

&nbsp;       </button>

&nbsp;     </div>



&nbsp;     {(dtiQuery.error || eclQuery.error || postDeferredTax.error || postECLMovement.error) \&\& (

&nbsp;       <div className="text-sm text-red-600 whitespace-pre-wrap">

&nbsp;         {dtiQuery.error ? `DTI: ${String((dtiQuery.error as any)?.message ?? dtiQuery.error)}\\n` : ""}

&nbsp;         {eclQuery.error ? `ECL: ${String((eclQuery.error as any)?.message ?? eclQuery.error)}\\n` : ""}

&nbsp;         {postDeferredTax.error

&nbsp;           ? `Deferred tax post: ${String((postDeferredTax.error as any)?.message ?? postDeferredTax.error)}\\n`

&nbsp;           : ""}

&nbsp;         {postECLMovement.error

&nbsp;           ? `ECL post: ${String((postECLMovement.error as any)?.message ?? postECLMovement.error)}\\n`

&nbsp;           : ""}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     <section>

&nbsp;       <h3 className="font-semibold mb-2">Deferred Tax Items</h3>

&nbsp;       <pre className="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">

&nbsp;         {JSON.stringify(dtiQuery.data ?? \[], null, 2)}

&nbsp;       </pre>

&nbsp;     </section>



&nbsp;     <section>

&nbsp;       <h3 className="font-semibold mb-2">Expected Credit Loss Items</h3>

&nbsp;       <pre className="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">

&nbsp;         {JSON.stringify(eclQuery.data ?? \[], null, 2)}

&nbsp;       </pre>

&nbsp;     </section>

&nbsp;   </div>

&nbsp; );

}



// src/pages/dashboard/YearEndPage.tsx

import { useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import { useYearEnd } from "../../hooks/useYearEnd";



export default function YearEndPage() {

&nbsp; const { entityId } = useParams<{ entityId: string }>();

&nbsp; if (!entityId) return <div className="p-4">Missing entityId in route.</div>;



&nbsp; const { runFullYearEndClose, postDeferredTax, postECLMovement } = useYearEnd();



&nbsp; const currentYear = useMemo(() => new Date().getFullYear(), \[]);

&nbsp; const \[year, setYear] = useState<number>(currentYear);



&nbsp; const busy =

&nbsp;   runFullYearEndClose.isPending || postDeferredTax.isPending || postECLMovement.isPending;



&nbsp; return (

&nbsp;   <div className="space-y-6 p-6">

&nbsp;     <h1 className="text-2xl font-bold">Year-End Close</h1>



&nbsp;     <div className="flex items-center gap-3">

&nbsp;       <label className="text-sm text-gray-600">Financial year</label>

&nbsp;       <input

&nbsp;         type="number"

&nbsp;         className="border rounded p-2 w-32"

&nbsp;         value={year}

&nbsp;         onChange={(e) => setYear(Number(e.target.value))}

&nbsp;         min={2000}

&nbsp;         max={2100}

&nbsp;       />

&nbsp;     </div>



&nbsp;     {(runFullYearEndClose.error || postDeferredTax.error || postECLMovement.error) \&\& (

&nbsp;       <div className="text-sm text-red-600">

&nbsp;         {String(

&nbsp;           (runFullYearEndClose.error as any)?.message ??

&nbsp;             (postDeferredTax.error as any)?.message ??

&nbsp;             (postECLMovement.error as any)?.message ??

&nbsp;             "Unknown error"

&nbsp;         )}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     <div className="flex flex-wrap gap-3">

&nbsp;       <button

&nbsp;         type="button"

&nbsp;         disabled={busy}

&nbsp;         className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"

&nbsp;         onClick={() => runFullYearEndClose.mutate({ entityId, year })}

&nbsp;       >

&nbsp;         {runFullYearEndClose.isPending ? "Running…" : "Run Full Year-End Close"}

&nbsp;       </button>



&nbsp;       <button

&nbsp;         type="button"

&nbsp;         disabled={busy}

&nbsp;         className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"

&nbsp;         onClick={() => postDeferredTax.mutate({ entityId, year })}

&nbsp;       >

&nbsp;         {postDeferredTax.isPending ? "Posting…" : "Post Deferred Tax"}

&nbsp;       </button>



&nbsp;       <button

&nbsp;         type="button"

&nbsp;         disabled={busy}

&nbsp;         className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"

&nbsp;         onClick={() => postECLMovement.mutate({ entityId, year })}

&nbsp;       >

&nbsp;         {postECLMovement.isPending ? "Posting…" : "Post ECL (IFRS 9)"}

&nbsp;       </button>

&nbsp;     </div>



&nbsp;     {runFullYearEndClose.data \&\& (

&nbsp;       <div className="text-sm text-gray-700">

&nbsp;         Year-end completed. Snapshot id: <code>{runFullYearEndClose.data}</code>

&nbsp;       </div>

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

}




// src/pages/entity/EntityCreatePage.tsx

import { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../../lib/supabase";

import { qk } from "../../hooks/queryKeys";



type EntityType = "Business" | "Personal";



type CreateEntityInput = {

&nbsp; name: string;

&nbsp; type: EntityType;

};



export default function EntityCreatePage() {

&nbsp; const navigate = useNavigate();

&nbsp; const queryClient = useQueryClient();



&nbsp; const \[name, setName] = useState("");

&nbsp; const \[type, setType] = useState<EntityType>("Business");



&nbsp; const canSubmit = useMemo(() => name.trim().length > 0, \[name]);



&nbsp; const createEntityMutation = useMutation({

&nbsp;   mutationFn: async (input: CreateEntityInput) => {

&nbsp;     const trimmed = input.name.trim();

&nbsp;     if (!trimmed) throw new Error("Entity name is required.");



&nbsp;     const { data: auth, error: authErr } = await supabase.auth.getUser();

&nbsp;     if (authErr) throw authErr;

&nbsp;     if (!auth.user) throw new Error("Not authenticated.");



&nbsp;     const { data, error } = await supabase

&nbsp;       .from("entities")

&nbsp;       .insert(\[

&nbsp;         {

&nbsp;           name: trimmed,

&nbsp;           type: input.type,

&nbsp;           created\_by: auth.user.id,

&nbsp;           // keep explicit so downstream template logic has a stable value

&nbsp;           industry\_type: null,

&nbsp;         },

&nbsp;       ])

&nbsp;       .select("id")

&nbsp;       .single();



&nbsp;     if (error) throw error;

&nbsp;     if (!data?.id) throw new Error("Entity created but no id returned.");



&nbsp;     return data.id as string;

&nbsp;   },



&nbsp;   onSuccess: async (entityId) => {

&nbsp;     await queryClient.invalidateQueries({ queryKey: qk.entities() });



&nbsp;     // Next step: template selection

&nbsp;     navigate(`/entities/${entityId}/template`, { replace: true });

&nbsp;   },

&nbsp; });



&nbsp; function handleCreate() {

&nbsp;   if (!canSubmit || createEntityMutation.isPending) return;

&nbsp;   createEntityMutation.mutate({ name, type });

&nbsp; }



&nbsp; return (

&nbsp;   <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">

&nbsp;     <div className="w-full max-w-xl bg-white border rounded shadow-sm p-6 space-y-6">

&nbsp;       <div>

&nbsp;         <h1 className="text-2xl font-bold">Create Entity</h1>

&nbsp;         <p className="text-sm text-gray-600 mt-1">

&nbsp;           Next you’ll select a chart-of-accounts template and Ziyanda’s Ledger will configure the entity automatically.

&nbsp;         </p>

&nbsp;       </div>



&nbsp;       {createEntityMutation.error \&\& (

&nbsp;         <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">

&nbsp;           {String((createEntityMutation.error as any)?.message ?? createEntityMutation.error)}

&nbsp;         </div>

&nbsp;       )}



&nbsp;       <div className="space-y-2">

&nbsp;         <label className="text-sm text-gray-600">Entity Name</label>

&nbsp;         <input

&nbsp;           className="border rounded p-2 w-full"

&nbsp;           value={name}

&nbsp;           onChange={(e) => setName(e.target.value)}

&nbsp;           placeholder="e.g. Ziyanda Consulting (Pty) Ltd"

&nbsp;           autoFocus

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div className="space-y-2">

&nbsp;         <label className="text-sm text-gray-600">Entity Type</label>

&nbsp;         <select

&nbsp;           className="border rounded p-2 w-full"

&nbsp;           value={type}

&nbsp;           onChange={(e) => setType(e.target.value as EntityType)}

&nbsp;         >

&nbsp;           <option value="Business">Business</option>

&nbsp;           <option value="Personal">Personal</option>

&nbsp;         </select>

&nbsp;       </div>



&nbsp;       <button

&nbsp;         onClick={handleCreate}

&nbsp;         disabled={!canSubmit || createEntityMutation.isPending}

&nbsp;         className="w-full py-3 rounded text-white font-bold bg-black disabled:opacity-50"

&nbsp;         type="button"

&nbsp;       >

&nbsp;         {createEntityMutation.isPending ? "Creating…" : "Create Entity"}

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}




// src/pages/entity/EntityTemplateSetup.tsx

import { useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";



import { supabase } from "../../lib/supabase";



import BusinessTemplatePreview from "../../components/templates/BusinessTemplatePreview";

import PersonalTemplatePreview from "../../components/templates/PersonalTemplatePreview";



import IndustryRetailPreview from "../../components/templates/IndustryRetailPreview";

import IndustryManufacturingPreview from "../../components/templates/IndustryManufacturingPreview";

import IndustryServicesPreview from "../../components/templates/IndustryServicesPreview";

import IndustryRealEstatePreview from "../../components/templates/IndustryRealEstatePreview";

import IndustryHospitalityPreview from "../../components/templates/IndustryHospitalityPreview";



import {

&nbsp; setupEntityTemplate,

&nbsp; deriveTemplateKindFromEntity,

&nbsp; TemplateKind,

} from "../../domain/templates/TemplateOrchestrator";

import { qk } from "../../hooks/queryKeys";



type EntityRow = {

&nbsp; id: string;

&nbsp; name: string;

&nbsp; type: "Business" | "Personal";

&nbsp; industry\_type?: string | null;

};



type TemplateStatusRow = { template\_group\_id: string } | null;



const INDUSTRY\_TYPE\_BY\_KIND: Record<TemplateKind, string | null> = {

&nbsp; BUSINESS: "Generic",

&nbsp; PERSONAL: null,

&nbsp; RETAIL: "Retail",

&nbsp; MANUFACTURING: "Manufacturing",

&nbsp; SERVICES: "Services",

&nbsp; REAL\_ESTATE: "RealEstate",

&nbsp; HOSPITALITY: "Hospitality",

};



function TemplateButton({

&nbsp; label,

&nbsp; active,

&nbsp; onClick,

}: {

&nbsp; label: string;

&nbsp; active: boolean;

&nbsp; onClick: () => void;

}) {

&nbsp; return (

&nbsp;   <button

&nbsp;     type="button"

&nbsp;     onClick={onClick}

&nbsp;     className={`px-6 py-3 rounded border text-sm font-medium ${

&nbsp;       active ? "bg-black text-white" : "bg-white hover:bg-gray-100"

&nbsp;     }`}

&nbsp;   >

&nbsp;     {label}

&nbsp;   </button>

&nbsp; );

}



function renderPreview(kind: TemplateKind | null) {

&nbsp; switch (kind) {

&nbsp;   case "BUSINESS":

&nbsp;     return <BusinessTemplatePreview />;

&nbsp;   case "PERSONAL":

&nbsp;     return <PersonalTemplatePreview />;

&nbsp;   case "RETAIL":

&nbsp;     return <IndustryRetailPreview />;

&nbsp;   case "MANUFACTURING":

&nbsp;     return <IndustryManufacturingPreview />;

&nbsp;   case "SERVICES":

&nbsp;     return <IndustryServicesPreview />;

&nbsp;   case "REAL\_ESTATE":

&nbsp;     return <IndustryRealEstatePreview />;

&nbsp;   case "HOSPITALITY":

&nbsp;     return <IndustryHospitalityPreview />;

&nbsp;   default:

&nbsp;     return null;

&nbsp; }

}



export default function EntityTemplateSetup() {

&nbsp; const { entityId } = useParams<{ entityId: string }>();

&nbsp; const id = entityId ?? "";



&nbsp; const navigate = useNavigate();

&nbsp; const queryClient = useQueryClient();



&nbsp; const \[selected, setSelected] = useState<TemplateKind | null>(null);



&nbsp; const entityQuery = useQuery<EntityRow>({

&nbsp;   queryKey: qk.entity(id),

&nbsp;   enabled: !!entityId,

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase

&nbsp;       .from("entities")

&nbsp;       .select("id, name, type, industry\_type")

&nbsp;       .eq("id", id)

&nbsp;       .single();

&nbsp;     if (error) throw error;

&nbsp;     return data as EntityRow;

&nbsp;   },

&nbsp; });



&nbsp; const templateStatusQuery = useQuery<TemplateStatusRow>({

&nbsp;   queryKey: \["entity-template", id],

&nbsp;   enabled: !!entityId,

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase

&nbsp;       .from("entity\_template\_selection")

&nbsp;       .select("template\_group\_id")

&nbsp;       .eq("entity\_id", id)

&nbsp;       .single();



&nbsp;     if (error \&\& (error as any).code !== "PGRST116") throw error;

&nbsp;     return (data ?? null) as TemplateStatusRow;

&nbsp;   },

&nbsp; });



&nbsp; const accountsCountQuery = useQuery<number>({

&nbsp;   queryKey: \["accounts-count", id],

&nbsp;   enabled: !!entityId,

&nbsp;   queryFn: async () => {

&nbsp;     const { count, error } = await supabase

&nbsp;       .from("accounts")

&nbsp;       .select("id", { count: "exact", head: true })

&nbsp;       .eq("entity\_id", id)

&nbsp;       .eq("is\_active", true)

&nbsp;       .is("deleted\_at", null);



&nbsp;     if (error) throw error;

&nbsp;     return count ?? 0;

&nbsp;   },

&nbsp;   staleTime: 30\_000,

&nbsp; });



&nbsp; const hasAccounts = (accountsCountQuery.data ?? 0) > 0;

&nbsp; const hasTemplateSelection = Boolean(templateStatusQuery.data?.template\_group\_id);



&nbsp; useEffect(() => {

&nbsp;   if (!entityId) return;

&nbsp;   if (templateStatusQuery.isLoading || accountsCountQuery.isLoading) return;



&nbsp;   if (hasTemplateSelection \&\& hasAccounts) {

&nbsp;     navigate(`/entities/${id}/overview`, { replace: true });

&nbsp;   }

&nbsp; }, \[

&nbsp;   entityId,

&nbsp;   id,

&nbsp;   navigate,

&nbsp;   templateStatusQuery.isLoading,

&nbsp;   accountsCountQuery.isLoading,

&nbsp;   hasTemplateSelection,

&nbsp;   hasAccounts,

&nbsp; ]);



&nbsp; useEffect(() => {

&nbsp;   if (!entityQuery.data) return;

&nbsp;   setSelected((prev) => prev ?? deriveTemplateKindFromEntity(entityQuery.data));

&nbsp; }, \[entityQuery.data]);



&nbsp; const applyMutation = useMutation({

&nbsp;   mutationFn: async () => {

&nbsp;     if (!entityId) throw new Error("Missing entityId in route.");

&nbsp;     if (!selected) throw new Error("Select a template first");



&nbsp;     const industry\_type = INDUSTRY\_TYPE\_BY\_KIND\[selected] ?? null;



&nbsp;     // Keep your industry update

&nbsp;     if (selected !== "PERSONAL") {

&nbsp;       const { error: updateErr } = await supabase

&nbsp;         .from("entities")

&nbsp;         .update({ industry\_type })

&nbsp;         .eq("id", id);



&nbsp;       if (updateErr) throw updateErr;

&nbsp;     }



&nbsp;     // ✅ If selection exists, don't try to change it

&nbsp;     const existing = templateStatusQuery.data?.template\_group\_id ?? null;

&nbsp;     if (existing) {

&nbsp;       // Just materialize accounts for existing group id

&nbsp;       const { reapplySelectedTemplate } = await import("../../domain/templates/TemplateOrchestrator");

&nbsp;       return reapplySelectedTemplate(id);

&nbsp;     }



&nbsp;     // Otherwise normal first-time setup

&nbsp;     return setupEntityTemplate(id, selected);

&nbsp;   },

&nbsp;   onSuccess: async () => {

&nbsp;     await Promise.all(\[

&nbsp;       queryClient.invalidateQueries({ queryKey: qk.entity(id) }),

&nbsp;       queryClient.invalidateQueries({ queryKey: qk.entities() }),

&nbsp;       queryClient.invalidateQueries({ queryKey: \["entity-template", id] }),



&nbsp;       // ✅ critical: accounts + accounts-count

&nbsp;       queryClient.invalidateQueries({ queryKey: \["accounts", id] }),

&nbsp;       queryClient.invalidateQueries({ queryKey: \["accounts-count", id] }),



&nbsp;       // optional: ledger/events caches

&nbsp;       queryClient.invalidateQueries({ queryKey: qk.economicEvents(id) }),

&nbsp;       queryClient.invalidateQueries({ queryKey: qk.entitySnapshot(id) }),

&nbsp;     ]);



&nbsp;     navigate(`/entities/${id}/overview`, { replace: true });

&nbsp;   },

&nbsp; });



&nbsp; const preview = useMemo(() => renderPreview(selected), \[selected]);



&nbsp; if (!entityId) return <div className="p-4">Missing entityId in route.</div>;



&nbsp; if (entityQuery.isLoading || templateStatusQuery.isLoading || accountsCountQuery.isLoading) {

&nbsp;   return <div className="h-screen flex items-center justify-center">Loading entity…</div>;

&nbsp; }



&nbsp; if (entityQuery.error) {

&nbsp;   return (

&nbsp;     <div className="p-4 text-red-600">

&nbsp;       Failed to load entity: {String((entityQuery.error as any)?.message ?? entityQuery.error)}

&nbsp;     </div>

&nbsp;   );

&nbsp; }



&nbsp; const entity = entityQuery.data;

&nbsp; if (!entity) return <div className="p-4">Entity not found.</div>;



&nbsp; const isBusiness = entity.type === "Business";



&nbsp; return (

&nbsp;   <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">

&nbsp;     <div className="w-full max-w-3xl bg-white shadow-lg border rounded p-8 space-y-8">

&nbsp;       <h1 className="text-2xl font-bold">

&nbsp;         Select Template for <span className="text-blue-600">{entity.name}</span>

&nbsp;       </h1>



&nbsp;       {hasTemplateSelection \&\& !hasAccounts \&\& (

&nbsp;         <div className="border rounded p-4 bg-yellow-50 text-sm">

&nbsp;           <div className="font-semibold">Template is selected, but accounts are missing.</div>

&nbsp;           <div className="text-gray-700 mt-1">

&nbsp;             This means the chart of accounts was not materialized into <code>accounts</code>.

&nbsp;             Re-apply the template to generate accounts.

&nbsp;           </div>

&nbsp;         </div>

&nbsp;       )}



&nbsp;       <p className="text-gray-600">

&nbsp;         Choose a financial accounting template. Industry templates automatically configure IFRS-compliant

&nbsp;         accounts tailored to your business model.

&nbsp;       </p>



&nbsp;       <div className="flex flex-wrap gap-4">

&nbsp;         {isBusiness ? (

&nbsp;           <>

&nbsp;             <TemplateButton label="Business (Standard IFRS)" active={selected === "BUSINESS"} onClick={() => setSelected("BUSINESS")} />

&nbsp;             <TemplateButton label="Retail Industry" active={selected === "RETAIL"} onClick={() => setSelected("RETAIL")} />

&nbsp;             <TemplateButton label="Manufacturing" active={selected === "MANUFACTURING"} onClick={() => setSelected("MANUFACTURING")} />

&nbsp;             <TemplateButton label="Professional Services" active={selected === "SERVICES"} onClick={() => setSelected("SERVICES")} />

&nbsp;             <TemplateButton label="Real Estate" active={selected === "REAL\_ESTATE"} onClick={() => setSelected("REAL\_ESTATE")} />

&nbsp;             <TemplateButton label="Hospitality" active={selected === "HOSPITALITY"} onClick={() => setSelected("HOSPITALITY")} />

&nbsp;           </>

&nbsp;         ) : (

&nbsp;           <TemplateButton label="Personal Finance Template" active={selected === "PERSONAL"} onClick={() => setSelected("PERSONAL")} />

&nbsp;         )}

&nbsp;       </div>



&nbsp;       {selected \&\& <div className="border rounded p-6 bg-gray-50">{preview}</div>}



&nbsp;       <button

&nbsp;         type="button"

&nbsp;         disabled={!selected || applyMutation.isPending}

&nbsp;         onClick={() => applyMutation.mutate()}

&nbsp;         className={`w-full py-3 rounded text-white font-bold ${

&nbsp;           selected \&\& !applyMutation.isPending

&nbsp;             ? "bg-blue-600 hover:bg-blue-700"

&nbsp;             : "bg-gray-400 cursor-not-allowed"

&nbsp;         }`}

&nbsp;       >

&nbsp;         {applyMutation.isPending

&nbsp;           ? "Applying Template…"

&nbsp;           : hasTemplateSelection \&\& !hasAccounts

&nbsp;             ? "Re-Apply Template"

&nbsp;             : "Apply Template"}

&nbsp;       </button>



&nbsp;       {applyMutation.error \&\& (

&nbsp;         <div className="text-red-600 text-sm">

&nbsp;           {String((applyMutation.error as any)?.message ?? applyMutation.error)}

&nbsp;         </div>

&nbsp;       )}

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}

import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function HospitalityMealServiceWizard() {

&nbsp; const params = useParams();

&nbsp; const entityId = params.entityId;

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

&nbsp; const id: string = entityId;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.hospitality.serviceMeal(

&nbsp;     id,

&nbsp;     Number(amount),

&nbsp;     description || undefined

&nbsp;   );



&nbsp;   navigate(`/entities/${id}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">

&nbsp;     <IndustryOperationHeader

&nbsp;       title="Record Meal Service"

&nbsp;       subtitle="Recognize food \& beverage revenue in hospitality operations."

&nbsp;     />



&nbsp;     <div className="space-y-4 mt-4">

&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Meal Service Amount</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;           placeholder="0.00"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;           placeholder="Dinner service - Table 5"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <button

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;       >

&nbsp;         Record Meal Service

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}




import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function HospitalityRoomSaleWizard() {

&nbsp; const { entityId } = useParams();

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div>No entity.</div>;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.hospitality.roomSale(

&nbsp;     entityId!,

&nbsp;     Number(amount),

&nbsp;     description

&nbsp;   );



&nbsp;   navigate(`/entities/${entityId}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">

&nbsp;     <IndustryOperationHeader

&nbsp;       title="Record Room Sale"

&nbsp;       subtitle="Recognize hospitality revenue for room bookings."

&nbsp;     />



&nbsp;     <div className="space-y-4 mt-4">



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Room Sale Amount</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;           placeholder="0.00"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;           placeholder="Room 205 booking"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <button

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;       >

&nbsp;         Record Room Sale

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}



import { Routes, Route, Navigate } from "react-router-dom";



import RetailSaleWizard from "./RetailSaleWizard";

import RetailPurchaseWizard from "./RetailPurchaseWizard";



import ManufacturingConsumeRawMaterialsWizard from "./ManufacturingConsumeRawMaterialsWizard";

import ManufacturingCompleteBatchWizard from "./ManufacturingCompleteBatchWizard";



import ServicesClientInvoiceWizard from "./ServicesClientInvoiceWizard";

import ServicesPayContractorWizard from "./ServicesPayContractorWizard";



import HospitalityRoomSaleWizard from "./HospitalityRoomSaleWizard";

import HospitalityMealServiceWizard from "./HospitalityMealServiceWizard";



import RealEstateRentIncomeWizard from "./RealEstateRentIncomeWizard";

import RealEstateMaintenanceWizard from "./RealEstateMaintenanceWizard";



type Props = {

&nbsp; industryType: string | null; // "Retail" | "Manufacturing" | "Services" | "RealEstate" | "Hospitality" | "Generic" | null

};



export default function IndustryRouter({ industryType }: Props) {

&nbsp; // If someone somehow gets here without a real industry

&nbsp; if (!industryType || industryType === "Generic") {

&nbsp;   return <Navigate to="../overview" replace />;

&nbsp; }



&nbsp; switch (industryType) {

&nbsp;   case "Retail":

&nbsp;     return (

&nbsp;       <Routes>

&nbsp;         {/\* Index: correct default landing \*/}

&nbsp;         <Route path="" element={<Navigate to="retail/sale" replace />} />



&nbsp;         {/\* Retail \*/}

&nbsp;         <Route path="retail/sale" element={<RetailSaleWizard />} />

&nbsp;         <Route path="retail/purchase" element={<RetailPurchaseWizard />} />



&nbsp;         {/\* Fallback \*/}

&nbsp;         <Route path="\*" element={<Navigate to="retail/sale" replace />} />

&nbsp;       </Routes>

&nbsp;     );



&nbsp;   case "Manufacturing":

&nbsp;     return (

&nbsp;       <Routes>

&nbsp;         <Route path="" element={<Navigate to="manufacturing/consume" replace />} />



&nbsp;         {/\* Manufacturing \*/}

&nbsp;         <Route path="manufacturing/consume" element={<ManufacturingConsumeRawMaterialsWizard />} />

&nbsp;         <Route path="manufacturing/complete" element={<ManufacturingCompleteBatchWizard />} />



&nbsp;         <Route path="\*" element={<Navigate to="manufacturing/consume" replace />} />

&nbsp;       </Routes>

&nbsp;     );



&nbsp;   case "Services":

&nbsp;     return (

&nbsp;       <Routes>

&nbsp;         <Route path="" element={<Navigate to="services/invoice" replace />} />



&nbsp;         {/\* Services \*/}

&nbsp;         <Route path="services/invoice" element={<ServicesClientInvoiceWizard />} />

&nbsp;         <Route path="services/contractor" element={<ServicesPayContractorWizard />} />



&nbsp;         <Route path="\*" element={<Navigate to="services/invoice" replace />} />

&nbsp;       </Routes>

&nbsp;     );



&nbsp;   case "Hospitality":

&nbsp;     return (

&nbsp;       <Routes>

&nbsp;         <Route path="" element={<Navigate to="hospitality/room-sale" replace />} />



&nbsp;         {/\* Hospitality \*/}

&nbsp;         <Route path="hospitality/room-sale" element={<HospitalityRoomSaleWizard />} />

&nbsp;         <Route path="hospitality/meal-service" element={<HospitalityMealServiceWizard />} />



&nbsp;         <Route path="\*" element={<Navigate to="hospitality/room-sale" replace />} />

&nbsp;       </Routes>

&nbsp;     );



&nbsp;   case "RealEstate":

&nbsp;     return (

&nbsp;       <Routes>

&nbsp;         <Route path="" element={<Navigate to="real-estate/rent-income" replace />} />



&nbsp;         {/\* Real Estate \*/}

&nbsp;         <Route path="real-estate/rent-income" element={<RealEstateRentIncomeWizard />} />

&nbsp;         <Route path="real-estate/maintenance" element={<RealEstateMaintenanceWizard />} />



&nbsp;         <Route path="\*" element={<Navigate to="real-estate/rent-income" replace />} />

&nbsp;       </Routes>

&nbsp;     );



&nbsp;   default:

&nbsp;     // Unknown enum value (future-proof)

&nbsp;     return <Navigate to="../overview" replace />;

&nbsp; }

}



import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function ManufacturingCompleteBatchWizard() {

&nbsp; const { entityId } = useParams();

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div>No entity.</div>;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.manufacturing.completeProductionBatch(

&nbsp;     entityId!,               // Safe due to check

&nbsp;     Number(amount),

&nbsp;     description

&nbsp;   );



&nbsp;   navigate(`/entities/${entityId}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">

&nbsp;     <IndustryOperationHeader

&nbsp;       title="Complete Production Batch"

&nbsp;       subtitle="Moves WIP to Finished Goods and recognizes production value."

&nbsp;     />



&nbsp;     <div className="space-y-4 mt-4">



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Batch Production Value</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;           placeholder="0.00"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;           placeholder="Batch #15 Completed"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <button

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;       >

&nbsp;         Record Batch Completion

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}



import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function ManufacturingConsumeRawMaterialsWizard() {

&nbsp; const { entityId } = useParams();

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div>No entity.</div>;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.manufacturing.consumeRawMaterials(

&nbsp;     entityId!,                 // Safe: checked above

&nbsp;     Number(amount),

&nbsp;     description

&nbsp;   );



&nbsp;   navigate(`/entities/${entityId}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">

&nbsp;     <IndustryOperationHeader

&nbsp;       title="Consume Raw Materials"

&nbsp;       subtitle="Moves raw materials to WIP or COGS depending on your process."

&nbsp;     />



&nbsp;     <div className="space-y-4 mt-4">



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Amount to Consume</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;           placeholder="0.00"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;           placeholder="Batch #15 Material Consumption"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <button

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;       >

&nbsp;         Record Raw Material Consumption

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}




import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function RealEstateMaintenanceWizard() {

&nbsp; const { entityId } = useParams();

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div>No entity.</div>;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.realEstate.maintenanceExpense(

&nbsp;     entityId!,

&nbsp;     Number(amount),

&nbsp;     description

&nbsp;   );



&nbsp;   navigate(`/entities/${entityId}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">

&nbsp;     <IndustryOperationHeader

&nbsp;       title="Record Maintenance Expense"

&nbsp;       subtitle="Repairs, upkeep, or property maintenance costs."

&nbsp;     />



&nbsp;     <div className="space-y-4 mt-4">



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Maintenance Cost</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;           placeholder="0.00"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;           placeholder="Plumbing repair for Unit 2A"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <button

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;       >

&nbsp;         Record Maintenance Expense

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}




import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function RealEstateRentIncomeWizard() {

&nbsp; const { entityId } = useParams();

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div>No entity.</div>;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.realEstate.rentIncome(

&nbsp;     entityId!,

&nbsp;     Number(amount),

&nbsp;     description

&nbsp;   );



&nbsp;   navigate(`/entities/${entityId}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">

&nbsp;     <IndustryOperationHeader

&nbsp;       title="Record Rent Income"

&nbsp;       subtitle="Recognize property rental revenue."

&nbsp;     />



&nbsp;     <div className="space-y-4 mt-4">

&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Rent Amount</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;           placeholder="0.00"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;           placeholder="Rent for Unit 3B"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <button

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;       >

&nbsp;         Record Rent Income

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}



import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function RetailPurchaseWizard() {

&nbsp; const { entityId } = useParams();

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div>No entity.</div>;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.retail.purchaseInventory(

&nbsp;     entityId!,                        // FIXED

&nbsp;     Number(amount),

&nbsp;     description

&nbsp;   );



&nbsp;   navigate(`/entities/${entityId}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">

&nbsp;     <IndustryOperationHeader

&nbsp;       title="Purchase Inventory"

&nbsp;       subtitle="Adds inventory and records cash/AP movement automatically."

&nbsp;     />



&nbsp;     <div className="space-y-4">

&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Purchase Amount</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;         />

&nbsp;       </div>



&nbsp;       <button

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;       >

&nbsp;         Record Inventory Purchase

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}




import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function RetailSaleWizard() {

&nbsp; const { entityId } = useParams();

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div>No entity.</div>;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.retail.sale(

&nbsp;     entityId!,

&nbsp;     Number(amount),

&nbsp;     description

&nbsp;   );



&nbsp;   navigate(`/entities/${entityId}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">

&nbsp;     <IndustryOperationHeader

&nbsp;       title="Record Retail Sale"

&nbsp;       subtitle="Captures revenue and reduces inventory automatically."

&nbsp;     />



&nbsp;     <div className="space-y-4">

&nbsp;       {/\* Amount \*/}

&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Sale Amount</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;         />

&nbsp;       </div>



&nbsp;       {/\* Description \*/}

&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;         />

&nbsp;       </div>



&nbsp;       {/\* Submit \*/}

&nbsp;       <button

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;       >

&nbsp;         Record Sale

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}




import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function ServicesClientInvoiceWizard() {

&nbsp; const { entityId } = useParams();

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div>No entity.</div>;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.services.clientInvoice(

&nbsp;     entityId!,

&nbsp;     Number(amount),

&nbsp;     description

&nbsp;   );



&nbsp;   navigate(`/entities/${entityId}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">



&nbsp;     <IndustryOperationHeader

&nbsp;       title="Issue Client Invoice"

&nbsp;       subtitle="Records revenue and accounts receivable for services rendered."

&nbsp;     />



&nbsp;     <div className="space-y-4 mt-4">



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Invoice Amount</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;           placeholder="0.00"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;           placeholder="Client invoice #123"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <button

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;       >

&nbsp;         Record Invoice

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}




import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import IndustryOperationHeader from "../../components/industry/IndustryOperationHeader";

import { TemplateJournalEngine } from "../../domain/templates/TemplateOrchestrator";



export default function ServicesPayContractorWizard() {

&nbsp; const { entityId } = useParams();

&nbsp; const navigate = useNavigate();



&nbsp; const \[amount, setAmount] = useState("");

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if (!entityId) return <div>No entity.</div>;



&nbsp; async function submit() {

&nbsp;   await TemplateJournalEngine.industry.services.payContractor(

&nbsp;     entityId!,

&nbsp;     Number(amount),

&nbsp;     description

&nbsp;   );



&nbsp;   navigate(`/entities/${entityId}/overview`);

&nbsp; }



&nbsp; return (

&nbsp;   <div className="p-6 max-w-lg mx-auto">



&nbsp;     <IndustryOperationHeader

&nbsp;       title="Pay Contractor"

&nbsp;       subtitle="Records contractor expense paid from cash or bank."

&nbsp;     />



&nbsp;     <div className="space-y-4 mt-4">



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Payment Amount</label>

&nbsp;         <input

&nbsp;           type="number"

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={amount}

&nbsp;           onChange={(e) => setAmount(e.target.value)}

&nbsp;           placeholder="0.00"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div>

&nbsp;         <label className="text-sm font-medium">Description (optional)</label>

&nbsp;         <input

&nbsp;           className="border p-2 rounded w-full"

&nbsp;           value={description}

&nbsp;           onChange={(e) => setDescription(e.target.value)}

&nbsp;           placeholder="Contractor payment for project work"

&nbsp;         />

&nbsp;       </div>



&nbsp;       <button

&nbsp;         onClick={submit}

&nbsp;         disabled={!amount}

&nbsp;         className="bg-blue-600 text-white p-3 rounded w-full font-semibold"

&nbsp;       >

&nbsp;         Record Contractor Payment

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}





// src/pages/personal/PersonalDashboard.tsx

import React, { useMemo, useState, type ReactNode } from "react";

import { useQuery } from "@tanstack/react-query";

import { useParams } from "react-router-dom";

import { supabase } from "../../lib/supabase";



import SalaryWizard from "../../domain/templates/personalCapture/SalaryWizard";

import ExpenseWizard from "../../domain/templates/personalCapture/ExpenseWizard";

import TransferWizard from "../../domain/templates/personalCapture/TransferWizard";



type WizardKind = "salary" | "expense" | "transfer" | null;



type PersonalKpis = {

&nbsp; cash\_balance: number;

&nbsp; savings\_balance: number;

&nbsp; net\_worth: number;

&nbsp; as\_of?: string; // date

};



type EconomicEventRow = {

&nbsp; id: string;

&nbsp; description: string | null;

&nbsp; event\_date: string; // date

&nbsp; event\_type: string | null; // economic\_event\_type

&nbsp; created\_at: string; // timestamp

};



export default function PersonalDashboard() {

&nbsp; const { entityId } = useParams<{ entityId: string }>();

&nbsp; if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

&nbsp; const id = entityId;



&nbsp; const \[wizard, setWizard] = useState<WizardKind>(null);



&nbsp; // Personal KPI RPC (DB-supported):contentReference\[oaicite:8]{index=8}

&nbsp; const kpiQuery = useQuery<PersonalKpis>({

&nbsp;   queryKey: \["personal-kpis", id],

&nbsp;   enabled: !!id,

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase.rpc("get\_personal\_kpis", {

&nbsp;       p\_entity\_id: id,

&nbsp;       // p\_as\_of is optional due to DEFAULT CURRENT\_DATE:contentReference\[oaicite:9]{index=9}

&nbsp;     });



&nbsp;     if (error) throw error;



&nbsp;     const obj = (data ?? {}) as Partial<PersonalKpis>;

&nbsp;     return {

&nbsp;       cash\_balance: Number(obj.cash\_balance ?? 0),

&nbsp;       savings\_balance: Number(obj.savings\_balance ?? 0),

&nbsp;       net\_worth: Number(obj.net\_worth ?? 0),

&nbsp;       as\_of: obj.as\_of,

&nbsp;     };

&nbsp;   },

&nbsp;   staleTime: 30\_000,

&nbsp; });



&nbsp; // Recent activity from active view (soft delete safe):contentReference\[oaicite:10]{index=10}

&nbsp; const eventsQuery = useQuery<EconomicEventRow\[]>({

&nbsp;   queryKey: \["recent-events", id],

&nbsp;   enabled: !!id,

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase

&nbsp;       .from("economic\_events\_active")

&nbsp;       .select("id, description, event\_date, event\_type, created\_at")

&nbsp;       .eq("entity\_id", id)

&nbsp;       .order("event\_date", { ascending: false })

&nbsp;       .limit(20);



&nbsp;     if (error) throw error;

&nbsp;     return (data ?? \[]) as EconomicEventRow\[];

&nbsp;   },

&nbsp; });



&nbsp; const KPIs = useMemo(() => kpiQuery.data, \[kpiQuery.data]);



&nbsp; return (

&nbsp;   <div className="space-y-8 p-6">

&nbsp;     <div>

&nbsp;       <h1 className="text-2xl font-bold">Personal Dashboard</h1>

&nbsp;       <p className="text-sm text-gray-600">

&nbsp;         Track personal cash, savings, and net worth. Record events as double-entry economic events.

&nbsp;       </p>

&nbsp;     </div>



&nbsp;     {kpiQuery.isLoading \&\& <div className="text-sm text-gray-600">Loading KPIs…</div>}

&nbsp;     {kpiQuery.error \&\& (

&nbsp;       <div className="text-sm text-red-600">

&nbsp;         Failed to load KPIs: {String((kpiQuery.error as any)?.message ?? kpiQuery.error)}

&nbsp;       </div>

&nbsp;     )}



&nbsp;     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

&nbsp;       <KpiCard label="Cash Balance" value={KPIs?.cash\_balance} />

&nbsp;       <KpiCard label="Savings" value={KPIs?.savings\_balance} />

&nbsp;       <KpiCard label="Net Worth" value={KPIs?.net\_worth} />

&nbsp;     </div>



&nbsp;     <div className="flex flex-wrap gap-3">

&nbsp;       <button onClick={() => setWizard("salary")} className="px-4 py-2 bg-blue-600 text-white rounded">

&nbsp;         + Salary

&nbsp;       </button>

&nbsp;       <button onClick={() => setWizard("expense")} className="px-4 py-2 bg-black text-white rounded">

&nbsp;         + Expense

&nbsp;       </button>

&nbsp;       <button onClick={() => setWizard("transfer")} className="px-4 py-2 bg-green-600 text-white rounded">

&nbsp;         ⇄ Transfer

&nbsp;       </button>

&nbsp;     </div>



&nbsp;     <section className="bg-white border rounded p-4 shadow-sm">

&nbsp;       <div className="flex items-center justify-between">

&nbsp;         <h2 className="font-semibold">Recent Activity</h2>

&nbsp;         {eventsQuery.isLoading \&\& <span className="text-xs text-gray-500">Loading…</span>}

&nbsp;       </div>



&nbsp;       {eventsQuery.error \&\& (

&nbsp;         <div className="text-sm text-red-600 mt-2">

&nbsp;           Failed to load activity: {String((eventsQuery.error as any)?.message ?? eventsQuery.error)}

&nbsp;         </div>

&nbsp;       )}



&nbsp;       <div className="divide-y mt-2">

&nbsp;         {(eventsQuery.data ?? \[]).map((ev) => (

&nbsp;           <div key={ev.id} className="py-2 flex justify-between gap-4 text-sm">

&nbsp;             <span className="min-w-0">

&nbsp;               <span className="text-gray-500">{ev.event\_date}</span>

&nbsp;               <span className="text-gray-400"> — </span>

&nbsp;               <span className="truncate">{ev.description ?? "No description"}</span>

&nbsp;             </span>

&nbsp;             <span className="text-gray-400 whitespace-nowrap">{ev.event\_type ?? "—"}</span>

&nbsp;           </div>

&nbsp;         ))}



&nbsp;         {!eventsQuery.isLoading \&\& (eventsQuery.data?.length ?? 0) === 0 \&\& (

&nbsp;           <div className="py-3 text-sm text-gray-500">No activity yet.</div>

&nbsp;         )}

&nbsp;       </div>

&nbsp;     </section>



&nbsp;     {wizard === "salary" \&\& (

&nbsp;       <Modal onClose={() => setWizard(null)}>

&nbsp;         <SalaryWizard entityId={id} onClose={() => setWizard(null)} />

&nbsp;       </Modal>

&nbsp;     )}

&nbsp;     {wizard === "expense" \&\& (

&nbsp;       <Modal onClose={() => setWizard(null)}>

&nbsp;         <ExpenseWizard entityId={id} onClose={() => setWizard(null)} />

&nbsp;       </Modal>

&nbsp;     )}

&nbsp;     {wizard === "transfer" \&\& (

&nbsp;       <Modal onClose={() => setWizard(null)}>

&nbsp;         <TransferWizard entityId={id} onClose={() => setWizard(null)} />

&nbsp;       </Modal>

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

}



function KpiCard({ label, value }: { label: string; value?: number }) {

&nbsp; const num = typeof value === "number" ? value : 0;

&nbsp; return (

&nbsp;   <div className="p-4 bg-white border rounded shadow-sm">

&nbsp;     <div className="text-gray-500 text-sm">{label}</div>

&nbsp;     <div className="text-xl font-bold">

&nbsp;       {num.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}



function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {

&nbsp; return (

&nbsp;   <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

&nbsp;     <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">

&nbsp;       <button type="button" className="absolute top-2 right-2 text-gray-500" onClick={onClose}>

&nbsp;         ✕

&nbsp;       </button>

&nbsp;       {children}

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}



// src/pages/tabs/BusinessTabs.ts

import type { DashboardTab } from "./types";



export function getBusinessTabs(

&nbsp; entityId: string,

&nbsp; industryType?: string | null

): DashboardTab\[] {

&nbsp; const base: DashboardTab\[] = \[

&nbsp;   { label: "Overview", to: `/entities/${entityId}/overview` },

&nbsp;   { label: "Ledger", to: `/entities/${entityId}/ledger` },

&nbsp;   { label: "Statements", to: `/entities/${entityId}/statements` },

&nbsp;   { label: "Tax \& ECL", to: `/entities/${entityId}/tax-ecl` },

&nbsp;   { label: "Year End", to: `/entities/${entityId}/year-end` },

&nbsp; ];



&nbsp; const showIndustryOps = !!industryType \&\& industryType !== "Generic";



&nbsp; base.push({

&nbsp;   label: "Industry Ops",

&nbsp;   to: `/entities/${entityId}/capture/industry`,

&nbsp;   show: showIndustryOps,

&nbsp; });



&nbsp; return base.filter((t) => t.show !== false);

}





// src/pages/tabs/PersonalTabs.ts

import type { DashboardTab } from "./types";



export function getPersonalTabs(entityId: string): DashboardTab\[] {

&nbsp; return \[

&nbsp;   { label: "Overview", to: `/entities/${entityId}/overview` },

&nbsp;   { label: "Ledger", to: `/entities/${entityId}/ledger` },

&nbsp;   { label: "Statements", to: `/entities/${entityId}/statements` },



&nbsp;   // Personal-only

&nbsp;   { label: "Personal Capture", to: `/entities/${entityId}/capture/personal` },

&nbsp; ];

}





// src/pages/tabs/types.ts



export type DashboardTab = {

&nbsp; label: string;

&nbsp; to: string;

&nbsp; show?: boolean;

};




// src/pages/App.tsx

import { useEffect, useState } from "react";

import { Routes, Route, Navigate } from "react-router-dom";

import type { Session } from "@supabase/supabase-js";



import { supabase } from "../lib/supabase";



import AuthPage from "./AuthPage";

import EntityGate from "./EntityGate";

import EntityCreatePage from "./entity/EntityCreatePage";

import EntityTemplateSetup from "./entity/EntityTemplateSetup";

import ProfilePage from "./ProfilePage";

import EntityDashboard from "./EntityDashboard";



export default function App() {

&nbsp; const \[session, setSession] = useState<Session | null>(null);

&nbsp; const \[loading, setLoading] = useState<boolean>(true);



&nbsp; useEffect(() => {

&nbsp;   let mounted = true;



&nbsp;   // Initial session fetch

&nbsp;   supabase.auth

&nbsp;     .getSession()

&nbsp;     .then(({ data, error }) => {

&nbsp;       if (!mounted) return;

&nbsp;       if (error) console.error("getSession error:", error);

&nbsp;       setSession(data.session);

&nbsp;       setLoading(false);

&nbsp;     })

&nbsp;     .catch((e) => {

&nbsp;       if (!mounted) return;

&nbsp;       console.error("getSession exception:", e);

&nbsp;       setSession(null);

&nbsp;       setLoading(false);

&nbsp;     });



&nbsp;   // Auth state listener

&nbsp;   const { data: listener } = supabase.auth.onAuthStateChange((\_event, nextSession) => {

&nbsp;     if (!mounted) return;

&nbsp;     setSession(nextSession);

&nbsp;   });



&nbsp;   return () => {

&nbsp;     mounted = false;

&nbsp;     listener.subscription.unsubscribe();

&nbsp;   };

&nbsp; }, \[]);



&nbsp; if (loading) {

&nbsp;   return (

&nbsp;     <div className="h-screen flex items-center justify-center">

&nbsp;       Loading…

&nbsp;     </div>

&nbsp;   );

&nbsp; }



&nbsp; // Unauthenticated app surface:

&nbsp; // keep /auth routable, but default to AuthPage

&nbsp; if (!session) {

&nbsp;   return (

&nbsp;     <Routes>

&nbsp;       <Route path="/auth" element={<AuthPage />} />

&nbsp;       <Route path="\*" element={<Navigate to="/auth" replace />} />

&nbsp;     </Routes>

&nbsp;   );

&nbsp; }



&nbsp; // Authenticated app surface

&nbsp; return (

&nbsp;   <Routes>

&nbsp;     <Route path="/auth" element={<Navigate to="/" replace />} />

&nbsp;     <Route path="/" element={<EntityGate />} />

&nbsp;     <Route path="/entities/new" element={<EntityCreatePage />} />

&nbsp;     <Route path="/entities/:entityId/template" element={<EntityTemplateSetup />} />



&nbsp;     <Route path="/profile" element={<ProfilePage />} />



&nbsp;     {/\* Unified enterprise dashboard \*/}

&nbsp;     <Route path="/entities/:entityId/\*" element={<EntityDashboard />} />



&nbsp;     <Route path="\*" element={<Navigate to="/" replace />} />

&nbsp;   </Routes>

&nbsp; );

}




import { useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'



export default function AuthPage() {

&nbsp; const navigate = useNavigate()



&nbsp; const \[email, setEmail] = useState<string>('')

&nbsp; const \[password, setPassword] = useState<string>('')

&nbsp; const \[loading, setLoading] = useState<boolean>(false)

&nbsp; const \[error, setError] = useState<string | null>(null)

&nbsp; const \[mode, setMode] = useState<'signin' | 'signup'>('signin')



&nbsp; async function handleSubmit(e: React.FormEvent) {

&nbsp;   e.preventDefault()

&nbsp;   setLoading(true)

&nbsp;   setError(null)



&nbsp;   let result:

&nbsp;     | Awaited<ReturnType<typeof supabase.auth.signUp>>

&nbsp;     | Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>



&nbsp;   if (mode === 'signup') {

&nbsp;     result = await supabase.auth.signUp({

&nbsp;       email,

&nbsp;       password,

&nbsp;     })

&nbsp;   } else {

&nbsp;     result = await supabase.auth.signInWithPassword({

&nbsp;       email,

&nbsp;       password,

&nbsp;     })

&nbsp;   }



&nbsp;   if (result.error) {

&nbsp;     setError(result.error.message)

&nbsp;     setLoading(false)

&nbsp;   } else {

&nbsp;     navigate('/profile')

&nbsp;   }

&nbsp; }



&nbsp; return (

&nbsp;   <div className="min-h-screen flex items-center justify-center">

&nbsp;     <form onSubmit={handleSubmit} className="w-96 border rounded p-6 space-y-4">

&nbsp;       <h1 className="text-xl font-bold">

&nbsp;         {mode === 'signup' ? 'Create Account' : 'Sign In'}

&nbsp;       </h1>



&nbsp;       {error \&\& <div className="text-red-600 text-sm">{error}</div>}



&nbsp;       <input

&nbsp;         type="email"

&nbsp;         required

&nbsp;         placeholder="Email"

&nbsp;         className="w-full border p-2"

&nbsp;         value={email}

&nbsp;         onChange={e => setEmail(e.target.value)}

&nbsp;       />



&nbsp;       <input

&nbsp;         type="password"

&nbsp;         required

&nbsp;         placeholder="Password"

&nbsp;         className="w-full border p-2"

&nbsp;         value={password}

&nbsp;         onChange={e => setPassword(e.target.value)}

&nbsp;       />



&nbsp;       <button type="submit" disabled={loading} className="w-full bg-black text-white p-2">

&nbsp;         {loading ? 'Please wait…' : mode === 'signup' ? 'Sign Up' : 'Sign In'}

&nbsp;       </button>



&nbsp;       <p className="text-sm text-center">

&nbsp;         {mode === 'signup' ? (

&nbsp;           <>

&nbsp;             Already have an account?{' '}

&nbsp;             <button type="button" className="underline" onClick={() => setMode('signin')}>

&nbsp;               Sign in

&nbsp;             </button>

&nbsp;           </>

&nbsp;         ) : (

&nbsp;           <>

&nbsp;             Don’t have an account?{' '}

&nbsp;             <button type="button" className="underline" onClick={() => setMode('signup')}>

&nbsp;               Sign up

&nbsp;             </button>

&nbsp;           </>

&nbsp;         )}

&nbsp;       </p>

&nbsp;     </form>

&nbsp;   </div>

&nbsp; )

}





// src/pages/EntityDashboard.tsx

import { Routes, Route, Navigate, useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";



import { supabase } from "../lib/supabase";

import DashboardLayout from "../components/layout/DashboardLayout";



import OverviewPage from "./dashboard/OverviewPage";

import LedgerPage from "./dashboard/LedgerPage";

import StatementsPage from "./dashboard/StatementsPage";

import TaxECLPage from "./dashboard/TaxECLPage";

import YearEndPage from "./dashboard/YearEndPage";



import PersonalDashboard from "./personal/PersonalDashboard";

import IndustryRouter from "./industryCapture/IndustryRouter";



import { getBusinessTabs } from "./tabs/BusinessTabs";

import { getPersonalTabs } from "./tabs/PersonalTabs";

import type { DashboardTab } from "./tabs/types";



type EntityRow = {

&nbsp; id: string;

&nbsp; name: string;

&nbsp; type: "Business" | "Personal";

&nbsp; industry\_type?: string | null;

};



export default function EntityDashboard() {

&nbsp; const { entityId } = useParams<{ entityId: string }>();

&nbsp; const id = entityId ?? "";



&nbsp; const entityQuery = useQuery<EntityRow>({

&nbsp;   queryKey: \["entity", id],

&nbsp;   enabled: !!entityId,

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase

&nbsp;       .from("entities")

&nbsp;       .select("id, name, type, industry\_type")

&nbsp;       .eq("id", id)

&nbsp;       .single();



&nbsp;     if (error) throw error;

&nbsp;     return data as EntityRow;

&nbsp;   },

&nbsp; });



&nbsp; // ----------------------------------------------------------

&nbsp; // UI states

&nbsp; // ----------------------------------------------------------

&nbsp; if (!entityId) return <div className="p-4">Missing entityId in route.</div>;



&nbsp; if (entityQuery.isLoading) {

&nbsp;   return <div className="p-4">Loading dashboard…</div>;

&nbsp; }



&nbsp; if (entityQuery.error) {

&nbsp;   return (

&nbsp;     <div className="p-4 text-red-600">

&nbsp;       Failed to load entity:{" "}

&nbsp;       {String((entityQuery.error as any)?.message ?? entityQuery.error)}

&nbsp;     </div>

&nbsp;   );

&nbsp; }



&nbsp; const entity = entityQuery.data;

&nbsp; if (!entity) return <div className="p-4">Entity not found.</div>;



&nbsp; const isBusiness = entity.type === "Business";

&nbsp; const industryType = entity.industry\_type ?? null;

&nbsp; const isIndustryBusiness = isBusiness \&\& !!industryType \&\& industryType !== "Generic";



&nbsp; const tabs: DashboardTab\[] = isBusiness

&nbsp;   ? getBusinessTabs(entityId, industryType)

&nbsp;   : getPersonalTabs(entityId);



&nbsp; return (

&nbsp;   <DashboardLayout entity={entity} tabs={tabs}>

&nbsp;     <Routes>

&nbsp;       {/\* Common \*/}

&nbsp;       <Route path="overview" element={<OverviewPage />} />

&nbsp;       <Route path="ledger" element={<LedgerPage />} />

&nbsp;       <Route path="statements" element={<StatementsPage />} />



&nbsp;       {/\* Business-only \*/}

&nbsp;       {isBusiness \&\& (

&nbsp;         <>

&nbsp;           <Route path="tax-ecl" element={<TaxECLPage />} />

&nbsp;           <Route path="year-end" element={<YearEndPage />} />

&nbsp;         </>

&nbsp;       )}



&nbsp;       {/\* Personal-only \*/}

&nbsp;       {!isBusiness \&\& (

&nbsp;         <Route path="capture/personal/\*" element={<PersonalDashboard />} />

&nbsp;       )}



&nbsp;       {/\* Industry capture only when business + industry != Generic \*/}

&nbsp;       {isIndustryBusiness \&\& (

&nbsp;         <Route

&nbsp;           path="capture/industry/\*"

&nbsp;           element={<IndustryRouter industryType={industryType} />}

&nbsp;         />

&nbsp;       )}



&nbsp;       {/\* Default \*/}

&nbsp;       <Route path="\*" element={<Navigate to="overview" replace />} />

&nbsp;     </Routes>

&nbsp;   </DashboardLayout>

&nbsp; );

}





import { useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";



export default function EntityGate() {

&nbsp; const navigate = useNavigate();



&nbsp; // --- Fetch authenticated user ---

&nbsp; const userQuery = useQuery({

&nbsp;   queryKey: \["user"],

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase.auth.getUser();

&nbsp;     if (error) throw error;

&nbsp;     return data.user;

&nbsp;   }

&nbsp; });



&nbsp; const entitiesQuery = useQuery({

&nbsp;   queryKey: \["entities"],

&nbsp;   enabled: !!userQuery.data, // only fetch after user resolved

&nbsp;   queryFn: async () => {

&nbsp;     const { data, error } = await supabase

&nbsp;       .from("entities")

&nbsp;       .select("id, name")

&nbsp;       .eq("created\_by", userQuery.data!.id);



&nbsp;     if (error) throw error;

&nbsp;     return data;

&nbsp;   }

&nbsp; });



&nbsp; useEffect(() => {

&nbsp; if (userQuery.isLoading || entitiesQuery.isLoading) return;



&nbsp; if (!userQuery.data) {

&nbsp;   navigate("/auth", { replace: true });

&nbsp;   return;

&nbsp; }



&nbsp; const entities = entitiesQuery.data;



&nbsp; if (!entities || entities.length === 0) {

&nbsp;   navigate("/entities/new", { replace: true });

&nbsp;   return;

&nbsp; }



&nbsp; navigate(`/entities/${entities\[0].id}/overview`, { replace: true });

}, \[

&nbsp; userQuery.isLoading,

&nbsp; userQuery.data,

&nbsp; entitiesQuery.isLoading,

&nbsp; entitiesQuery.data,

&nbsp; navigate

]);



&nbsp; return (

&nbsp;   <div className="h-screen flex items-center justify-center">

&nbsp;     <div className="text-gray-500 text-sm">Loading entities…</div>

&nbsp;   </div>

&nbsp; );

}



import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";



/\* ============================================================================

&nbsp;  METRIC COMPONENT

============================================================================ \*/

function Metric({ label, value }: { label: string; value: number | string }) {

&nbsp; return (

&nbsp;   <div className="flex flex-col">

&nbsp;     <span className="text-gray-500 text-xs">{label}</span>

&nbsp;     <span className="font-semibold text-base">

&nbsp;       {new Intl.NumberFormat().format(Number(value) || 0)}

&nbsp;     </span>

&nbsp;   </div>

&nbsp; );

}



/\* ============================================================================

&nbsp;  PROFILE PAGE (REFRESHED)

============================================================================ \*/

export default function ProfilePage() {

&nbsp; const navigate = useNavigate();



&nbsp; const \[user, setUser] = useState<any>(null);

&nbsp; const \[entities, setEntities] = useState<any\[]>(\[]);

&nbsp; const \[snapshots, setSnapshots] = useState<Record<string, any>>({});

&nbsp; const \[loading, setLoading] = useState(true);

&nbsp; const \[error, setError] = useState<string | null>(null);



&nbsp; /\* ============================================================================

&nbsp;    LOAD PROFILE

&nbsp; ============================================================================ \*/

&nbsp; useEffect(() => {

&nbsp;   loadProfile();

&nbsp; }, \[]);



&nbsp; async function loadProfile() {

&nbsp;   try {

&nbsp;     setLoading(true);

&nbsp;     setError(null);



&nbsp;     // 1. Get user

&nbsp;     const { data: authData, error: userErr } = await supabase.auth.getUser();

&nbsp;     if (userErr) throw userErr;



&nbsp;     const user = authData.user;

&nbsp;     if (!user) {

&nbsp;       navigate("/auth");

&nbsp;       return;

&nbsp;     }



&nbsp;     setUser(user);



&nbsp;     // 2. Load entities created by user

&nbsp;     const { data: entityData, error: entityError } = await supabase

&nbsp;       .from("entities")

&nbsp;       .select("\*")

&nbsp;       .eq("created\_by", user.id);



&nbsp;     if (entityError) throw entityError;



&nbsp;     setEntities(entityData || \[]);



&nbsp;     // 3. Load snapshots — parallel RPC calls

&nbsp;     const snapshotCalls = (entityData || \[]).map(async (entity: any) => {

&nbsp;       const { data } = await supabase.rpc("get\_entity\_snapshot", {

&nbsp;         p\_entity\_id: entity.id,

&nbsp;       });

&nbsp;       return { id: entity.id, snapshot: data };

&nbsp;     });



&nbsp;     const resolved = await Promise.all(snapshotCalls);



&nbsp;     const snapshotMap: Record<string, any> = {};

&nbsp;     resolved.forEach((x) => (snapshotMap\[x.id] = x.snapshot));



&nbsp;     setSnapshots(snapshotMap);

&nbsp;   } catch (err: any) {

&nbsp;     setError(err.message || "Could not load profile.");

&nbsp;   } finally {

&nbsp;     setLoading(false);

&nbsp;   }

&nbsp; }



&nbsp; /\* ============================================================================

&nbsp;    SIGN OUT

&nbsp; ============================================================================ \*/

&nbsp; async function handleSignOut() {

&nbsp;   await supabase.auth.signOut();

&nbsp;   navigate("/auth", { replace: true });

&nbsp; }



&nbsp; /\* ============================================================================

&nbsp;    AGGREGATES

&nbsp; ============================================================================ \*/

&nbsp; const totalEntities = entities.length;



&nbsp; const totalEvents = Object.values(snapshots).reduce(

&nbsp;   (sum, s: any) => sum + (s?.event\_count || 0),

&nbsp;   0

&nbsp; );



&nbsp; const aggregateEquity = Object.values(snapshots).reduce(

&nbsp;   (sum, s: any) => sum + (s?.total\_equity || 0),

&nbsp;   0

&nbsp; );



&nbsp; /\* ============================================================================

&nbsp;    LOADING UI

&nbsp; ============================================================================ \*/

&nbsp; if (loading) {

&nbsp;   return (

&nbsp;     <div className="h-screen flex items-center justify-center text-gray-600">

&nbsp;       Loading profile…

&nbsp;     </div>

&nbsp;   );

&nbsp; }



&nbsp; return (

&nbsp;   <div className="min-h-screen bg-gray-50 p-8">

&nbsp;     <div className="max-w-4xl mx-auto space-y-8">



&nbsp;       {/\* ------------------------------------------------------------------ \*/}

&nbsp;       {/\* ERRORS \*/}

&nbsp;       {/\* ------------------------------------------------------------------ \*/}

&nbsp;       {error \&\& (

&nbsp;         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">

&nbsp;           {error}

&nbsp;         </div>

&nbsp;       )}



&nbsp;       {/\* ------------------------------------------------------------------ \*/}

&nbsp;       {/\* PROFILE SUMMARY \*/}

&nbsp;       {/\* ------------------------------------------------------------------ \*/}

&nbsp;       <div className="bg-white rounded-lg border p-6 shadow-sm">

&nbsp;         <h1 className="text-2xl font-bold mb-4">Financial Steward Profile</h1>



&nbsp;         <div className="grid grid-cols-3 gap-6 text-sm">

&nbsp;           <Metric label="Entities" value={totalEntities} />

&nbsp;           <Metric label="Total Events" value={totalEvents} />

&nbsp;           <Metric label="Aggregate Equity" value={aggregateEquity} />

&nbsp;         </div>



&nbsp;         <div className="mt-6 text-gray-600 text-sm space-y-1">

&nbsp;           <p>

&nbsp;             <strong>Email:</strong> {user?.email}

&nbsp;           </p>

&nbsp;           <p>

&nbsp;             <strong>Member Since:</strong>{" "}

&nbsp;             {user?.created\_at

&nbsp;               ? new Date(user.created\_at).toLocaleDateString()

&nbsp;               : "—"}

&nbsp;           </p>

&nbsp;         </div>



&nbsp;         <button

&nbsp;           onClick={handleSignOut}

&nbsp;           className="mt-4 text-red-600 underline text-sm"

&nbsp;         >

&nbsp;           Sign Out

&nbsp;         </button>

&nbsp;       </div>



&nbsp;       {/\* ------------------------------------------------------------------ \*/}

&nbsp;       {/\* ENTITY LIST \*/}

&nbsp;       {/\* ------------------------------------------------------------------ \*/}

&nbsp;       <div className="bg-white rounded-lg border p-6 shadow-sm">

&nbsp;         <div className="flex justify-between mb-6 items-center">

&nbsp;           <h2 className="text-xl font-bold">Economic Entities</h2>



&nbsp;           <button

&nbsp;             onClick={() => navigate("/entities/new")}

&nbsp;             className="bg-black text-white px-4 py-2 rounded text-sm"

&nbsp;           >

&nbsp;             + Create Entity

&nbsp;           </button>

&nbsp;         </div>



&nbsp;         {entities.length === 0 ? (

&nbsp;           <p className="text-gray-500">You have not created any entities yet.</p>

&nbsp;         ) : (

&nbsp;           <div className="grid md:grid-cols-2 gap-6">

&nbsp;             {entities.map((entity) => {

&nbsp;               const s = snapshots\[entity.id] || {};



&nbsp;               return (

&nbsp;                 <div

&nbsp;                   key={entity.id}

&nbsp;                   onClick={() => navigate(`/entities/${entity.id}/overview`)}

&nbsp;                   className="border rounded-lg p-5 cursor-pointer hover:shadow-md transition"

&nbsp;                 >

&nbsp;                   <h3 className="font-semibold text-lg mb-2">{entity.name}</h3>



&nbsp;                   <div className="grid grid-cols-2 gap-4 text-sm">

&nbsp;                     <Metric label="Events" value={s.event\_count} />

&nbsp;                     <Metric label="Net Profit" value={s.net\_profit} />

&nbsp;                     <Metric label="Assets" value={s.total\_assets} />

&nbsp;                     <Metric label="Liabilities" value={s.total\_liabilities} />

&nbsp;                   </div>

&nbsp;                 </div>

&nbsp;               );

&nbsp;             })}

&nbsp;           </div>

&nbsp;         )}

&nbsp;       </div>



&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}





entityRepository.ts is empty currently, 

// src/repositories/eventRepository.ts

import { supabase } from "../lib/supabase";



export async function queryEventsByEntity(entityId: string, filters: any = {}) {

&nbsp; const {

&nbsp;   eventType,

&nbsp;   startDate,

&nbsp;   endDate,

&nbsp;   limit = 100,

&nbsp;   offset = 0,

&nbsp;   orderBy = "event\_date",

&nbsp;   order = "desc",

&nbsp; } = filters;



&nbsp; let query = supabase

&nbsp;   .from("economic\_events\_active")

&nbsp;   .select("\*", { count: "exact" })

&nbsp;   .eq("entity\_id", entityId);



&nbsp; if (eventType) query = query.eq("event\_type", eventType);

&nbsp; if (startDate) query = query.gte("event\_date", startDate);

&nbsp; if (endDate) query = query.lte("event\_date", endDate);



&nbsp; query = query.order(orderBy, { ascending: order === "asc" }).range(offset, offset + limit - 1);



&nbsp; const { data, count, error } = await query;

&nbsp; if (error) throw new Error(error.message);



&nbsp; return { data: data ?? \[], count: count ?? 0 };

}



export async function getEventWithEffects(eventId: string) {

&nbsp; const { data: event, error: eventError } = await supabase

&nbsp;   .from("economic\_events\_active")

&nbsp;   .select("\*")

&nbsp;   .eq("id", eventId)

&nbsp;   .single();



&nbsp; if (eventError) throw new Error(eventError.message);



&nbsp; const { data: effects, error: effectsError } = await supabase

&nbsp;   .from("event\_effects\_active")

&nbsp;   .select("\*")

&nbsp;   .eq("event\_id", eventId)

&nbsp;   .order("created\_at", { ascending: true });



&nbsp; if (effectsError) throw new Error(effectsError.message);



&nbsp; return { event, effects: effects ?? \[] };

}

:root {

&nbsp; font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;

&nbsp; line-height: 1.5;

&nbsp; font-weight: 400;



&nbsp; color-scheme: light dark;

&nbsp; color: rgba(255, 255, 255, 0.87);

&nbsp; background-color: #242424;



&nbsp; font-synthesis: none;

&nbsp; text-rendering: optimizeLegibility;

&nbsp; -webkit-font-smoothing: antialiased;

&nbsp; -moz-osx-font-smoothing: grayscale;

}



a {

&nbsp; font-weight: 500;

&nbsp; color: #646cff;

&nbsp; text-decoration: inherit;

}

a:hover {

&nbsp; color: #535bf2;

}



body {

&nbsp; margin: 0;

&nbsp; display: flex;

&nbsp; place-items: center;

&nbsp; min-width: 320px;

&nbsp; min-height: 100vh;

}



h1 {

&nbsp; font-size: 3.2em;

&nbsp; line-height: 1.1;

}



button {

&nbsp; border-radius: 8px;

&nbsp; border: 1px solid transparent;

&nbsp; padding: 0.6em 1.2em;

&nbsp; font-size: 1em;

&nbsp; font-weight: 500;

&nbsp; font-family: inherit;

&nbsp; background-color: #1a1a1a;

&nbsp; cursor: pointer;

&nbsp; transition: border-color 0.25s;

}

button:hover {

&nbsp; border-color: #646cff;

}

button:focus,

button:focus-visible {

&nbsp; outline: 4px auto -webkit-focus-ring-color;

}



@media (prefers-color-scheme: light) {

&nbsp; :root {

&nbsp;   color: #213547;

&nbsp;   background-color: #ffffff;

&nbsp; }

&nbsp; a:hover {

&nbsp;   color: #747bff;

&nbsp; }

&nbsp; button {

&nbsp;   background-color: #f9f9f9;

&nbsp; }

}




import React from 'react'

import ReactDOM from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './pages/App'

import './index.css'



const queryClient = new QueryClient()



ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(

&nbsp; <React.StrictMode>

&nbsp;   <QueryClientProvider client={queryClient}>

&nbsp;     <BrowserRouter>

&nbsp;       <App />

&nbsp;     </BrowserRouter>

&nbsp;   </QueryClientProvider>

&nbsp; </React.StrictMode>

)






