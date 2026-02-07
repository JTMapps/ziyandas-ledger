/**
 * Type definitions and interfaces for economic events system
 * Using JSDoc for IDE type support without TypeScript dependency
 */

/**
 * @typedef {Object} EconomicEvent
 * @property {string} id - UUID
 * @property {string} user_id - UUID of actor
 * @property {string} entity_id - UUID of entity
 * @property {string} event_date - ISO date
 * @property {string} event_type - From economic_event_type enum
 * @property {string} [description] - Optional
 * @property {string} jurisdiction - Default 'ZA'
 * @property {string} [source_reference] - Optional
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} EventEffect
 * @property {string} id - UUID
 * @property {string} event_id - FK to economic_events
 * @property {string} effect_type - From event_effect_type enum
 * @property {number} amount - Signed amount
 * @property {string} currency - Default 'ZAR'
 * @property {string} [related_table] - Optional reference
 * @property {string} [related_record_id] - Optional UUID
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} IncomeRecognition
 * @property {string} id - UUID
 * @property {string} effect_id - FK to event_effects
 * @property {string} recognition_date - ISO date
 * @property {string} income_class - From entity_allowed_income_classes
 * @property {string} tax_treatment - e.g., 'TAXABLE', 'EXEMPT'
 * @property {string} [vat_treatment] - e.g., 'VAT_EXEMPT', 'VAT_STANDARD'
 * @property {number} gross_amount - Total
 * @property {number} net_amount - After deductions
 * @property {string} [counterparty] - Name of payer
 * @property {string} [notes] - Optional
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} ExpenseRecognition
 * @property {string} id - UUID
 * @property {string} effect_id - FK to event_effects
 * @property {string} recognition_date - ISO date
 * @property {string} expense_nature - Category
 * @property {string} [sars_category] - SARS tax category
 * @property {boolean} deductible - Tax deductible flag
 * @property {string} deduction_timing - e.g., 'IMMEDIATE', 'CAPITALIZED'
 * @property {number} amount - Expense amount
 * @property {string} [purpose] - Business purpose
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} AddIncomePayload
 * @property {string} entityId - UUID
 * @property {string} dateReceived - ISO date
 * @property {number} amountNet - Net income
 * @property {string} incomeClass - Category (e.g., 'SALARY', 'BUSINESS_INCOME')
 * @property {string} taxTreatment - e.g., 'TAXABLE'
 * @property {string} [description] - Optional
 * @property {string} [paymentMethod] - Optional
 * @property {string} [counterparty] - Optional payer name
 * @property {number} [grossAmount] - If different from net
 */

/**
 * @typedef {Object} AddExpensePayload
 * @property {string} entityId - UUID
 * @property {string} dateSpent - ISO date
 * @property {number} amount - Expense amount
 * @property {string} category - Category (from expense_category enum or custom)
 * @property {boolean} [isTaxDeductible] - Default false
 * @property {string} [sarsCategory] - SARS deduction category
 * @property {string} [description] - Optional
 * @property {string} [paymentMethod] - Optional
 * @property {string} [notes] - Optional
 */

/**
 * @typedef {Object} ServiceResponse
 * @property {boolean} success - Operation outcome
 * @property {any} data - Response payload
 * @property {string} [error] - Error message if failed
 * @property {EconomicEvent} [event] - Related economic event if created
 * @property {EventEffect[]} [effects] - Related effects if created
 */

/**
 * Economic event type enum
 * @typedef {string} EconomicEventType
 * Possible values:
 *   - CASH_RECEIPT, CASH_DISBURSEMENT
 *   - REVENUE_EARNED, REVENUE_DEFERRED
 *   - EXPENSE_INCURRED, PREPAID_EXPENSE_CREATED, PREPAID_EXPENSE_AMORTIZED
 *   - ASSET_ACQUIRED, ASSET_DISPOSED, ASSET_REVALUED, ASSET_IMPAIRED, ASSET_DEPRECIATED
 *   - LIABILITY_INCURRED, LIABILITY_SETTLED, LIABILITY_REMEASURED, LIABILITY_FORGIVEN
 *   - EQUITY_CONTRIBUTION, EQUITY_DISTRIBUTION, RETAINED_EARNINGS_CLOSED
 *   - TAX_ASSESSED, TAX_PAID, TAX_REFUNDED, TAX_DEFERRED
 *   - CONTRACT_EXECUTED, RIGHT_CREATED, RIGHT_EXPIRED
 */

/**
 * Event effect type enum
 * @typedef {string} EventEffectType
 * Possible values:
 *   - CASH_INCREASE, CASH_DECREASE
 *   - ASSET_INCREASE, ASSET_DECREASE
 *   - LIABILITY_INCREASE, LIABILITY_DECREASE
 *   - EQUITY_INCREASE, EQUITY_DECREASE
 *   - INCOME_RECOGNIZED, EXPENSE_RECOGNIZED
 */

export {
  EconomicEvent,
  EventEffect,
  IncomeRecognition,
  ExpenseRecognition,
  AddIncomePayload,
  AddExpensePayload,
  ServiceResponse,
  EconomicEventType,
  EventEffectType
};
