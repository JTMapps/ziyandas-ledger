// ------------------------------------------------------------
// INDUSTRY CAPTURE RULES
// Each industry converts business actions → double-entry journal
// ------------------------------------------------------------

import { AppliedAccount } from "../business/businessChartOfAccounts";

function findAccount(accounts: AppliedAccount[], code: string) {
  const acc = accounts.find(a => a.account_code === code);
  if (!acc) throw new Error(`Account not found: ${code}`);
  return acc.id;
}

export const IndustryCaptureRules = {
  // ------------------------------------------------------------
  // RETAIL
  // ------------------------------------------------------------
  retail: {
    sale: (
      accounts: AppliedAccount[],
      { amount, description = "Retail Sale" }: { amount: number; description?: string }
    ) => {
      const cash = findAccount(accounts, "1100");
      const revenue = findAccount(accounts, "4000");

      return {
        eventType: "RETAIL_SALE",
        description,
        effects: [
          { account_id: cash, amount, effect_sign: 1 },
          { account_id: revenue, amount, effect_sign: -1 },
        ],
      };
    },

    purchaseInventory: (
      accounts: AppliedAccount[],
      { amount, description = "Inventory Purchase" }: { amount: number; description?: string }
    ) => {
      const inventory = findAccount(accounts, "1200");
      const cash = findAccount(accounts, "1100");

      return {
        eventType: "RETAIL_INVENTORY_PURCHASE",
        description,
        effects: [
          { account_id: inventory, amount, effect_sign: 1 },
          { account_id: cash, amount, effect_sign: -1 },
        ],
      };
    },
  },

  // ------------------------------------------------------------
  // MANUFACTURING
  // ------------------------------------------------------------
  manufacturing: {
    consumeRawMaterials: (
      accounts: AppliedAccount[],
      { amount, description = "Consume Raw Materials" }: { amount: number; description?: string }
    ) => {
      const raw = findAccount(accounts, "1200");
      const wip = findAccount(accounts, "1210");

      return {
        eventType: "MANUFACTURING_WIP_CONSUMPTION",
        description,
        effects: [
          { account_id: wip, amount, effect_sign: 1 },
          { account_id: raw, amount, effect_sign: -1 },
        ],
      };
    },

    completeProductionBatch: (
      accounts: AppliedAccount[],
      { amount, description = "Production Completed" }: { amount: number; description?: string }
    ) => {
      const wip = findAccount(accounts, "1210");
      const finished = findAccount(accounts, "1220");

      return {
        eventType: "MANUFACTURING_FINISHED_GOODS",
        description,
        effects: [
          { account_id: finished, amount, effect_sign: 1 },
          { account_id: wip, amount, effect_sign: -1 },
        ],
      };
    },
  },

  // ------------------------------------------------------------
  // SERVICES
  // ------------------------------------------------------------
  services: {
    clientInvoice: (
      accounts: AppliedAccount[],
      { amount, description = "Service Revenue" }: { amount: number; description?: string }
    ) => {
      const receivable = findAccount(accounts, "1200");
      const revenue = findAccount(accounts, "4000");

      return {
        eventType: "SERVICE_REVENUE",
        description,
        effects: [
          { account_id: receivable, amount, effect_sign: 1 },
          { account_id: revenue, amount, effect_sign: -1 },
        ],
      };
    },

    payContractor: (
      accounts: AppliedAccount[],
      { amount, description = "Contractor Expense" }: { amount: number; description?: string }
    ) => {
      const contractor = findAccount(accounts, "5000");
      const cash = findAccount(accounts, "1100");

      return {
        eventType: "SERVICE_CONTRACTOR_EXPENSE",
        description,
        effects: [
          { account_id: contractor, amount, effect_sign: 1 },
          { account_id: cash, amount, effect_sign: -1 },
        ],
      };
    },
  },

  // ------------------------------------------------------------
  // HOSPITALITY
  // ------------------------------------------------------------
  hospitality: {
    roomSale: (
      accounts: AppliedAccount[],
      { amount, description = "Room Sale" }: { amount: number; description?: string }
    ) => {
      const cash = findAccount(accounts, "1100");
      const revenue = findAccount(accounts, "4000");

      return {
        eventType: "HOSPITALITY_ROOM_SALE",
        description,
        effects: [
          { account_id: cash, amount, effect_sign: 1 },
          { account_id: revenue, amount, effect_sign: -1 },
        ],
      };
    },

    serviceMeal: (
      accounts: AppliedAccount[],
      { amount, description = "Meal Sale" }: { amount: number; description?: string }
    ) => {
      const cash = findAccount(accounts, "1100");
      const fnbRevenue = findAccount(accounts, "4100");

      return {
        eventType: "HOSPITALITY_MEAL_SALE",
        description,
        effects: [
          { account_id: cash, amount, effect_sign: 1 },
          { account_id: fnbRevenue, amount, effect_sign: -1 },
        ],
      };
    },
  },

  // ------------------------------------------------------------
  // REAL ESTATE
  // ------------------------------------------------------------
  realEstate: {
    rentIncome: (
      accounts: AppliedAccount[],
      { amount, description = "Rent Income" }: { amount: number; description?: string }
    ) => {
      const cash = findAccount(accounts, "1100");
      const rentIncome = findAccount(accounts, "4000");

      return {
        eventType: "REAL_ESTATE_RENT_INCOME",
        description,
        effects: [
          { account_id: cash, amount, effect_sign: 1 },
          { account_id: rentIncome, amount, effect_sign: -1 },
        ],
      };
    },

    maintenanceExpense: (
      accounts: AppliedAccount[],
      { amount, description = "Maintenance Expense" }: { amount: number; description?: string }
    ) => {
      const expense = findAccount(accounts, "5000");
      const cash = findAccount(accounts, "1100");

      return {
        eventType: "REAL_ESTATE_MAINTENANCE_EXPENSE",
        description,
        effects: [
          { account_id: expense, amount, effect_sign: 1 },
          { account_id: cash, amount, effect_sign: -1 },
        ],
      };
    },
  },
};
