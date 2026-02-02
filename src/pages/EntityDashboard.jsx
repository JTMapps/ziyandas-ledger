import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { EntityProvider } from '../context/EntityContext'
import DashboardLayout from '../components/layout/DashboardLayout'

import IncomePage from './IncomePage'
import ExpensePage from './ExpensePage'
import AnalyticsPage from './AnalyticsPage'
import ReportsPage from './ReportsPage'

export default function EntityDashboard() {
  const { entityId } = useParams()

  return (
    <EntityProvider entityId={entityId}>
        <DashboardLayout>
        <Routes>
            <Route index element={<Navigate to="income" replace />} />
            <Route path="income" element={<IncomePage entityId={entityId} />} />
            <Route path="expenses" element={<ExpensePage entityId={entityId} />} />
            <Route path="analytics" element={<AnalyticsPage entityId={entityId} />} />
            <Route path="reports" element={<ReportsPage entityId={entityId} />} />
        </Routes>
        </DashboardLayout>
    </EntityProvider>
  )
}
