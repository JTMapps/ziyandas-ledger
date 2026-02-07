import { useEffect, useState } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { addAsset, getAssetsByEntity, disposeAsset, getAssetSummary } from '../../../services/assetService'
import { eventEmitter } from '../../../lib/eventEmitter'

const ASSET_TYPES = ['VEHICLE', 'COMPUTER', 'EQUIPMENT', 'BUILDING', 'FURNITURE', 'OTHER']
const DEPRECIATION_METHODS = ['STRAIGHT_LINE', 'DIMINISHING_BALANCE', 'UNITS_OF_PRODUCTION']

export default function AssetsTab() {
  const { entity } = useEntity()

  const [assets, setAssets] = useState([])
  const [summary, setSummary] = useState({ totalValue: 0, byType: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState(ASSET_TYPES[0])
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0])
  const [initialValue, setInitialValue] = useState('')
  const [depreciationMethod, setDepreciationMethod] = useState(DEPRECIATION_METHODS[0])
  const [usefulLifeMonths, setUsefulLifeMonths] = useState('')

  useEffect(() => {
    if (entity) {
      loadAssets()
    }
  }, [entity])

  useEffect(() => {
    const unsubscribe = eventEmitter.on('ASSET_ADDED', () => loadAssets())
    return () => unsubscribe()
  }, [entity])

  async function loadAssets() {
    if (!entity) return
    setLoading(true)
    setError(null)

    const assetsResult = await getAssetsByEntity(entity.id)
    if (assetsResult.success) {
      setAssets(assetsResult.data)
    } else {
      setError(assetsResult.error)
    }

    const summaryResult = await getAssetSummary(entity.id)
    if (summaryResult.success) {
      setSummary(summaryResult)
    }

    setLoading(false)
  }

  async function handleAddAsset(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await addAsset({
      entityId: entity.id,
      assetType,
      name,
      acquisitionDate,
      initialValue: parseFloat(initialValue),
      depreciationMethod,
      usefulLifeMonths: usefulLifeMonths ? parseInt(usefulLifeMonths) : null
    })

    setLoading(false)

    if (result.success) {
      setShowForm(false)
      setName('')
      setAssetType(ASSET_TYPES[0])
      setAcquisitionDate(new Date().toISOString().split('T')[0])
      setInitialValue('')
      setDepreciationMethod(DEPRECIATION_METHODS[0])
      setUsefulLifeMonths('')
      // loadAssets will be called via ASSET_ADDED event
    } else {
      setError(result.error)
    }
  }

  async function handleDisposeAsset(assetId, asset) {
    if (!confirm(`Dispose asset "${asset.name}"?`)) return

    const result = await disposeAsset(
      assetId,
      new Date().toISOString().split('T')[0],
      0,
      'Disposed'
    )

    if (result.success) {
      loadAssets()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {showForm ? 'Cancel' : '+ Add Asset'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <p className="text-gray-600 text-sm mb-1">Total Asset Value</p>
          <p className="text-3xl font-bold text-green-600">
            R {summary.totalValue?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white border rounded p-4">
          <p className="text-gray-600 text-sm mb-1">By Type</p>
          <div className="space-y-1 text-sm">
            {Object.entries(summary.byType || {}).slice(0, 3).map(([type, value]) => (
              <p key={type} className="flex justify-between">
                <span>{type}</span>
                <strong>R {value.toFixed(2)}</strong>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Add Asset Form */}
      {showForm && (
        <form onSubmit={handleAddAsset} className="bg-gray-50 border rounded p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="Asset Name"
              className="border p-2 rounded col-span-2"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <select
              value={assetType}
              onChange={e => setAssetType(e.target.value)}
              className="border p-2 rounded"
            >
              {ASSET_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <input
              type="date"
              required
              className="border p-2 rounded"
              value={acquisitionDate}
              onChange={e => setAcquisitionDate(e.target.value)}
            />

            <input
              type="number"
              required
              placeholder="Initial Value (ZAR)"
              className="border p-2 rounded"
              step="0.01"
              min="0"
              value={initialValue}
              onChange={e => setInitialValue(e.target.value)}
            />

            <select
              value={depreciationMethod}
              onChange={e => setDepreciationMethod(e.target.value)}
              className="border p-2 rounded"
            >
              {DEPRECIATION_METHODS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Useful Life (months)"
              className="border p-2 rounded"
              min="1"
              value={usefulLifeMonths}
              onChange={e => setUsefulLifeMonths(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:bg-gray-400"
          >
            {loading ? 'Adding...' : 'Add Asset'}
          </button>
        </form>
      )}

      {/* Assets List */}
      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Assets</h2>
        {(assets || []).length === 0 ? (
          <p className="text-gray-500">No assets recorded</p>
        ) : (
          <div className="space-y-2">
            {(assets || []).map(({ asset, bookValue, accumulatedDepreciation, monthsUsed }) => (
              <div key={asset?.id || Math.random()} className="border rounded p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{asset?.name || 'Unnamed Asset'}</h3>
                    <p className="text-sm text-gray-600">
                      {asset?.asset_type || 'N/A'} • {asset?.acquisition_date || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDisposeAsset(asset?.id, asset)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Dispose
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  <div>
                    <p className="text-gray-600">Initial Value</p>
                    <p className="font-semibold">R {(asset?.initial_value || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Accumulated Depreciation</p>
                    <p className="font-semibold">R {(accumulatedDepreciation || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Book Value</p>
                    <p className="font-semibold text-green-600">R {(bookValue || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Months Used</p>
                    <p className="font-semibold">{monthsUsed || 0}</p>
                  </div>
                </div>

                {asset?.useful_life_months && (
                  <div className="text-xs text-gray-500">
                    Method: {asset?.depreciation_method || 'N/A'} • Life: {asset?.useful_life_months || 0} months
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
