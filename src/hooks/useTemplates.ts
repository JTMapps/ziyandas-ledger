import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useTemplates() {
  const templates = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_template_groups")
        .select("*")
        .eq("is_active", true)
        .order("template_name");

      if (error) throw error;
      return data;
    }
  });

  return { templates };
}
