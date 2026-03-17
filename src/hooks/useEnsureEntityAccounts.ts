// src/hooks/useEnsureEntityAccounts.ts
import { useMutation } from "@tanstack/react-query";
import { TemplateOrchestrator, type DbEntityType } from "../orchestrators/TemplateOrchestrator";

export function useEnsureEntityAccounts() {
  return useMutation({
    mutationFn: async (args: { entityId: string; entityType: DbEntityType }) => {
      return TemplateOrchestrator.ensureEntityAccounts(args.entityId, args.entityType);
    },
  });
}