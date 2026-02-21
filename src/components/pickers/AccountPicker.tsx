// src/components/pickers/AccountPicker.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { qk } from "../../hooks/queryKeys";

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  display_order: number | null;
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
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");

  const { data: accounts, isLoading, error } = useQuery<Account[]>({
    queryKey: qk.accounts(entityId),
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, account_code, account_name, account_type, display_order")
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("account_code", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Account[];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const list = accounts ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (acc) =>
        acc.account_code.toLowerCase().includes(q) ||
        acc.account_name.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  return (
    <div className="space-y-1 col-span-2">
      <input
        type="text"
        value={search}
        disabled={disabled || isLoading}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded w-full text-sm"
        placeholder="Search accounts…"
      />

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

      {isLoading && <div className="text-xs text-gray-500">Loading accounts…</div>}
      {error && (
        <div className="text-xs text-red-600">
          Failed to load accounts: {String((error as any)?.message ?? error)}
        </div>
      )}
    </div>
  );
}