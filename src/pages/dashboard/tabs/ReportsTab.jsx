import { useEffect, useState } from 'react'
import { useEntity } from '../../../context/EntityContext'
import {
  getCashFlow,
  getIncomeStatement,
  getBalanceSheet,
  getTaxSummary,
  getMonthlySummary
} from '../../../services/analyticsService'
import { getTableAuditLog } from '../../../services/auditService'

const REPORT_TYPES = [
  { id: 'INCOME_STATEMENT', label: 'Income Statement', icon: '📊' },
  { id: 'BALANCE_SHEET', label: 'Balance Sheet', icon: '⚖️' },
  { id: 'TAX_REPORT', label: 'Tax Compliance Report', icon: '🏛️' },
  { id: 'CASH_FLOW_STATEMENT', label: 'Cash Flow Statement', icon: '💰' },
  { id: 'AUDIT_TRAIL', label: 'Audit Trail', icon: '📋' }
]

export default function ReportsTab() {
  const { entity } = useEntity()

  const [selectedReport, setSelectedReport] = useState('INCOME_STATEMENT')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (entity && selectedReport) {
      generateReport()
    }
  }, [entity, selectedReport, year, month])

  async function generateReport() {
    if (!entity) return
    setLoading(true)
    setError(null)

    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-${getDaysInMonth(year, month)}`

      let data = null

      if (selectedReport === 'INCOME_STATEMENT') {
        try {
          const result = await getIncomeStatement(entity.id, startDate, endDate)
          data = result?.success ? result.data : null
        } catch (e) {
          console.error('Error loading income statement:', e)
          setError('Failed to load income statement: ' + e.message)
        }
      } else if (selectedReport === 'BALANCE_SHEET') {
        try {
          const result = await getBalanceSheet(entity.id)
          data = result?.success ? result.data : { assets: {}, liabilities: {}, totalAssets: 0, totalLiabilities: 0, equity: 0 }
        } catch (e) {
          console.error('Error loading balance sheet:', e)
          data = { assets: {}, liabilities: {}, totalAssets: 0, totalLiabilities: 0, equity: 0 }
        }
      } else if (selectedReport === 'TAX_REPORT') {
        try {
          const result = await getTaxSummary(entity.id, year)
          data = result?.success ? result.data : { grossIncome: 0, taxableIncome: 0, taxExemptIncome: 0, deductibleExpenses: 0, nonDeductibleExpenses: 0, effectiveTaxBase: 0 }
        } catch (e) {
          console.error('Error loading tax report:', e)
          data = { grossIncome: 0, taxableIncome: 0, taxExemptIncome: 0, deductibleExpenses: 0, nonDeductibleExpenses: 0, effectiveTaxBase: 0 }
        }
      } else if (selectedReport === 'CASH_FLOW_STATEMENT') {
        try {
          const result = await getCashFlow(entity.id, startDate, endDate, 'DAILY')
          data = result?.success ? result.data : []
        } catch (e) {
          console.error('Error loading cash flow:', e)
          data = []
        }
      } else if (selectedReport === 'AUDIT_TRAIL') {
        try {
          const result = await getTableAuditLog('economic_events', { limit: 100 })
          data = result?.success ? result.data : []
        } catch (e) {
          console.error('Error loading audit trail:', e)
          data = []
        }
      }

      if (data !== null) {
        setReportData(data)
      } else if (!error) {
        setError('Failed to generate report')
      }
    } catch (err) {
      console.error('Report generation error:', err)
      setError(err.message || 'Failed to generate report')
    }

    setLoading(false)
  }

  function getDaysInMonth(y, m) {
    return new Date(y, m, 0).getDate()
  }

  function exportToCSV(filename, data) {
    let csvContent = ''

    if (selectedReport === 'INCOME_STATEMENT') {
      csvContent = generateIncomeStatementCSV()
    } else if (selectedReport === 'BALANCE_SHEET') {
      csvContent = generateBalanceSheetCSV()
    } else if (selectedReport === 'TAX_REPORT') {
      csvContent = generateTaxReportCSV()
    } else if (selectedReport === 'CASH_FLOW_STATEMENT') {
      csvContent = generateCashFlowCSV()
    } else if (selectedReport === 'AUDIT_TRAIL') {
      csvContent = generateAuditTrailCSV()
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  function generateIncomeStatementCSV() {
    const data = reportData
    let csv = `Income Statement - ${year}-${String(month).padStart(2, '0')}\n\n`
    csv += `Total Income,${data.totalIncome}\n`

    for (const [cls, val] of Object.entries(data.incomeByClass || {})) {
      csv += `,${cls},${val}\n`
    }

    csv += `\nTotal Expenses,${data.totalExpenses}\n`
    csv += `Deductible Expenses,${data.deductibleExpenses}\n`
    csv += `Non-Deductible Expenses,${data.nonDeductibleExpenses}\n`

    for (const [nature, val] of Object.entries(data.expenseByNature || {})) {
      csv += `,${nature},${val}\n`
    }

    csv += `\nNet Income,${data.netIncome}\n`
    csv += `Taxable Income,${data.taxableIncome}\n`

    return csv
  }

  function generateBalanceSheetCSV() {
    const data = reportData
    let csv = `Balance Sheet - ${new Date().toISOString().split('T')[0]}\n\n`
    csv += 'ASSETS\n'

    for (const [type, val] of Object.entries(data.assets || {})) {
      csv += `${type},${val}\n`
    }

    csv += `Total Assets,${data.totalAssets}\n`
    csv += '\nLIABILITIES\n'

    for (const [type, val] of Object.entries(data.liabilities || {})) {
      csv += `${type},${val}\n`
    }

    csv += `Total Liabilities,${data.totalLiabilities}\n`
    csv += `\nNet Equity,${data.equity}\n`

    return csv
  }

  function generateTaxReportCSV() {
    const data = reportData
    let csv = `Tax Compliance Report - ${year}\n\n`
    csv += 'INCOME SUMMARY\n'
    csv += `Gross Income,${data.grossIncome}\n`
    csv += `Tax Exempt Income,${data.taxExemptIncome}\n`
    csv += `Taxable Income,${data.taxableIncome}\n`
    csv += '\nEXPENSE SUMMARY\n'
    csv += `Deductible Expenses,${data.deductibleExpenses}\n`
    csv += `Non-Deductible Expenses,${data.nonDeductibleExpenses}\n`
    csv += `\nEffective Tax Base,${data.effectiveTaxBase}\n`
    csv += `Estimated Tax (28%),${data.effectiveTaxBase * 0.28}\n`

    return csv
  }

  function generateCashFlowCSV() {
    let csv = `Cash Flow Statement - ${year}-${String(month).padStart(2, '0')}\n\n`
    csv += 'Date,Inflow,Outflow,Net,Running Balance\n'

    for (const row of reportData) {
      csv += `${row.date},${row.inflow},${row.outflow},${row.net},${row.runningBalance}\n`
    }

    return csv
  }

  function generateAuditTrailCSV() {
    let csv = 'Audit Trail\n\n'
    csv += 'Timestamp,User,Action,Entity,Status\n'

    for (const entry of reportData) {
      csv += `${entry.created_at},${entry.user_id},${entry.action},${entry.entity_id},${entry.status}\n`
    }

    return csv
  }

  function handlePrint() {
    window.print()
  }

  if (!entity) {
    return <div className="p-6 text-gray-500">Select an entity first</div>
  }

  const currentReport = REPORT_TYPES.find(r => r.id === selectedReport)

  const incomeEntries = Object.entries(reportData?.incomeByClass || {})
  const expenseEntries = Object.entries(reportData?.expenseByNature || {})
  const cashFlowRows = Array.isArray(reportData) ? reportData : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports & Exports</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportToCSV(currentReport.label, reportData)}
            disabled={!reportData || loading}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:bg-gray-400"
          >
            📥 Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={!reportData || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:bg-gray-400"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-5 gap-2">
        {REPORT_TYPES.map(report => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-3 border rounded transition text-center ${
              selectedReport === report.id
                ? 'bg-blue-50 border-blue-600 border-2'
                : 'bg-white hover:border-blue-300'
            }`}
          >
            <div className="text-2xl mb-1">{report.icon}</div>
            <div className="text-xs font-semibold">{report.label}</div>
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="flex gap-4 bg-gray-50 p-4 rounded">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Year</label>
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

        {selectedReport !== 'BALANCE_SHEET' && selectedReport !== 'TAX_REPORT' && (
          <div>
            <label className="text-sm text-gray-600 block mb-1">Month</label>
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              className="border p-2 rounded text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2024, m - 1).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && <p className="text-gray-500 text-center py-8">Generating report...</p>}

      {/* Report Content */}
      {!loading && reportData && (
        <div className="print:block">
          {selectedReport === 'INCOME_STATEMENT' && (
            <div className="bg-white border rounded p-8 space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{entity?.name || 'Entity'}</h2>
                <p className="text-gray-600">Income Statement</p>
                <p className="text-sm text-gray-500">
                  For the month of {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b-2">
                    <td className="py-2 font-semibold">Income:</td>
                    <td className="text-right"></td>
                  </tr>
                  {incomeEntries.map(([cls, val]) => (
                    <tr key={cls} className="border-b">
                      <td className="py-2 pl-4">{cls}</td>
                      <td className="text-right font-semibold">
                        R {(val || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b-2">
                    <td className="py-2 font-semibold">Total Income</td>
                    <td className="text-right font-bold">R {(reportData?.totalIncome || 0).toFixed(2)}</td>
                  </tr>

                  <tr className="border-b-2">
                    <td className="py-2 font-semibold">Expenses:</td>
                    <td className="text-right"></td>
                  </tr>
                  {expenseEntries.map(([nature, val]) => (
                    <tr key={nature} className="border-b">
                      <td className="py-2 pl-4">{nature}</td>
                      <td className="text-right font-semibold">
                        R {(val || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b">
                    <td className="py-2 pl-4 text-sm text-gray-600">Deductible</td>
                    <td className="text-right text-sm text-gray-600">
                      R {(reportData?.deductibleExpenses || 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b-2">
                    <td className="py-2 font-semibold">Total Expenses</td>
                    <td className="text-right font-bold">R {(reportData?.totalExpenses || 0).toFixed(2)}</td>
                  </tr>

                  <tr className="bg-gray-100">
                    <td className="py-2 font-bold">Net Income</td>
                    <td className="text-right font-bold">R {(reportData?.netIncome || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === 'BALANCE_SHEET' && (
            <div className="bg-white border rounded p-8 space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{entity?.name || 'Entity'}</h2>
                <p className="text-gray-600">Balance Sheet</p>
                <p className="text-sm text-gray-500">As at {new Date().toISOString().split('T')[0]}</p>
              </div>

              <table className="w-full border-collapse mb-6">
                <tbody>
                  <tr className="border-b-2">
                    <td className="py-2 font-bold text-lg">Assets</td>
                    <td className="text-right"></td>
                  </tr>
                  {Object.entries(reportData?.assets || {}).map(([type, val]) => (
                    <tr key={type} className="border-b">
                      <td className="py-2 pl-4">{type}</td>
                      <td className="text-right">R {(val || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold">
                    <td className="py-2">Total Assets</td>
                    <td className="text-right">R {(reportData?.totalAssets || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b-2">
                    <td className="py-2 font-bold text-lg">Liabilities & Equity</td>
                    <td className="text-right"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Liabilities:</td>
                    <td className="text-right"></td>
                  </tr>
                  {Object.entries(reportData?.liabilities || {}).map(([type, val]) => (
                    <tr key={type} className="border-b">
                      <td className="py-2 pl-4">{type}</td>
                      <td className="text-right">R {(val || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-bold">
                    <td className="py-2">Total Liabilities</td>
                    <td className="text-right">R {(reportData?.totalLiabilities || 0).toFixed(2)}</td>
                  </tr>

                  <tr className="border-t-2 bg-green-50 font-bold text-lg">
                    <td className="py-3">Net Equity</td>
                    <td className="text-right">R {(reportData?.equity || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === 'TAX_REPORT' && (
            <div className="bg-white border rounded p-8 space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{entity?.name || 'Entity'}</h2>
                <p className="text-gray-600">Tax Compliance Report (SARS)</p>
                <p className="text-sm text-gray-500">Tax Year {year}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-3 border-b pb-2">Income Summary</h3>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Gross Income</td>
                        <td className="text-right">R {(reportData?.grossIncome || 0).toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Tax Exempt Income</td>
                        <td className="text-right text-green-600">- R {(reportData?.taxExemptIncome || 0).toFixed(2)}</td>
                      </tr>
                      <tr className="bg-gray-100 font-bold border-b">
                        <td className="py-2">Taxable Income</td>
                        <td className="text-right">R {(reportData?.taxableIncome || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3 border-b pb-2">Deductions</h3>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Deductible Expenses</td>
                        <td className="text-right text-green-600">R {(reportData?.deductibleExpenses || 0).toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Non-Deductible Expenses</td>
                        <td className="text-right text-red-600">R {(reportData?.nonDeductibleExpenses || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 p-4 rounded">
                  <table className="w-full">
                    <tbody>
                      <tr className="font-bold text-lg">
                        <td className="py-2">Effective Tax Base</td>
                        <td className="text-right">R {(reportData?.effectiveTaxBase || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-sm">@ 28% Corporate Tax Rate</td>
                        <td className="text-right text-sm font-semibold">
                          R {(((reportData?.effectiveTaxBase || 0) * 0.28)).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-gray-500 border-t pt-4">
                  This report is generated for informational purposes. Please consult with a tax professional for compliance matters.
                </p>
              </div>
            </div>
          )}

          {/* CASH FLOW STATEMENT */}
          {selectedReport === 'CASH_FLOW_STATEMENT' && (
            <div className="bg-white border rounded p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{entity?.name || 'Entity'}</h2>
                <p className="text-gray-600">Cash Flow Statement</p>
                <p className="text-sm text-gray-500">
                  For the month of {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 font-bold">
                    <td className="py-2">Date</td>
                    <td className="text-right">Inflow</td>
                    <td className="text-right">Outflow</td>
                    <td className="text-right">Net</td>
                    <td className="text-right">Running Balance</td>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 ? 'bg-gray-50' : ''}>
                      <td className="py-2">{row?.date || ''}</td>
                      <td className="text-right text-green-600">R {(row?.inflow || 0).toFixed(2)}</td>
                      <td className="text-right text-red-600">R {(row?.outflow || 0).toFixed(2)}</td>
                      <td className="text-right font-semibold">R {(row?.net || 0).toFixed(2)}</td>
                      <td className="text-right font-bold">R {(row?.runningBalance || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === 'AUDIT_TRAIL' && (
            <div className="bg-white border rounded p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">{entity?.name || 'Entity'}</h2>
                <p className="text-gray-600">Audit Trail Report</p>
                <p className="text-sm text-gray-500">Recent Activity Log</p>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 font-bold bg-gray-100">
                    <td className="py-2 px-2">Timestamp</td>
                    <td className="py-2 px-2">User</td>
                    <td className="py-2 px-2">Action</td>
                    <td className="py-2 px-2">Entity</td>
                    <td className="py-2 px-2">Status</td>
                  </tr>
                </thead>
                <tbody>
                  {(reportData || []).map((entry, idx) => (
                    <tr key={idx} className={`border-b ${idx % 2 ? 'bg-gray-50' : ''}`}>
                      <td className="py-2 px-2">{entry?.created_at || ''}</td>
                      <td className="py-2 px-2">{entry?.user_id?.substring(0, 8) || 'N/A'}</td>
                      <td className="py-2 px-2 font-semibold">{entry?.action || ''}</td>
                      <td className="py-2 px-2 text-xs">{entry?.entity_id?.substring(0, 8) || 'N/A'}</td>
                      <td className={`py-2 px-2 ${entry?.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry?.status || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
