import { AppliedAccount } from "./businessChartOfAccounts";

// ------------------------------------------------------------
// Helper
// ------------------------------------------------------------
function findAccount(accounts: AppliedAccount[], code: string): AppliedAccount {
  const acc = accounts.find(a => a.account_code === code);
  if (!acc) throw new Error(`Account ${code} not found`);
  return acc;
}

export interface BusinessCaptureInput {
  amount: number;
  description?: string;
}

// ------------------------------------------------------------
// BUSINESS CAPTURE RULES (convert business operations → journals)
// ------------------------------------------------------------

export const BusinessCaptureRules = {
  revenue(accounts: AppliedAccount[], input: BusinessCaptureInput) {
    const cash = findAccount(accounts, "1100");
    const revenue = findAccount(accounts, "4000");

    return {
      eventType: "BUSINESS_REVENUE",
      description: input.description ?? "Revenue recognised",
      effects: [
        { account_id: cash.id, amount: input.amount, effect_sign: 1 },
        { account_id: revenue.id, amount: input.amount, effect_sign: -1 }
      ]
    };
  },

  expense(accounts: AppliedAccount[], input: BusinessCaptureInput) {
    const expense = findAccount(accounts, "6000");
    const cash = findAccount(accounts, "1100");

    return {
      eventType: "BUSINESS_EXPENSE",
      description: input.description ?? "Operating expense",
      effects: [
        { account_id: expense.id, amount: input.amount, effect_sign: 1 },
        { account_id: cash.id, amount: input.amount, effect_sign: -1 }
      ]
    };
  }
};
