/**
 * Canonical effect factory
 */
function effect(effectType, amount, sign) {
  return {
    effect_type: effectType,
    amount,
    effect_sign: sign // DR = 1, CR = -1
  }
}

const DR = 1
const CR = -1

/* ============================================================
   REVENUE EARNED (cash sale)
   Dr Cash
   Cr Revenue
============================================================ */

export function revenueEarned({ amount }) {
  return {
    eventType: 'REVENUE_EARNED',
    effects: [
      effect('CASH', amount, DR),
      effect('INCOME', amount, CR)
    ]
  }
}

/* ============================================================
   EXPENSE INCURRED (cash paid)
   Dr Expense
   Cr Cash
============================================================ */

export function expenseIncurred({ amount }) {
  return {
    eventType: 'EXPENSE_INCURRED',
    effects: [
      effect('EXPENSE', amount, DR),
      effect('CASH', amount, CR)
    ]
  }
}

/* ============================================================
   ASSET ACQUIRED (cash purchase)
   Dr Asset
   Cr Cash
============================================================ */

export function assetAcquiredWithCash({ amount }) {
  return {
    eventType: 'ASSET_ACQUIRED',
    effects: [
      effect('ASSET', amount, DR),
      effect('CASH', amount, CR)
    ]
  }
}

/* ============================================================
   ASSET ACQUIRED (financed)
   Dr Asset
   Cr Liability
============================================================ */

export function assetAcquiredWithLiability({ amount }) {
  return {
    eventType: 'ASSET_ACQUIRED',
    effects: [
      effect('ASSET', amount, DR),
      effect('LIABILITY', amount, CR)
    ]
  }
}

/* ============================================================
   LIABILITY INCURRED (loan received)
   Dr Cash
   Cr Liability
============================================================ */

export function liabilityIncurred({ amount }) {
  return {
    eventType: 'LIABILITY_INCURRED',
    effects: [
      effect('CASH', amount, DR),
      effect('LIABILITY', amount, CR)
    ]
  }
}

/* ============================================================
   LIABILITY SETTLED
   Dr Liability
   Cr Cash
============================================================ */

export function liabilitySettled({ amount }) {
  return {
    eventType: 'LIABILITY_SETTLED',
    effects: [
      effect('LIABILITY', amount, DR),
      effect('CASH', amount, CR)
    ]
  }
}

/* ============================================================
   ASSET DISPOSED (simple cash disposal, no gain/loss)
   Dr Cash
   Cr Asset
============================================================ */

export function assetDisposed({ amount }) {
  return {
    eventType: 'ASSET_DISPOSED',
    effects: [
      effect('CASH', amount, DR),
      effect('ASSET', amount, CR)
    ]
  }
}
