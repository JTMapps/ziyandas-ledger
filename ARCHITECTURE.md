# Ziyandas Ledger - Architecture Overview

## System Status: Phase 1-3 Implementation Complete ✅

**Latest Update:** February 7, 2026

This document describes the **NEW event-driven financial ledger** system. The backend has been refactored to use immutable economic events instead of direct entry tracking, enabling full audit trails, IFRS compliance, and SARS-aligned tax tracking.

---

## Architecture Layers

### 1. Services Layer (NEW - Feb 2026)

All data operations go through services in `src/services/`:

| Service | Purpose |
|---------|---------|
| **eventService.js** | Core event recording, queries, aggregations |
| **incomeService.js** | Income operations (adds REVENUE_EARNED events) |
| **expenseService.js** | Expense operations (adds EXPENSE_INCURRED events) |
| **entityService.js** | Entity CRUD operations |
| **auditService.js** | Audit log queries for compliance reporting |
| **assetService.js** | Asset tracking (Phase 5 stub) |
| **liabilityService.js** | Liability tracking (Phase 5 stub) |
| **analyticsService.js** | Financial analytics (Phase 4 stub) |

**Key Benefit:** All services are testable, mockable, and enforce business logic at the application layer before hitting the database.

### 2. Event Emitter (NEW - Feb 2026)

`src/lib/eventEmitter.js` provides pub/sub for decoupling:

```javascript
// In services (after successful DB write):
eventEmitter.emit('INCOME_ADDED', { eventId, amount, ... })

// In components (subscribe to changes):
useEffect(() => {
  eventEmitter.on('INCOME_ADDED', () => loadIncome())
  return () => eventEmitter.off(...)
}, [])
```

**Event Types:**
- `ECONOMIC_EVENT_RECORDED` – Any event recorded
- `INCOME_ADDED` – Income event
- `EXPENSE_ADDED` – Expense event
- `ENTITY_CREATED` / `ENTITY_DELETED` – Entity lifecycle
- `RECOVERY_ERROR` – Error during operation

### 3. Supabase Integration (UPDATED - Feb 2026)

**New helper functions in `src/lib/supabase.js`:**

```javascript
// Get current authenticated user
getCurrentUser() → { user, error }

// Typed RPC for enums
getEnumValues(typeName) → Array<string>

// Insert with RLS user_id auto-injection
insertAsUser(table, payload, userIdColumn) → { data, error }

// Error normalization
normalizeError(error) → { code, message, details, hint }
```

---

## Database Schema (Event-Driven)

### Core Immutable Tables

#### `economic_events`
```sql
id: UUID (PK)
user_id: UUID → auth.users
entity_id: UUID → entities
event_type: ENUM (REVENUE_EARNED, EXPENSE_INCURRED, ASSET_ACQUIRED, ...)
event_date: DATE
description: TEXT
source_reference: TEXT (for traceability)
jurisdiction: TEXT (default 'ZA')
created_at: TIMESTAMPTZ (immutable)

-- Triggers: Prevent UPDATE/DELETE (immutability enforced)
-- RLS: user_id = auth.uid()
```

#### `event_effects`
```sql
id: UUID (PK)
event_id: UUID → economic_events (CASCADE)
effect_type: ENUM (INCOME_RECOGNIZED, EXPENSE_RECOGNIZED, CASH_INCREASE, ...)
amount: NUMERIC (SIGNED - can be negative)
currency: TEXT (default 'ZAR')
related_table: TEXT (optional - for cross-referencing)
related_record_id: UUID (optional)
created_at: TIMESTAMPTZ (immutable)

-- Triggers: Prevent UPDATE/DELETE
-- RLS: Via EXISTS join to economic_events where user_id = auth.uid()
```

### Legacy Tables (Dormant)

The old `income_entries` and `expense_entries` are no longer written to, but remain for backwards compatibility during migration.

---

## Data Flow: Adding Income (Example)

