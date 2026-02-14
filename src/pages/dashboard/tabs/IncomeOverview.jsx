import { useEffect, useState } from 'react'
import { useEntity } from '../../../context/EntityContext'
import { getIncomeOverview } from '../../../services/incomeService'

export default function IncomeOverview() {
  const { entity } = useEntity()
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!entity) return
    load()
  }, [entity])

  async function load() {
    const result = await getIncomeOverview(entity.id)
    setTotal(result.total)
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Income Overview</h2>
      <p className="text-3xl font-semibold text-green-600">
        R {total.toFixed(2)}
      </p>
    </div>
  )
}
