import { useEntity } from '../../context/EntityContext'

export default function ReportsTab() {
  const { entity } = useEntity()

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Reports — {entity.name}</h1>
      <p className="text-gray-600">Reports coming soon…</p>
    </div>
  )
}
