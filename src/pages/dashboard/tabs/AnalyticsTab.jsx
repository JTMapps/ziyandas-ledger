import { useEntity } from '../../context/EntityContext'

export default function LiabilitiesTab() {
  const { entity } = useEntity()

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Liabilities — {entity.name}</h1>
      <p className="text-gray-600">Liability tracking coming soon…</p>
    </div>
  )
}
