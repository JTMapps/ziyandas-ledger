/**
 * Effect Builders
 * ----------------
 * Centralized constructors for accounting effects.
 * Ensures correct effect_sign usage.
 *
 * effect_sign:
 *  +1 = increase
 *  -1 = decrease
 */

export const EffectTypes = {
  CASH: 'CASH',
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE'
}

// -----------------------------
// CASH
// -----------------------------

export function cashIncrease(amount) {
  return {
    effect_type: EffectTypes.CASH,
    amount,
    effect_sign: 1
  }
}

export function cashDecrease(amount) {
  return {
    effect_type: EffectTypes.CASH,
    amount,
    effect_sign: -1
  }
}

// -----------------------------
// ASSET
// -----------------------------

export function assetIncrease(amount) {
  return {
    effect_type: EffectTypes.ASSET,
    amount,
    effect_sign: 1
  }
}

export function assetDecrease(amount) {
  return {
    effect_type: EffectTypes.ASSET,
    amount,
    effect_sign: -1
  }
}

// -----------------------------
// LIABILITY
// -----------------------------

export function liabilityIncrease(amount) {
  return {
    effect_type: EffectTypes.LIABILITY,
    amount,
    effect_sign: -1
  }
}

export function liabilityDecrease(amount) {
  return {
    effect_type: EffectTypes.LIABILITY,
    amount,
    effect_sign: 1
  }
}

// -----------------------------
// INCOME
// -----------------------------

export function incomeRecognized(amount) {
  return {
    effect_type: EffectTypes.INCOME,
    amount,
    effect_sign: -1 // Income reduces equity contra-side for balancing
  }
}

// -----------------------------
// EXPENSE
// -----------------------------

export function expenseRecognized(amount) {
  return {
    effect_type: EffectTypes.EXPENSE,
    amount,
    effect_sign: 1
  }
}