```javascript
// Step 1: Component calls service
const result = await addIncome({
  entityId: '...',
  dateReceived: '2025-02-07',
  amountNet: 5000,
  incomeClass: 'SALARY',
  description: 'Monthly salary'
})

// Step 2: Service records event
// - Creates row in economic_events (REVENUE_EARNED)
// - Creates effect in event_effects (INCOME_RECOGNIZED)
// - Creates row in income_recognitions (tax/IFRS treatment)
// - Emits INCOME_ADDED event

// Step 3: UI listeners trigger
// - eventEmitter hears INCOME_ADDED
// - Components call loadIncome() to refresh
// - No manual refresh needed

// Step 4: Audit trail
// - audit_log captures INSERT with actor_uid and timestamp
// - Full history available via auditService.getAuditTrail()
```

---

## UI Components Updated (Phase 3)

| Component | Change | Status |
|-----------|--------|--------|
| [IncomeTab](src/pages/dashboard/tabs) | Uses incomeService | ✅ Complete |
| [ExpensesTab](src/pages/dashboard/tabs) | Uses expenseService | ✅ Complete |
| [HomeTab](src/pages/dashboard/tabs) | Queries event_effects | ✅ Complete |
| [ProfilePage](src/pages) | Uses entityService | ✅ Complete |
| [AssetsTab](src/pages/dashboard/tabs) | Stub (Phase 5) | ⏳ Pending |
| [LiabilitiesTab](src/pages/dashboard/tabs) | Stub (Phase 5) | ⏳ Pending |
| [AnalyticsTab](src/pages/dashboard/tabs) | Stub (Phase 4) | ⏳ Pending |
| [ReportsTab](src/pages/dashboard/tabs) | Stub (Phase 4) | ⏳ Pending |

---

## Service Usage Examples

### Add Income
```javascript
import { addIncome } from '../services/incomeService'

const result = await addIncome({
  entityId: entity.id,
  dateReceived: '2025-02-07',
  amountNet: 5000,
  incomeClass: 'SALARY',
  taxTreatment: 'TAXABLE',
  description: 'Monthly salary'
})

if (result.success) {
  console.log('Event ID:', result.data.event.id)
  console.log('Recognition:', result.data.recognition)
}
```

### Query Income
```javascript
import { getIncomeByEntity, getTotalIncome } from '../services/incomeService'

// Get individual entries
const entries = await getIncomeByEntity(entityId, {
  startDate: '2025-01-01',
  endDate: '2025-02-28',
  limit: 100
})

// Get total with breakdown
const totals = await getTotalIncome(entityId, '2025-01-01', '2025-02-07')
// Returns: { total, count, breakdown: { SALARY: ..., BUSINESS_INCOME: ... } }
```

### Query Audit Trail
```javascript
import { getAuditTrail, getComplianceReport } from '../services/auditService'

// Get mutations for a specific record
const audit = await getAuditTrail({
  tableName: 'economic_events',
  recordId: eventId
})

// Get compliance report for a table
const report = await getComplianceReport(
  'expense_recognitions',
  '2025-01-01',
  '2025-12-31'
)
// Returns: { report, stats: { insertions, updates, deletions, ... } }
```

---

## RLS Policies (Updated)

All policies enforce user ownership of financial records:

```sql
-- Economic events: User must own via user_id
CREATE POLICY "users_manage_own_economic_events" ON economic_events
  FOR ALL USING (user_id = auth.uid())

-- Effects: User must own parent event
CREATE POLICY "users_manage_event_effects" ON event_effects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM economic_events
      WHERE id = event_effects.event_id
        AND user_id = auth.uid()
    )
  )

-- Recognitions: User must own parent effect's event
CREATE POLICY "users_manage_income_recognitions" ON income_recognitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM event_effects ef
      JOIN economic_events ee ON ee.id = ef.event_id
      WHERE ef.id = income_recognitions.effect_id
        AND ee.user_id = auth.uid()
    )
  )
```

---

## Type System (JSDoc)

`src/types/events.js` provides IDE type hints via JSDoc:

