import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

interface Props {
  entityId: string;
  value: string | null;
  onChange: (id: string) => void;
}

export default function AccountPicker({ entityId, value, onChange }: Props) {
  const { data: accounts } = useQuery({
    queryKey: ["accounts", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, account_code, account_name")
        .eq("entity_id", entityId)
        .order("account_code");

      if (error) throw error;
      return data;
    }
  });

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="border p-2 rounded"
    >
      <option value="">Select account…</option>
      {accounts?.map((a) => (
        <option key={a.id} value={a.id}>
          {a.account_code} — {a.account_name}
        </option>
      ))}
    </select>
  );
}
