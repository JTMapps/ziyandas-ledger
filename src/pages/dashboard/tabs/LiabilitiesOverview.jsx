import { useEffect, useState } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { addLiability, getLiabilitiesByEntity, recordLiabilityPayment, getLiabilitySummary } from '../../../services/liabilityService'
import { eventEmitter } from '../../../lib/eventEmitter'

const LIABILITY_TYPES = ['LOAN', 'MORTGAGE', 'CREDIT_CARD', 'ACCOUNT_PAYABLE', 'OTHER']
const INTEREST_METHODS = ['SIMPLE', 'COMPOUND']

export default function LiabilitiesTab() {
  const { entity } = useEntity()

  const [liabilities, setLiabilities] = useState([])
  const [summary, setSummary] = useState({ totalBalance: 0, byType: {}, overdue: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState(LIABILITY_TYPES[0])
  const [principalAmount, setPrincipalAmount] = useState('')
  const [incurrenceDate, setIncurrenceDate] = useState(new Date().toISOString().split('T')[0])
  const [interestRate, setInterestRate] = useState('0')
  const [interestMethod, setInterestMethod] = useState('COMPOUND')
  const [maturityDate, setMaturityDate] = useState('')
  const [counterparty, setCounterparty] = useState('')

  // Payment state
  const [paymentLiabilityId, setPaymentLiabilityId] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (entity) {
      loadLiabilities()
    }
  }, [entity])

  useEffect(() => {
    const unsubscribe = eventEmitter.on('LIABILITY_ADDED', () => loadLiabilities())
    return () => unsubscribe()
  }, [entity])

  async function loadLiabilities() {
    if (!entity) return
    setLoading(true)
    setError(null)

    const liabResult = await getLiabilitiesByEntity(entity.id)
    if (liabResult.success) {
      setLiabilities(liabResult.data)
    } else {
      setError(liabResult.error)
    }

    const summaryResult = await getLiabilitySummary(entity.id)
    if (summaryResult.success) {
      setSummary(summaryResult)
    }

    setLoading(false)
  }

  async function handleAddLiability(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await addLiability({
      entityId: entity.id,
      liabilityType: type,
      principalAmount: parseFloat(principalAmount),
      incurrenceDate,
      interestRate: parseFloat(interestRate) / 100,
      interestMethod,
      maturityDate: maturityDate || null,
      counterparty: counterparty || null
    })

    setLoading(false)

    if (result.success) {
      setShowForm(false)
      setType(LIABILITY_TYPES[0])
      setPrincipalAmount('')
      setIncurrenceDate(new Date().toISOString().split('T')[0])
      setInterestRate('0')
      setMaturityDate('')
      setCounterparty('')
    } else {
      setError(result.error)
    }
  }

  async function handleRecordPayment() {
    if (!paymentAmount || !paymentLiabilityId) {
      setError('Enter payment amount')
      return
    }

    setLoading(true)
    setError(null)

    const result = await recordLiabilityPayment(
      paymentLiabilityId,
      parseFloat(paymentAmount),
      paymentDate
    )

    setLoading(false)

    if (result.success) {
      setPaymentLiabilityId(null)
      setPaymentAmount('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      loadLiabilities()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Liabilities</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {showForm ? 'Cancel' : '+ Add Liability'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4">
          <p className="text-gray-600 text-sm mb-1">Total Liabilities</p>
          <p className="text-3xl font-bold text-orange-600">
            R {summary.totalBalance?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {liabilities.length} liability{liabilities.length !== 1 ? 'ies' : ''}
          </p>
        </div>

        <div className="bg-white border rounded p-4">
          <p className="text-gray-600 text-sm mb-1">By Type</p>
          <div className="space-y-1 text-sm">
            {Object.entries(summary.byType || {}).slice(0, 2).map(([type, value]) => (
              <p key={type} className="flex justify-between">
                <span className="text-xs">{type}</span>
                <strong>R {value.toFixed(2)}</strong>
              </p>
            ))}
          </div>
        </div>

        <div className={`border rounded p-4 ${summary.overdue > 0 ? 'bg-red-50' : 'bg-white'}`}>
          <p className="text-gray-600 text-sm mb-1">Overdue Amount</p>
          <p className={`text-2xl font-bold ${summary.overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
            R {summary.overdue?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Add Liability Form */}
      {showForm && (
        <form onSubmit={handleAddLiability} className="bg-gray-50 border rounded p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="border p-2 rounded"
            >
              {LIABILITY_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <input
              type="number"
              required
              placeholder="Principal Amount (ZAR)"
              className="border p-2 rounded"
              step="0.01"
              min="0"
              value={principalAmount}
              onChange={e => setPrincipalAmount(e.target.value)}
            />

            <input
              type="date"
              required
              className="border p-2 rounded"
              value={incurrenceDate}
              onChange={e => setIncurrenceDate(e.target.value)}
            />

            <input
              type="number"
              placeholder="Annual Interest Rate (%)"
              className="border p-2 rounded"
              step="0.01"
              min="0"
              value={interestRate}
              onChange={e => setInterestRate(e.target.value)}
            />

            <select
              value={interestMethod}
              onChange={e => setInterestMethod(e.target.value)}
              className="border p-2 rounded"
            >
              {INTEREST_METHODS.map(m => (
                <option key={m} value={m}>{m} Interest</option>
              ))}
            </select>

            <input
              type="date"
              placeholder="Maturity Date"
              className="border p-2 rounded"
              value={maturityDate}
              onChange={e => setMaturityDate(e.target.value)}
            />

            <input
              type="text"
              placeholder="Creditor/Counterparty (optional)"
              className="border p-2 rounded col-span-2"
              value={counterparty}
              onChange={e => setCounterparty(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:bg-gray-400"
          >
            {loading ? 'Adding...' : 'Add Liability'}
          </button>
        </form>
      )}

      {/* Liabilities List */}
      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Active Liabilities</h2>
        {(liabilities || []).length === 0 ? (
          <p className="text-gray-500">No liabilities recorded</p>
        ) : (
          <div className="space-y-2">
            {(liabilities || []).map(({ liability, balance, accumulatedInterest, daysSince, isOverdue }) => (
              <div key={liability?.id || Math.random()} className={`border rounded p-4 transition ${isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">
                      {liability?.liability_type || 'Unknown'}
                      {isOverdue && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">OVERDUE</span>}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {liability?.counterparty || 'Unknown'} • {liability?.created_at?.split('T')[0] || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => setPaymentLiabilityId(liability?.id)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Record Payment
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  <div>
                    <p className="text-gray-600">Principal</p>
                    <p className="font-semibold">R {(liability?.principal_amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Interest Accrued</p>
                    <p className="font-semibold">R {(accumulatedInterest || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Balance</p>
                    <p className="font-semibold text-orange-600">R {(balance || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Days Since</p>
                    <p className="font-semibold">{daysSince || 0}</p>
                  </div>
                </div>

                {(liability?.interest_rate || 0) > 0 && (
                  <div className="text-xs text-gray-500">
                    Rate: {(((liability?.interest_rate || 0) * 100)).toFixed(2)}% p.a.
                  </div>
                )}

                {liability?.maturity_date && (
                  <div className="text-xs text-gray-500">
                    Maturity: {liability?.maturity_date || 'N/A'}
                  </div>
                )}

                {/* Payment Form */}
                {paymentLiabilityId === liability?.id && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <input
                      type="number"
                      placeholder="Payment Amount"
                      className="border p-2 rounded w-full text-sm"
                      step="0.01"
                      min="0"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                    />

                    <input
                      type="date"
                      className="border p-2 rounded w-full text-sm"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={handleRecordPayment}
                        disabled={loading || !paymentAmount}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded disabled:bg-gray-400"
                      >
                        Record
                      </button>
                      <button
                        onClick={() => setPaymentLiabilityId(null)}
                        className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
