import { useEffect, useState } from 'react'
import { useEntity } from '../../../context/EntityContext'
import {
  getCashFlow,
  getIncomeStatement,
  getBalanceSheet,
  getTaxSummary,
  getMonthlySummary
} from '../../../services/analyticsService'

const VIEWS = ['INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'TAX_SUMMARY', 'MONTHLY']

export default function AnalyticsTab() {
  const { entity } = useEntity()

  const [view, setView] = useState('INCOME_STATEMENT')
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Data states
  const [incomeStatement, setIncomeStatement] = useState(null)
  const [balanceSheet, setBalanceSheet] = useState(null)
  const [cashFlow, setCashFlow] = useState(null)
  const [taxSummary, setTaxSummary] = useState(null)
  const [monthlyData, setMonthlyData] = useState(null)

  useEffect(() => {
    if (entity) {
      loadData()
    }
  }, [entity, view, year])

  async function loadData() {
    if (!entity) return
    setLoading(true)
    setError(null)

    try {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      if (view === 'INCOME_STATEMENT') {
        const result = await getIncomeStatement(entity.id, startDate, endDate)
        if (result.success) {
          setIncomeStatement(result.data)
        } else {
          setError(result.error)
        }
      } else if (view === 'BALANCE_SHEET') {
        const result = await getBalanceSheet(entity.id)
        if (result.success) {
          setBalanceSheet(result.data)
        } else {
          setError(result.error)
        }
      } else if (view === 'CASH_FLOW') {
        const result = await getCashFlow(entity.id, startDate, endDate, 'MONTHLY')
        if (result.success) {
          setCashFlow(result.data)
        } else {
          setError(result.error)
        }
      } else if (view === 'TAX_SUMMARY') {
        const result = await getTaxSummary(entity.id, year)
        if (result.success) {
          setTaxSummary(result.data)
        } else {
          setError(result.error)
        }
      } else if (view === 'MONTHLY') {
        const result = await getMonthlySummary(entity.id, year)
        if (result.success) {
          setMonthlyData(result.data)
        } else {
          setError(result.error)
        }
      }
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  if (!entity) {
    return <div className="p-6 text-gray-500">Select an entity first</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics & Reports</h1>
        <div className="flex gap-2">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="border p-2 rounded text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b">
        {VIEWS.map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 font-medium transition ${
              view === v
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {v.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && <p className="text-gray-500">Loading analytics...</p>}

      {/* INCOME STATEMENT */}
      {!loading && view === 'INCOME_STATEMENT' && incomeStatement && (
        <div className="space-y-4">
          <div className="bg-white border rounded p-6 space-y-4">
            <h2 className="font-semibold text-lg">Income Statement</h2>

            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="font-semibold">Total Income</span>
                <span className="text-blue-600 font-bold">
                  R {incomeStatement.totalIncome?.toFixed(2) || '0.00'}
                </span>
              </div>

              <div className="px-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Income by Class:</span>
                </div>
                {Object.entries(incomeStatement.incomeByClass || {}).map(([cls, val]) => (
                  <div key={cls} className="flex justify-between text-gray-600">
                    <span>{cls}</span>
                    <span>R {val.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between py-2 border-b border-t">
                <span className="font-semibold">Total Expenses</span>
                <span className="text-red-600 font-bold">
                  R {incomeStatement.totalExpenses?.toFixed(2) || '0.00'}
                </span>
              </div>

              <div className="px-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Deductible Expenses:</span>
                  <span className="text-green-600">
                    R {incomeStatement.deductibleExpenses?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Non-Deductible Expenses:</span>
                  <span className="text-orange-600">
                    R {incomeStatement.nonDeductibleExpenses?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <div className="px-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Expense by Nature:</span>
                </div>
                {Object.entries(incomeStatement.expenseByNature || {}).map(([nat, val]) => (
                  <div key={nat} className="flex justify-between text-gray-600">
                    <span>{nat}</span>
                    <span>R {val.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between py-2 border-y font-semibold bg-gray-50">
                <span>Net Income</span>
                <span className={incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                  R {incomeStatement.netIncome?.toFixed(2) || '0.00'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span>Taxable Income</span>
                <span className="font-semibold">
                  R {incomeStatement.taxableIncome?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BALANCE SHEET */}
      {!loading && view === 'BALANCE_SHEET' && balanceSheet && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Assets */}
            <div className="bg-white border rounded p-6 space-y-3">
              <h3 className="font-semibold text-lg">Assets</h3>
              <div className="space-y-2">
                {Object.entries(balanceSheet.assets || {}).map(([type, val]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-gray-700">{type}</span>
                    <span className="font-semibold">R {val.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 border-t font-bold">
                <span>Total Assets</span>
                <span className="text-blue-600">
                  R {balanceSheet.totalAssets?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {/* Liabilities */}
            <div className="bg-white border rounded p-6 space-y-3">
              <h3 className="font-semibold text-lg">Liabilities</h3>
              <div className="space-y-2">
                {Object.entries(balanceSheet.liabilities || {}).map(([type, val]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-gray-700">{type}</span>
                    <span className="font-semibold">R {val.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 border-t font-bold">
                <span>Total Liabilities</span>
                <span className="text-red-600">
                  R {balanceSheet.totalLiabilities?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="bg-gray-50 border rounded p-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Net Equity</span>
              <span className={`text-2xl font-bold ${balanceSheet.equity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R {balanceSheet.equity?.toFixed(2) || '0.00'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Assets - Liabilities = {balanceSheet.totalAssets?.toFixed(2)} - {balanceSheet.totalLiabilities?.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* CASH FLOW */}
      {!loading && view === 'CASH_FLOW' && cashFlow && (
        <div className="space-y-4">
          <div className="bg-white border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-right">Inflow</th>
                  <th className="px-4 py-2 text-right">Outflow</th>
                  <th className="px-4 py-2 text-right">Net</th>
                  <th className="px-4 py-2 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {(cashFlow || []).map((row, idx) => (
                  <tr key={idx} className={idx % 2 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-2">{row?.date || ''}</td>
                    <td className="px-4 py-2 text-right text-green-600">
                      R {(row?.inflow || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-red-600">
                      R {(row?.outflow || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      R {(row?.net || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">
                      R {(row?.runningBalance || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAX SUMMARY */}
      {!loading && view === 'TAX_SUMMARY' && taxSummary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border rounded p-6 space-y-3">
              <h3 className="font-semibold">Income Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Gross Income</span>
                  <span className="font-semibold">
                    R {taxSummary.grossIncome?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax Exempt Income</span>
                  <span className="font-semibold text-green-600">
                    R {taxSummary.taxExemptIncome?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-b">
                  <span className="font-semibold">Taxable Income</span>
                  <span className="font-bold">
                    R {taxSummary.taxableIncome?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded p-6 space-y-3">
              <h3 className="font-semibold">Expense Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Deductible Expenses</span>
                  <span className="font-semibold text-green-600">
                    R {taxSummary.deductibleExpenses?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Non-Deductible Exp.</span>
                  <span className="font-semibold text-red-600">
                    R {taxSummary.nonDeductibleExpenses?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-b">
                  <span className="font-semibold">Total Expenses</span>
                  <span className="font-bold">
                    R {(taxSummary.deductibleExpenses + taxSummary.nonDeductibleExpenses)?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-6">
            <div className="text-sm text-gray-700 mb-3">
              <p className="mb-2"><strong>Tax Base Calculation (SARS)</strong></p>
              <p className="flex justify-between">
                <span>Taxable Income:</span>
                <span>R {taxSummary.taxableIncome?.toFixed(2) || '0.00'}</span>
              </p>
              <p className="flex justify-between">
                <span>Less: Deductible Expenses:</span>
                <span>- R {taxSummary.deductibleExpenses?.toFixed(2) || '0.00'}</span>
              </p>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Effective Tax Base</span>
              <span className="text-blue-600">
                R {taxSummary.effectiveTaxBase?.toFixed(2) || '0.00'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              At 28% corporate tax rate: R {((taxSummary.effectiveTaxBase || 0) * 0.28).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* MONTHLY */}
      {!loading && view === 'MONTHLY' && monthlyData && (
        <div className="space-y-4">
          <div className="bg-white border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Month</th>
                  <th className="px-4 py-2 text-right">Income</th>
                  <th className="px-4 py-2 text-right">Expenses</th>
                  <th className="px-4 py-2 text-right">Net Profit</th>
                  <th className="px-4 py-2 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {(monthlyData || []).map((month, idx) => {
                  const income = month?.income || 0
                  const expense = month?.expense || 0
                  const net = month?.net || 0
                  return (
                    <tr key={idx} className={idx % 2 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-2 font-semibold">{month?.month || ''}</td>
                      <td className="px-4 py-2 text-right text-green-600 font-semibold">
                        R {income.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-red-600 font-semibold">
                        R {expense.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2 text-right font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R {net.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {net >= 0 ? '📈' : '📉'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border rounded p-4">
              <p className="text-gray-600 text-sm">Average Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">
                R {((monthlyData || []).reduce((sum, m) => sum + (m?.income || 0), 0) / 12).toFixed(2)}
              </p>
            </div>
            <div className="bg-white border rounded p-4">
              <p className="text-gray-600 text-sm">Average Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                R {((monthlyData || []).reduce((sum, m) => sum + (m?.expense || 0), 0) / 12).toFixed(2)}
              </p>
            </div>
            <div className="bg-white border rounded p-4">
              <p className="text-gray-600 text-sm">Average Monthly Net</p>
              <p className="text-2xl font-bold text-blue-600">
                R {((monthlyData || []).reduce((sum, m) => sum + (m?.net || 0), 0) / 12).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
