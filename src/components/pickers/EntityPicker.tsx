import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

interface Props {
  value: string | null;
  onChange: (id: string) => void;
}

export default function EntityPicker({ value, onChange }: Props) {
  const { data: entities } = useQuery({
    queryKey: ["entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name")
        .order("name");

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
      <option value="">Select entity…</option>
      {entities?.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      ))}
    </select>
  );
}
