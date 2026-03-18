// src/hooks/useEnsureEntityAccounts.ts
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useEnsureEntityAccounts() {
  return useMutation({
    mutationFn: async (params: { entityId: string; entityType: string }) => {
      const { entityId, entityType } = params;

      // 1) Does selection exist?
      const sel = await supabase
        .from("entity_template_selection")
        .select("template_group_id")
        .eq("entity_id", entityId)
        .maybeSingle();

      if (sel.error) throw sel.error;

      // 2) Do accounts exist?
      const acc = await supabase
        .from("accounts")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .is("deleted_at", null);

      if (acc.error) throw acc.error;

      const hasAccounts = (acc.count ?? 0) > 0;

      // ✅ If already selected and accounts exist → nothing to do
      if (sel.data?.template_group_id && hasAccounts) return { ok: true, didWork: false };

      // ✅ If selected but accounts missing → materialize accounts (NO reassignment)
      if (sel.data?.template_group_id && !hasAccounts) {
        const { error } = await supabase.rpc("apply_template_to_entity", {
          p_entity_id: entityId,
          p_template_group_id: sel.data.template_group_id,
        });
        if (error) throw error;
        return { ok: true, didWork: true };
      }

      // ✅ If no selection → assign default template ONCE
      // NOTE: this will still explode if your DB trigger disallows updates
      // but since there's no row yet, it should INSERT and pass.
      const { data, error } = await supabase.rpc("assign_template_to_entity", {
        p_entity_id: entityId,
        p_entity_type: entityType,
      });
      if (error) throw error;

      return { ok: true, didWork: true, template_group_id: data };
    },
  });
}