```javascript
/**
 * @typedef {Object} EconomicEvent
 * @property {string} id
 * @property {string} user_id
 * @property {string} entity_id
 * @property {string} event_date
 * @property {EconomicEventType} event_type
 * @property {string} description
 * @property {string} created_at
 */

/**
 * @typedef {Object} AddIncomePayload
 * @property {string} entityId
 * @property {string} dateReceived
 * @property {number} amountNet
 * @property {string} incomeClass
 * @property {string} taxTreatment
 */
```

**Import in services for autocomplete:**
```javascript
import { AddIncomePayload } from '../types/events'

/** @param {AddIncomePayload} params */
export async function addIncome(params) { ... }
```

---

## Testing Checklist

### Phase 1-3 (Completed)
- [x] All services export correctly
- [x] EventEmitter works in components
- [x] IncomeTab add/list via service
- [x] ExpensesTab add/list via service
- [x] HomeTab calculates from event_effects
- [x] ProfilePage creates/deletes entities
- [x] Event listeners trigger UI updates
- [x] RLS prevents cross-user access

### Phase 4 (Analytics - Not Started)
- [ ] Materialized views populate
- [ ] analyticsService queries return correct totals
- [ ] AnalyticsTab renders charts
- [ ] ReportsTab exports CSV/PDF

### Phase 5 (Assets/Liabilities - Not Started)
- [ ] Assets track depreciation
- [ ] Liabilities track interest
- [ ] Balance sheet calculates equity

---

## Known Limitations & TODOs

| Item | Phase | Notes |
|------|-------|-------|
| Materialized views for analytics | Phase 4 | Will improve query performance 10x+ |
| Asset depreciation scheduling | Phase 5 | Requires scheduled events |
| Liability interest accrual | Phase 5 | Requires accrual mechanics |
| Real-time subscriptions | Future | Could use Supabase Realtime for live updates |
| Offline mode | Future | Service worker + local cache |
| Mobile app | Future | React Native port |

---

## Architecture Decision Records

### ADR-1: Event Sourcing Pattern
**Decision:** Use immutable events + effects instead of mutable entries  
**Rationale:** Enables audit trails, compliance, and accurate reporting  
**Trade-off:** Slightly more complex queries (joins) but vastly better auditability  

### ADR-2: Services Layer
**Decision:** All DB operations through services, not direct component queries  
**Rationale:** Centralizes business logic, enables testing, easier refactoring  
**Trade-off:** Extra abstraction layer, but payoff in maintainability  

### ADR-3: Event Emitter for Pub/Sub
**Decision:** Use EventEmitter instead of Redux/Zustand  
**Rationale:** Minimal overhead, decouples services from UI, easy to understand  
**Trade-off:** Not as powerful as full state management, but sufficient for this app  

---

## Performance Considerations

**Current (Phase 1-3):**
- Event queries use indexed columns: `(entity_id, event_date)`
- Effect queries use: `(event_id)`, `(effect_type)`
- Pagination implemented (limit 100 default)
- **Est. response time:** < 200ms for typical queries

**Future (Phase 4):**
- Materialized views will cache aggregations
- Real-time subscriptions can reduce polling
- **Est. response time:** < 50ms after materialization

---

## Debugging Guide

### Service returns {success: false, error: "..."}
**Check:** 
1. Is user authenticated? (`getCurrentUser()`)
2. Is entity owned by user? (RLS would reject)
3. Are required parameters provided?
4. Check browser console for SQL error details

### EventEmitter not triggering UI update
**Check:**
1. Is `eventEmitter.emit()` being called in the service?
2. Is the component calling `eventEmitter.on()` inside `useEffect`?
3. Is the unsubscribe function returned?

