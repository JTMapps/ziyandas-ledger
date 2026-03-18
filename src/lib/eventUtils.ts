// src/lib/eventUtils.ts

export type EffectSign = 1 | -1;

export type EffectInput = {
  account_id: string;
  amount: number;
  effect_sign: EffectSign;

  /**
   * Must match your DB enum public.tax_treatment when provided.
   * We keep this as string because the enum tokens live in the DB schema,
   * and you haven't exported a TS union for them yet.
   */
  tax_treatment?: string | null;

  /**
   * If true, DB requires tax_treatment NOT NULL (your check constraint).
   */
  deductible?: boolean;
};

/**
 * Normalizes date input to yyyy-mm-dd (what your DB expects).
 */
export function toDateYYYYMMDD(value: string | Date = new Date()): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: "${value}"`);
  return d.toISOString().slice(0, 10);
}

function isFinitePositive(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function normalizeTaxTreatment(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/**
 * Ensures effects are:
 * - valid shape
 * - positive amounts
 * - valid debit/credit signs
 * - and DB-compatible re: deductible/tax_treatment
 */
export function normalizeEffects(effects: EffectInput[]): EffectInput[] {
  if (!Array.isArray(effects) || effects.length === 0) {
    throw new Error("At least 1 effect line is required.");
  }

  return effects.map((e, i) => {
    const line = i + 1;

    const account_id = String(e.account_id ?? "").trim();
    if (!account_id) throw new Error(`Effect line ${line}: account_id is required`);

    const rawAmount = Number(e.amount);
    const amount = Math.abs(rawAmount);

    if (!isFinitePositive(amount)) {
      throw new Error(`Effect line ${line}: amount must be a positive number`);
    }

    const effect_sign: EffectSign = e.effect_sign === -1 ? -1 : 1;

    const deductible = Boolean(e.deductible);
    const tax_treatment = normalizeTaxTreatment(e.tax_treatment);

    /**
     * ✅ IMPORTANT: matches your DB constraint:
     * if deductible is true then tax_treatment MUST be provided.
     */
    if (deductible && !tax_treatment) {
      throw new Error(
        `Effect line ${line}: tax_treatment is required when deductible is true`
      );
    }

    return {
      account_id,
      amount,
      effect_sign,
      tax_treatment,
      deductible,
    };
  });
}

/**
 * Validates double-entry balance:
 * sum(amount * sign) must equal 0.
 */
export function assertBalanced(effects: EffectInput[]): void {
  const sum = effects.reduce((acc, e) => acc + e.amount * e.effect_sign, 0);

  if (Math.abs(sum) > 0.0001) {
    throw new Error(
      `Journal entry is not balanced. Net sum = ${sum.toFixed(
        4
      )}. Debits must equal credits.`
    );
  }
}