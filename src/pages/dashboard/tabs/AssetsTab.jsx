import { useEntity } from '../../../context/EntityContext'

export default function AssetsTab() {
  const { entity } = useEntity()

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Assets</h2>
      <p className="text-gray-500">Coming soon...</p>
    </div>
  )
}
