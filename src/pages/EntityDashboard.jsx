import { Routes, Route, useParams, Navigate, useLocation } from 'react-router-dom'
import { EntityProvider } from '../context/EntityContext'
import DashboardLayout from '../components/layout/DashboardLayout'
import { NavLink } from 'react-router-dom'

import HomeTab from './dashboard/tabs/HomeTab'
import IncomeOverview from './dashboard/tabs/IncomeOverview'
import ExpensesOverview from './dashboard/tabs/ExpensesOverview'
import AssetsOverview from './dashboard/tabs/AssetsOverview'
import LiabilitiesOverview from './dashboard/tabs/LiabilitiesOverview'
import AnalyticsOverview from './dashboard/tabs/AnalyticsOverview'

export default function EntityDashboard() {
  const { entityId } = useParams()
  const location = useLocation()

  const tabLinkClass = ({ isActive }) =>
    isActive
      ? 'border-b-2 border-black pb-2 font-semibold'
      : 'text-gray-600 hover:text-black pb-2'

  return (
    <EntityProvider entityId={entityId}>
      <DashboardLayout>
        {/* Tab Navigation */}
        <div className="border-b bg-white p-4 flex gap-8 text-sm">
          <NavLink to={`/entities/${entityId}`} className={tabLinkClass}>
            Home
          </NavLink>
          <NavLink to={`/entities/${entityId}/income`} className={tabLinkClass}>
            Income
          </NavLink>
          <NavLink to={`/entities/${entityId}/expenses`} className={tabLinkClass}>
            Expenses
          </NavLink>
          <NavLink to={`/entities/${entityId}/assets`} className={tabLinkClass}>
            Assets
          </NavLink>
          <NavLink to={`/entities/${entityId}/liabilities`} className={tabLinkClass}>
            Liabilities
          </NavLink>
          <NavLink to={`/entities/${entityId}/analytics`} className={tabLinkClass}>
            Analytics
          </NavLink>
        </div>

        {/* Tab Content */}
        <Routes>
          <Route index element={<HomeTab />} />
          <Route path="income" element={<IncomeOverview />} />
          <Route path="expenses" element={<ExpensesOverview />} />
          <Route path="assets" element={<AssetsOverview />} />
          <Route path="liabilities" element={<LiabilitiesOverview />} />
          <Route path="analytics" element={<AnalyticsOverview />} />
        </Routes>
      </DashboardLayout>
    </EntityProvider>
  )
}
