// src/lib/eventUtils.ts

export type EffectInput = {
  account_id: string;
  amount: number;
  effect_sign: 1 | -1;
  tax_treatment?: string | null;
  deductible?: boolean;
};

export function toDateYYYYMMDD(value: string | Date = new Date()): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: "${value}"`);
  return d.toISOString().slice(0, 10);
}

export function normalizeEffects(effects: EffectInput[]): EffectInput[] {
  return effects.map((e, i) => {
    const amount = Math.abs(Number(e.amount) || 0);
    if (amount <= 0) throw new Error(`Effect line ${i + 1}: amount must be > 0`);
    if (!e.account_id) throw new Error(`Effect line ${i + 1}: account_id is required`);
    return {
      account_id: e.account_id,
      amount,
      effect_sign: e.effect_sign === -1 ? -1 : 1,
      tax_treatment: e.tax_treatment ?? null,
      deductible: e.deductible ?? false,
    };
  });
}

export function assertBalanced(effects: EffectInput[]): void {
  const sum = effects.reduce((acc, e) => acc + e.amount * e.effect_sign, 0);
  if (Math.abs(sum) > 0.0001) {
    throw new Error(
      `Journal entry is not balanced. Net sum = ${sum.toFixed(4)}. Debits must equal credits.`
    );
  }
}