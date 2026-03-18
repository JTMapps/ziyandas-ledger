// src/pages/dashboard/ledgerActions.ts
//
// Upgrades from previous version:
//   1. "liability" added as a valid Category — Loan actions are liabilities,
//      not equity. This was causing them to appear under the wrong filter pill.
//   2. LOAN_RECEIVED and LOAN_REPAID moved from category "equity" → "liability".
//   3. Industry route paths normalised (no trailing slashes, consistent casing).

import { createSearchParams } from "react-router-dom";

export type Category =
  | "income"
  | "expense"
  | "asset"
  | "liability"
  | "equity"
  | "transfer";

export interface CaptureAction {
  label: string;
  description: string;
  /** Relative to /entities/:entityId/ */
  route: string;
  icon: string;
  category: Category;
}

function makeRoute(path: string) {
  return path.replace(/^\/+/, "");
}

function generalRoute(type: string) {
  return makeRoute(`capture/general?${createSearchParams({ type }).toString()}`);
}

// ─── Generic business ─────────────────────────────────────────────────────────

export const GENERIC_BUSINESS: CaptureAction[] = [
  {
    label: "Cash Sale",
    description: "Record revenue received in cash",
    route: generalRoute("CASH_SALE"),
    icon: "💵",
    category: "income",
  },
  {
    label: "Credit Sale",
    description: "Invoice a customer — creates receivable",
    route: generalRoute("CREDIT_SALE"),
    icon: "🧾",
    category: "income",
  },
  {
    label: "Cash Expense",
    description: "Expense paid directly from cash",
    route: generalRoute("CASH_EXPENSE"),
    icon: "📤",
    category: "expense",
  },
  {
    label: "Expense on Credit",
    description: "Bill received, not yet paid",
    route: generalRoute("EXPENSE_ON_CREDIT"),
    icon: "📋",
    category: "expense",
  },
  {
    label: "Asset Purchase",
    description: "Buy a long-term asset for cash",
    route: generalRoute("ASSET_PURCHASED_CASH"),
    icon: "🏗️",
    category: "asset",
  },
  {
    label: "Depreciation",
    description: "Record period depreciation charge",
    route: generalRoute("DEPRECIATION"),
    icon: "📉",
    category: "asset",
  },
  {
    label: "Loan Received",
    description: "Borrow funds — creates liability",
    route: generalRoute("LOAN_RECEIVED"),
    icon: "🏦",
    category: "liability", // ← was "equity" — FIXED
  },
  {
    label: "Loan Repaid",
    description: "Repay principal on a loan",
    route: generalRoute("LOAN_REPAID"),
    icon: "↩️",
    category: "liability", // ← was "equity" — FIXED
  },
  {
    label: "Owner Investment",
    description: "Capital contributed by the owner",
    route: generalRoute("OWNER_INVESTMENT"),
    icon: "💼",
    category: "equity",
  },
  {
    label: "Owner Withdrawal",
    description: "Drawings taken by the owner",
    route: generalRoute("OWNER_WITHDRAWAL"),
    icon: "💸",
    category: "equity",
  },
];

// ─── Industry action sets ──────────────────────────────────────────────────────

export const RETAIL_ACTIONS: CaptureAction[] = [
  {
    label: "Retail Sale",
    description: "Record a retail sale with COGS",
    route: makeRoute("capture/industry/retail/sale"),
    icon: "🛒",
    category: "income",
  },
  {
    label: "Purchase Inventory",
    description: "Buy inventory from a supplier",
    route: makeRoute("capture/industry/retail/purchase"),
    icon: "📦",
    category: "expense",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Asset Purchase", "Depreciation", "Loan Received", "Loan Repaid", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

export const MANUFACTURING_ACTIONS: CaptureAction[] = [
  {
    label: "Consume Raw Materials",
    description: "Move materials to WIP",
    route: makeRoute("capture/industry/manufacturing/consume"),
    icon: "⚙️",
    category: "expense",
  },
  {
    label: "Complete Production Batch",
    description: "Move WIP to finished goods",
    route: makeRoute("capture/industry/manufacturing/complete"),
    icon: "🏭",
    category: "income",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Cash Sale", "Credit Sale", "Asset Purchase", "Depreciation", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

export const SERVICES_ACTIONS: CaptureAction[] = [
  {
    label: "Client Invoice",
    description: "Invoice a client for services rendered",
    route: makeRoute("capture/industry/services/invoice"),
    icon: "📨",
    category: "income",
  },
  {
    label: "Pay Contractor",
    description: "Pay an external contractor",
    route: makeRoute("capture/industry/services/contractor"),
    icon: "🤝",
    category: "expense",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Cash Expense", "Expense on Credit", "Loan Received", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

export const REAL_ESTATE_ACTIONS: CaptureAction[] = [
  {
    label: "Rent Income",
    description: "Tenant rental payment received",
    route: makeRoute("capture/industry/real-estate/rent-income"),
    icon: "🏠",
    category: "income",
  },
  {
    label: "Maintenance Expense",
    description: "Property maintenance or repair cost",
    route: makeRoute("capture/industry/real-estate/maintenance"),
    icon: "🔧",
    category: "expense",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Asset Purchase", "Depreciation", "Loan Received", "Loan Repaid", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

export const HOSPITALITY_ACTIONS: CaptureAction[] = [
  {
    label: "Room Sale",
    description: "Room night revenue",
    route: makeRoute("capture/industry/hospitality/room-sale"),
    icon: "🛏️",
    category: "income",
  },
  {
    label: "Meal Service",
    description: "Food & beverage service revenue",
    route: makeRoute("capture/industry/hospitality/meal-service"),
    icon: "🍽️",
    category: "income",
  },
  ...GENERIC_BUSINESS.filter((a) =>
    ["Cash Expense", "Expense on Credit", "Asset Purchase", "Depreciation", "Owner Investment", "Owner Withdrawal"].includes(a.label)
  ),
];

export const PERSONAL_ACTIONS: CaptureAction[] = [
  {
    label: "Salary / Income",
    description: "Record a salary or income received",
    route: makeRoute("capture/personal/salary"),
    icon: "💰",
    category: "income",
  },
  {
    label: "Expense",
    description: "Record a personal expense",
    route: makeRoute("capture/personal/expense"),
    icon: "🧾",
    category: "expense",
  },
  {
    label: "Transfer",
    description: "Move money between your accounts",
    route: makeRoute("capture/personal/transfer"),
    icon: "↔️",
    category: "transfer",
  },
];

// ─── Industry resolver ────────────────────────────────────────────────────────

export function getActionsForIndustry(industryType: string): CaptureAction[] {
  switch (industryType) {
    case "Retail":        return RETAIL_ACTIONS;
    case "Manufacturing": return MANUFACTURING_ACTIONS;
    case "Services":      return SERVICES_ACTIONS;
    case "RealEstate":    return REAL_ESTATE_ACTIONS;
    case "Hospitality":   return HOSPITALITY_ACTIONS;
    case "Personal":      return PERSONAL_ACTIONS;
    case "Generic":
    default:
      return GENERIC_BUSINESS;
  }
}