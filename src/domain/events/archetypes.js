export const ARCHETYPES = {
  REVENUE: {
    label: 'Revenue',
    items: [
      {
        value: 'CASH_SALE',
        label: 'Cash Sale',
        buildEffects: (amount) => [
          {
            effect_type: 'CASH',
            amount,
            effect_sign: 1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          },
          {
            effect_type: 'INCOME',
            amount,
            effect_sign: -1,
            tax_treatment: 'ORDINARY_INCOME'
          }
        ]
      },

      {
        value: 'CREDIT_SALE',
        label: 'Credit Sale',
        buildEffects: (amount) => [
          {
            effect_type: 'ASSET',
            amount,
            effect_sign: 1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          },
          {
            effect_type: 'INCOME',
            amount,
            effect_sign: -1,
            tax_treatment: 'ORDINARY_INCOME'
          }
        ]
      },

      {
        value: 'REVENUE_REFUND',
        label: 'Revenue Refund',
        buildEffects: (amount) => [
          {
            effect_type: 'INCOME',
            amount,
            effect_sign: 1,
            tax_treatment: 'ORDINARY_INCOME'
          },
          {
            effect_type: 'CASH',
            amount,
            effect_sign: -1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          }
        ]
      }
    ]
  },

  EXPENSE: {
    label: 'Expense',
    items: [
      {
        value: 'CASH_EXPENSE',
        label: 'Cash Expense',
        buildEffects: (amount) => [
          {
            effect_type: 'EXPENSE',
            amount,
            effect_sign: 1,
            tax_treatment: 'OPERATING_EXPENSE',
            deductible: true
          },
          {
            effect_type: 'CASH',
            amount,
            effect_sign: -1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          }
        ]
      },

      {
        value: 'EXPENSE_ON_CREDIT',
        label: 'Expense on Credit',
        buildEffects: (amount) => [
          {
            effect_type: 'EXPENSE',
            amount,
            effect_sign: 1,
            tax_treatment: 'OPERATING_EXPENSE',
            deductible: true
          },
          {
            effect_type: 'LIABILITY',
            amount,
            effect_sign: -1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          }
        ]
      }
    ]
  },

  ASSETS: {
    label: 'Assets',
    items: [
      {
        value: 'ASSET_PURCHASED_CASH',
        label: 'Asset Purchased (Cash)',
        buildEffects: (amount) => [
          {
            effect_type: 'ASSET',
            amount,
            effect_sign: 1,
            tax_treatment: 'CAPITALIZED_COST'
          },
          {
            effect_type: 'CASH',
            amount,
            effect_sign: -1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          }
        ]
      },

      {
        value: 'ASSET_SOLD_WITH_GAIN',
        label: 'Asset Sold (Gain)',
        buildEffects: (amount, bookValue = amount * 0.8) => {
          const gain = amount - bookValue

          return [
            {
              effect_type: 'CASH',
              amount,
              effect_sign: 1,
              tax_treatment: 'BALANCE_SHEET_ONLY'
            },
            {
              effect_type: 'ASSET',
              amount: bookValue,
              effect_sign: -1,
              tax_treatment: 'BALANCE_SHEET_ONLY'
            },
            {
              effect_type: 'INCOME',
              amount: gain,
              effect_sign: -1,
              tax_treatment: 'CAPITAL_GAIN'
            }
          ]
        }
      },

      {
        value: 'DEPRECIATION',
        label: 'Depreciation',
        buildEffects: (amount) => [
          {
            effect_type: 'EXPENSE',
            amount,
            effect_sign: 1,
            tax_treatment: 'OPERATING_EXPENSE',
            deductible: true
          },
          {
            effect_type: 'ASSET',
            amount,
            effect_sign: -1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          }
        ]
      }
    ]
  },

  LIABILITIES: {
    label: 'Liabilities',
    items: [
      {
        value: 'LOAN_RECEIVED',
        label: 'Loan Received',
        buildEffects: (amount) => [
          {
            effect_type: 'CASH',
            amount,
            effect_sign: 1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          },
          {
            effect_type: 'LIABILITY',
            amount,
            effect_sign: -1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          }
        ]
      },

      {
        value: 'LOAN_REPAID',
        label: 'Loan Repaid',
        buildEffects: (amount) => [
          {
            effect_type: 'LIABILITY',
            amount,
            effect_sign: 1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          },
          {
            effect_type: 'CASH',
            amount,
            effect_sign: -1,
            tax_treatment: 'BALANCE_SHEET_ONLY'
          }
        ]
      }
    ]
  },

  EQUITY: {
    label: 'Equity',
    items: [
      {
        value: 'OWNER_INVESTMENT',
        label: 'Owner Investment',
        buildEffects: (amount) => [
          {
            effect_type: 'CASH',
            amount,
            effect_sign: 1,
            tax_treatment: 'OWNER_CONTRIBUTION'
          },
          {
            effect_type: 'EQUITY',
            amount,
            effect_sign: -1,
            tax_treatment: 'OWNER_CONTRIBUTION'
          }
        ]
      },

      {
        value: 'OWNER_WITHDRAWAL',
        label: 'Owner Withdrawal',
        buildEffects: (amount) => [
          {
            effect_type: 'EQUITY',
            amount,
            effect_sign: 1,
            tax_treatment: 'OWNER_DISTRIBUTION'
          },
          {
            effect_type: 'CASH',
            amount,
            effect_sign: -1,
            tax_treatment: 'OWNER_DISTRIBUTION'
          }
        ]
      }
    ]
  }
}
