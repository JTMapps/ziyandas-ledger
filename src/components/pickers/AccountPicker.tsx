// -------------------------------------------------------------
// src/components/common/AccountPicker.tsx
// Reusable account selector for journal entries & other modules
// -------------------------------------------------------------
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

interface Props {
  entityId: string;
  value: string;
  onChange: (accountId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function AccountPicker({
  entityId,
  value,
  onChange,
  placeholder = "Select account…",
  disabled = false
}: Props) {
  const [search, setSearch] = useState("");

  // -------------------------------------------------------------
  // Load accounts for this entity
  // -------------------------------------------------------------
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, account_code, account_name, account_type")
        .eq("entity_id", entityId)
        .order("account_code");

      if (error) throw error;
      return data as Account[];
    }
  });

  // -------------------------------------------------------------
  // Filtered account list (search by code or name)
  // -------------------------------------------------------------
  const filtered = useMemo(() => {
    if (!accounts) return [];
    if (!search) return accounts;

    const s = search.toLowerCase();
    return accounts.filter(
      (acc) =>
        acc.account_code.toLowerCase().includes(s) ||
        acc.account_name.toLowerCase().includes(s)
    );
  }, [accounts, search]);

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <div className="space-y-1">
      {/* Search field */}
      <input
        type="text"
        value={search}
        disabled={disabled || isLoading}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded w-full text-sm"
        placeholder="Search accounts…"
      />

      {/* Select dropdown */}
      <select
        disabled={disabled || isLoading}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border p-2 rounded w-full text-sm bg-white"
      >
        <option value="">{placeholder}</option>

        {filtered.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.account_code} — {acc.account_name} ({acc.account_type})
          </option>
        ))}
      </select>

      {isLoading && (
        <div className="text-xs text-gray-500">Loading accounts…</div>
      )}
    </div>
  );
}
