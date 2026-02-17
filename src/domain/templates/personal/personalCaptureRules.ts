import { AppliedAccount } from "./personalChartOfAccounts";

// ------------------------------------------------------------
// Helper
// ------------------------------------------------------------
function findAccount(accounts: AppliedAccount[], code: string): AppliedAccount {
  const acc = accounts.find(a => a.account_code === code);
  if (!acc) throw new Error(`Account ${code} not found`);
  return acc;
}

// ------------------------------------------------------------
// PERSONAL CAPTURE INPUT TYPES
// ------------------------------------------------------------
export interface SalaryInput {
  amount: number;
  source?: string;
}

export interface ExpenseInput {
  amount: number;
  category?: string;
}

export interface TransferInput {
  amount: number;
  from_code: string;
  to_code: string;
}

// ------------------------------------------------------------
// PERSONAL CAPTURE RULES (automatic journals)
// ------------------------------------------------------------

export const PersonalCaptureRules = {
  salary(accounts: AppliedAccount[], input: SalaryInput) {
    const cash = findAccount(accounts, "100");
    const income = findAccount(accounts, "400");

    return {
      eventType: "PERSONAL_SALARY",
      description: input.source ?? "Salary",
      effects: [
        { account_id: cash.id, amount: input.amount, effect_sign: 1 },
        { account_id: income.id, amount: input.amount, effect_sign: -1 }
      ]
    };
  },

  expense(accounts: AppliedAccount[], input: ExpenseInput) {
    const cash = findAccount(accounts, "100");
    const expense = findAccount(accounts, "500");

    return {
      eventType: "PERSONAL_EXPENSE",
      description: input.category ?? "Expense",
      effects: [
        { account_id: expense.id, amount: input.amount, effect_sign: 1 },
        { account_id: cash.id, amount: input.amount, effect_sign: -1 }
      ]
    };
  },

  transfer(accounts: AppliedAccount[], input: TransferInput) {
    const from = findAccount(accounts, input.from_code);
    const to = findAccount(accounts, input.to_code);

    return {
      eventType: "PERSONAL_TRANSFER",
      description: "Internal transfer",
      effects: [
        { account_id: to.id, amount: input.amount, effect_sign: 1 },
        { account_id: from.id, amount: input.amount, effect_sign: -1 }
      ]
    };
  }
};
