// src/components/pickers/AccountPicker.tsx
//
// ─── WHY THIS EXISTS ────────────────────────────────────────────────────────
// The original picker showed ALL accounts for every line of every wizard.
// This meant an "Asset debit" line could have Revenue or Expense accounts
// selected — which is accounting nonsense and triggers DB constraint errors.
//
// The reference HTML project encodes the fix clearly: every account has
// type + normalBal metadata, and every journal line is pre-scoped to the
// semantically correct account type before the user can touch it.
//
// This upgraded picker accepts `allowedTypes`, `cashOnly`, and `leafOnly`
// so each wizard line enforces IFRS correctness at the UI level.
//
// ─── IFRS NORMAL BALANCE RULES (from HTML reference COA) ─────────────────
//   ASSET     → normal balance DEBIT   (increase = debit, decrease = credit)
//   LIABILITY → normal balance CREDIT  (increase = credit, decrease = debit)
//   EQUITY    → normal balance CREDIT  (increase = credit, decrease = debit)
//   INCOME    → normal balance CREDIT  (increase = credit, decrease = debit)
//   EXPENSE   → normal balance DEBIT   (increase = debit, decrease = credit)
//
// ─── HOW TO USE IN WIZARDS ──────────────────────────────────────────────────
//
//  Asset Purchase (IAS 16):
//    Dr Fixed Asset:  allowedTypes={["ASSET"]}  leafOnly  (exclude cash)
//    Cr Cash:         allowedTypes={["ASSET"]}  cashOnly  leafOnly
//
//  Cash Sale (IFRS 15):
//    Dr Cash:         allowedTypes={["ASSET"]}  cashOnly  leafOnly
//    Cr Revenue:      allowedTypes={["INCOME"]} leafOnly
//
//  Credit Sale (IFRS 15):
//    Dr Receivable:   allowedTypes={["ASSET"]}  leafOnly  (exclude cash)
//    Cr Revenue:      allowedTypes={["INCOME"]} leafOnly
//
//  Cash Expense:
//    Dr Expense:      allowedTypes={["EXPENSE"]} leafOnly
//    Cr Cash:         allowedTypes={["ASSET"]}   cashOnly leafOnly
//
//  Expense on Credit:
//    Dr Expense:      allowedTypes={["EXPENSE"]}   leafOnly
//    Cr Payable:      allowedTypes={["LIABILITY"]} leafOnly
//
//  Depreciation (IAS 16):
//    Dr Depreciation Expense:    allowedTypes={["EXPENSE"]} leafOnly
//    Cr Accumulated Depreciation: allowedTypes={["ASSET"]}  leafOnly (contra asset)
//
//  Loan Received:
//    Dr Cash:         allowedTypes={["ASSET"]}     cashOnly leafOnly
//    Cr Loan Payable: allowedTypes={["LIABILITY"]} leafOnly
//
//  Loan Repaid:
//    Dr Loan Payable: allowedTypes={["LIABILITY"]} leafOnly
//    Cr Cash:         allowedTypes={["ASSET"]}     cashOnly leafOnly
//
//  Owner Investment:
//    Dr Cash:         allowedTypes={["ASSET"]}  cashOnly leafOnly
//    Cr Equity:       allowedTypes={["EQUITY"]} leafOnly
//
//  Owner Withdrawal:
//    Dr Equity/Drawings: allowedTypes={["EQUITY"]} leafOnly
//    Cr Cash:            allowedTypes={["ASSET"]}  cashOnly leafOnly

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  normal_balance: "DEBIT" | "CREDIT" | null;
  is_cash_account: boolean | null;
  is_contra: boolean | null;
  hierarchy_level: number | null;
  display_order: number | null;
  parent_account_id: string | null;
}

