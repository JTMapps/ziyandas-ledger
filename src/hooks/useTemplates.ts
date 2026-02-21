import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { qk } from "./queryKeys";

export type TemplateGroupRow = {
  id: string;
  template_name: string;
  entity_type: "Business" | "Personal" | string;
  is_active: boolean;
  version_number: number;
  created_at?: string;
};

type UseTemplatesOptions = {
  entityType?: "Business" | "Personal";
};

export function useTemplates(opts: UseTemplatesOptions = {}) {
  const templatesQuery = useQuery<TemplateGroupRow[]>({
    queryKey: qk.templates(),
    queryFn: async () => {
      let query = supabase
        .from("account_template_groups")
        .select("id, template_name, entity_type, is_active, version_number, created_at")
        .eq("is_active", true);

      if (opts.entityType) {
        query = query.eq("entity_type", opts.entityType);
      }

      // Prefer deterministic ordering: name, entity_type, latest version first
      const { data, error } = await query
        .order("template_name", { ascending: true })
        .order("entity_type", { ascending: true })
        .order("version_number", { ascending: false });

      if (error) throw error;
      return (data ?? []) as TemplateGroupRow[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour: templates rarely change
  });

  return {
    templatesQuery,
    templates: templatesQuery.data ?? [],
  };
}