### Audit log entry missing
**Check:**
1. Are triggers enabled? (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
2. Is the service using `recordEconomicEvent()` which creates the trigger?
3. Check `audit_log` table directly in Supabase

### Immutability trigger blocking legitimate update
**Fix:** You *cannot* update immutable tables. Create a new event instead (e.g., REVENUE_DEFERRED to void income).

---

## Next Steps

### Phase 4 (Analytics & Reporting)
1. Create materialized views for entity summaries
2. Implement analyticsService queries
3. Build AnalyticsTab with charts (line, bar, pie)
4. Build ReportsTab with PDF export

### Phase 5 (Assets & Liabilities)
1. Implement assetService with depreciation
2. Implement liabilityService with interest accrual
3. Build AssetsTab and LiabilitiesTab
4. Generate full balance sheet

### Phase 6+ (Advanced)
1. Multi-entity consolidation views
2. Tax jurisdiction compliance per entity
3. Real-time Supabase subscriptions
4. Scheduled jobs for depreciation/interest

---

## References

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [React Router](https://reactrouter.com/)
- [Context API](https://react.dev/reference/react/useContext)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [IFRS Accounting](https://www.ifrs.org/)
- [SARS Tax Compliance (ZA)](https://www.sars.gov.za/)
notes: TEXT (nullable)
timestamp_created: TIMESTAMP
```
**RLS Policy:** Users can only access entries where `user_id = auth.uid()`

---

## Frontend Architecture

### Component Hierarchy
```
main.jsx
  ├── BrowserRouter (routing)
  └── App.jsx (session management + routing)
      ├── AuthPage (no session)
      └── Routes (has session)
          ├── /auth → AuthPage (sign in/up)
          ├── / → EntityGate (smart router to /profile)
          ├── /profile → ProfilePage (entity list & user info)
          ├── /entities/new → EntitySetup (create entity form)
          └── /entities/:entityId/* → EntityDashboard
              ├── EntityProvider (entityId prop)
              ├── DashboardLayout (sidebar with back button)
              ├── Tab Navigation (Home, Income, Expenses, Assets, Liabilities, Analytics, Reports)
              └── Routes
                  ├── (index) → HomeTab
                  ├── income → IncomeTab
                  ├── expenses → ExpensesTab
                  ├── assets → AssetsTab
                  ├── liabilities → LiabilitiesTab
                  ├── analytics → AnalyticsTab
                  └── reports → ReportsTab
```

### Key Contexts

#### EntityProvider (`src/context/EntityContext.jsx`)
Manages the list of entities and currently selected entity.

**Props:**
- `children`: React components
- `entityId` (optional): Pre-select a specific entity by ID

**Provides:**
- `entities`: Array of all user's entities
- `entity`: Currently selected entity object
- `setEntity(entityId)`: Function to change selected entity
- `loading`: Boolean for loading state
- `reloadEntities()`: Refresh entities from database

**Usage:**
```jsx
const { entity, entities, setEntity, loading } = useEntity()
```

---

## User Journey

### 1. Sign In / Sign Up
**File:** `src/pages/AuthPage.jsx`
- User enters email + password
- Supabase auth creates session
- On successful authentication: Navigates to `/profile`
- App.jsx detects session via `onAuthStateChange`

### 2. EntityGate (Smart Router)
**File:** `src/pages/EntityGate.jsx`
- Checks if user has entities in database
- **If no entities:** Redirect to `/entities/new` (EntitySetup)
- **If has entities:** Redirect to `/profile` (ProfilePage)

### 3. Profile Page
**File:** `src/pages/ProfilePage.jsx`
- Displays user information (email, member since)
- Lists all user's entities with creation dates and types
- "Create Entity" button to add new entities
- "Delete" option for each entity (on hover)
- "Sign Out" button to log out
- Clicking an entity navigates to `/entities/{entityId}`

### 4. Dashboard
**File:** `src/pages/EntityDashboard.jsx`
- Receives entityId from URL params
- Creates EntityProvider with `entityId` prop
- EntityProvider pre-selects that entity
- Renders DashboardLayout (minimal sidebar) + primary tab navigation
- **Sidebar contains:**
  - App title "Ziyandas Ledger"
  - "← Back to Profile" button (navigates to `/profile`)
- **Primary tab navigation contains:**
  - Home, Income, Expenses, Assets, Liabilities, Analytics, Reports
  - This is the only navigation bar for switching between sections
  - Tabs highlight the active route

### 5. Data Operations
- **Income/Expense insertion:** User fills form in respective tab → data saved with `entity_id` + `user_id`
- **Data retrieval:** Tabs query with `.eq('entity_id', entity.id)`
- **RLS enforcement:** Database prevents cross-user access via `user_id = auth.uid()`

---

---

## Critical Design Changes from Previous Architecture

### Removed Top-Level EntityProvider
- **Before:** EntityProvider wrapped entire app
- **Now:** EntityProvider only wraps EntityDashboard (where needed)
- **Why:** Eliminates unnecessary context at app level, simplifies state management

### Removed Entity Switcher from Dashboard
- **Before:** Sidebar had dropdown to switch active entity
- **Now:** Must navigate back to Profile page and select a new entity
- **Why:** Cleaner UX flow, prevents accidental entity switches, forces deliberate navigation

### Removed Duplicate Navigation
- **Before:** Sidebar had links (Income, Expenses, etc.) AND tabs had same links → two ways to navigate
- **Now:** Only one tab navigation bar at top of dashboard
- **Why:** Single source of truth for section navigation, cleaner UI

### Simplified DashboardLayout Sidebar
- **Before:** Entity switcher dropdown + sign-out button + navigation links
- **Now:** Just app title + "Back to Profile" button
- **Why:** Minimal, focused sidebar that doesn't distract from dashboard content

### Sign-Out Centralized
- **Before:** Sign out available in both sidebar and nowhere else
- **Now:** Only available in ProfilePage
- **Why:** Users must go to profile to perform account actions (sign out), consistent UX

### Profile Page Added
- **Before:** No profile page, entity selection was separate page
- **Now:** Unified profile page showing user info + entities
- **Why:** Single hub for user account and entity management

---

## Navigation Flow Diagram

```
AuthPage
  ↓ (sign in/up success)
ProfilePage ← Central Hub
  ├─ [Create Entity] → EntitySetup → EntityDashboard
  ├─ [Click Entity] → EntityDashboard
  └─ [Sign Out] → AuthPage (via navigate('/auth'))

EntityDashboard (inside EntityProvider)
  ├─ [← Back to Profile] → ProfilePage
  └─ [Tab Navigation] → Different tabs (Home, Income, Expenses, etc.)
```

---

## Critical Data Flow

### Adding an Income Entry
```
1. User navigates EntityDashboard → clicks "Income" tab
   (Loads IncomeTab component via route)

2. User fills IncomeTab form with:
   - amount_net (required)
   - description (required)
   - (date_received defaults to today)

3. Form submission executes addIncome():
   - Gets current user: supabase.auth.getUser()
   - Gets current entity: useEntity() hook
   - Inserts into income_entries with:
     {
       user_id: auth.uid(),        ← From auth
       entity_id: entity.id,       ← From context
       amount_net: user_input,
       description: user_input,
       date_received: today        ← ISO date string
     }

4. RLS Policy Validation:
   Database checks: user_id = auth.uid()
   ✅ PASS → Entry saved

5. Entry appears in:
   - Income tab (immediately, after loadIncome() refresh)
   - Other tabs can aggregate this data
```

### Switching Entities
```
1. User in EntityDashboard clicks "← Back to Profile"
   (via DashboardLayout button)

2. Navigates to /profile → ProfilePage renders

3. User clicks on a different entity in the list

4. Navigates to /entities/{newEntityId}
   → EntityDashboard receives new entityId in useParams()

5. EntityDashboard passes entityId to EntityProvider:
   <EntityProvider entityId={entityId}>
     {children}
   </EntityProvider>

6. EntityProvider useEffect triggers:
   - Fetches all entities
   - Pre-selects entity with matching entityId
   - Sets entity state

7. Each tab's useEffect listens to entity:
   useEffect(() => {
     if (entity) {
       loadIncome()  // Re-queries with new entity_id
     }
   }, [entity])

8. UI re-renders with new entity's data
```

---

## Field Mappings (Schema → Frontend)

| Purpose | Database Column | Frontend Variable | Type | Example |
|---------|-----------------|-------------------|------|---------|
| Entity ID | `entities.id` | `entity.id` | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| Entity Name | `entities.name` | `entity.name` | TEXT | `"Personal Ledger"` |
| Entity Type | `entities.type` | `entity.type` | ENUM | `"Personal"` |
| Current User | `auth.users.id` | `auth.uid()` | UUID | (from session) |
| Income Amount | `amount_net` | `amount` | NUMERIC | `1500.00` |
| Expense Amount | `amount` | `amount` | NUMERIC | `45.50` |
| Expense Category | `category` | `category` | ENUM | `"Food"` |
| Date (Income) | `date_received` | `date_received` | DATE | `"2024-02-06"` |
| Date (Expense) | `date_spent` | `date_spent` | DATE | `"2024-02-06"` |

---

## Important Implementation Details

### Date Formatting
- **Database expects:** ISO date string (YYYY-MM-DD)
- **Frontend converts:** `new Date().toISOString().split('T')[0]`
- **DO NOT:** Send `new Date()` object directly

### Entity Selection
- Selected entity is determined by URL: `/entities/{entityId}`
- EntityProvider pre-selects from `entityId` prop
- Sidebar dropdown updates context, not URL
- Refreshing page preserves entity selection via URL

### RLS Security
```sql
-- User can only see their own entities
WHERE created_by = auth.uid()

-- User can only see/modify their income
WHERE user_id = auth.uid()

-- User can only see/modify their expenses
WHERE user_id = auth.uid()
```
**Result:** Even if frontend is hacked, database prevents unauthorized access.

---

## Missing / TODO Features

- [ ] HomeTab: Implement dashboard overview with key metrics
- [ ] AssetsTab: Implement asset tracking and valuation
- [ ] LiabilitiesTab: Implement liability tracking
- [ ] AnalyticsTab: Implement proper aggregations by entity
- [ ] ReportsTab: Implement date-range filtering and exports
- [ ] PDF upload integration via Supabase Storage
- [ ] Auto-create Personal entity on user signup
- [ ] Payment method tracking UI
- [ ] Tax-deductible expense filtering UI
- [ ] Monthly/yearly breakdown views
- [ ] CSV/PDF export functionality
- [ ] Document attachment viewing
- [ ] Edit/delete income and expense entries
- [ ] Category management for expenses
- [ ] Recurring transaction templates

---

## Deployment Checklist

- [ ] All RLS policies enabled
- [ ] Storage buckets configured (income-documents, expense-documents)
- [ ] Email confirmation disabled for testing (enable in production)
- [ ] Rate limiting configured
- [ ] Backups enabled in Supabase
- [ ] Environment variables secured (never commit .env)
- [ ] GitHub repository set to private
- [ ] Collaborators added with Developer role

---

## Debugging Guide

### "No routes matched location '/auth'"
**Cause:** Missing `/auth` route in App.jsx
**Fix:** Add to Routes: `<Route path="/auth" element={<AuthPage />} />`

### User gets stuck on login or redirect doesn't happen
**Cause:** AuthPage not calling navigate() on successful auth
**Fix:** Import useNavigate and call `navigate('/profile')` in success case

### "Create your first entity" on login despite having entities
**Likely cause:** EntityGate querying wrong column name
**Fix:** Ensure EntityGate uses `eq('created_by', user.id)` not `eq('user_id', user.id)`

### Income/Expense entries not appearing
**Likely cause:** Entity ID mismatch or RLS rejection
**Debug:**
1. Check browser console for error
2. Verify Supabase RLS policy allows `user_id = auth.uid()`
3. Confirm entity_id exists in entities table
4. Check that form submission is calling loadIncome() after insert

### Back button not appearing in dashboard sidebar
**Likely cause:** Editing wrong DashboardLayout file
**Fix:** Ensure editing `src/components/layout/DashboardLayout.jsx` not `src/pages/DashboardLayout.jsx`

### Date appearing as null or wrong format
**Likely cause:** Sending Date object instead of ISO string
**Fix:** Use `new Date().toISOString().split('T')[0]`

### User can't switch entities
**Expected behavior:** Must go back to profile page
**Verify:** "← Back to Profile" button works in DashboardLayout

---

## References

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [React Router](https://reactrouter.com/)
- [Context API](https://react.dev/reference/react/useContext)