export interface Props {
  entityId: string;
  value: string;
  onChange: (accountId: string, label?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Restrict list to these account types only */
  allowedTypes?: AccountType[];
  /** Only show accounts where is_cash_account = true */
  cashOnly?: boolean;
  /** Exclude parent/header accounts (those that have children) */
  leafOnly?: boolean;
}

const TYPE_BADGE: Record<AccountType, string> = {
  ASSET:     "bg-blue-100   text-blue-700",
  LIABILITY: "bg-red-100    text-red-700",
  EQUITY:    "bg-purple-100 text-purple-700",
  INCOME:    "bg-green-100  text-green-700",
  EXPENSE:   "bg-orange-100 text-orange-700",
};

export default function AccountPicker({
  entityId,
  value,
  onChange,
  placeholder = "Select account…",
  disabled = false,
  allowedTypes,
  cashOnly = false,
  leafOnly = false,
}: Props) {
  const [search, setSearch] = useState("");

  const { data: accounts, isLoading, error } = useQuery<Account[]>({
    queryKey: qk.accounts(entityId),
    enabled: !!entityId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select(
          "id, account_code, account_name, account_type, normal_balance, " +
          "is_cash_account, is_contra, hierarchy_level, display_order, parent_account_id"
        )
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("account_code", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });

  // Build set of IDs that are parents (have at least one child pointing at them)
  const parentIds = useMemo(() => {
    const set = new Set<string>();
    (accounts ?? []).forEach(a => {
      if (a.parent_account_id) set.add(a.parent_account_id);
    });
    return set;
  }, [accounts]);

  const filtered = useMemo(() => {
    let list = accounts ?? [];

    // 1. Account type filter
    if (allowedTypes && allowedTypes.length > 0)
      list = list.filter(a => allowedTypes.includes(a.account_type));

    // 2. Cash-only filter
    if (cashOnly)
      list = list.filter(a => a.is_cash_account === true);

    // 3. Leaf-only filter (exclude header/parent accounts)
    if (leafOnly)
      list = list.filter(a => !parentIds.has(a.id));

    // 4. Search
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        a =>
          a.account_code.toLowerCase().includes(q) ||
          a.account_name.toLowerCase().includes(q)
      );

    return list;
  }, [accounts, parentIds, allowedTypes, cashOnly, leafOnly, search]);

  const selectedAccount = useMemo(
    () => (accounts ?? []).find(a => a.id === value),
    [accounts, value]
  );

  function handleChange(id: string) {
    const acc = (accounts ?? []).find(a => a.id === id);
    const label = acc ? `${acc.account_code} — ${acc.account_name}` : "";
    onChange(id, label);
  }

  const isParentSelected = selectedAccount ? parentIds.has(selectedAccount.id) : false;

  return (
    <div className="space-y-1">
      {/* Search box */}
      <input
        type="text"
        value={search}
        disabled={disabled || isLoading}
        onChange={e => setSearch(e.target.value)}
        className="border rounded px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black"
        placeholder="Search accounts…"
      />

      {/* Select */}
      <select
        disabled={disabled || isLoading || filtered.length === 0}
        value={value}
        onChange={e => handleChange(e.target.value)}
        className="border rounded px-2 py-1.5 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">
          {isLoading
            ? "Loading…"
            : filtered.length === 0
            ? "No matching accounts — check your COA"
            : placeholder}
        </option>
        {filtered.map(acc => {
          const isParent = parentIds.has(acc.id);
          const isContra = acc.is_contra === true;
          return (
            <option key={acc.id} value={acc.id}>
              {acc.account_code} — {acc.account_name}
              {isParent ? " (header)" : ""}
              {isContra ? " [contra]" : ""}
            </option>
          );
        })}
      </select>

      {/* Selected account metadata */}
      {selectedAccount && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              TYPE_BADGE[selectedAccount.account_type] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {selectedAccount.account_type}
          </span>
          {selectedAccount.normal_balance && (
            <span className="text-xs text-gray-400">
              · normal {selectedAccount.normal_balance.toLowerCase()}
            </span>
          )}
          {selectedAccount.is_cash_account && (
            <span className="text-xs text-gray-400">· cash account</span>
          )}
          {selectedAccount.is_contra && (
            <span className="text-xs text-gray-500">· contra account</span>
          )}
          {isParentSelected && (
            <span className="text-xs text-amber-600 font-medium">
              ⚠ Header account — cannot post here
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600">
          {String((error as any)?.message ?? error)}
        </div>
      )}
    </div>
  );
}