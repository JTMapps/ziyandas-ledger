# Ziyandas Ledger - Architecture Overview

## System Overview

This is an entity-aware financial ledger system that allows users to manage multiple financial entities (Personal, Trust, Holding, Business) with separate income and expense tracking for each.

---

## Database Schema

### `entities` Table
Stores financial entities owned by users.
```sql
id: UUID (primary key)
name: TEXT
type: ENUM ('Personal', 'Trust', 'Holding', 'Business')
created_by: UUID (auth.users.id)
created_at: TIMESTAMP
```
**RLS Policy:** Users can only access entities where `created_by = auth.uid()`

### `income_entries` Table
Tracks all income for a user across entities.
```sql
id: UUID (primary key)
user_id: UUID (auth.users.id)
entity_id: UUID (entities.id)
date_received: DATE
amount_net: NUMERIC
description: TEXT
payment_method: TEXT (nullable)
pdf_upload_url: TEXT (nullable)
notes: TEXT (nullable)
timestamp_created: TIMESTAMP
```
**RLS Policy:** Users can only access entries where `user_id = auth.uid()`

### `expense_entries` Table
Tracks all expenses for a user across entities.
```sql
id: UUID (primary key)
user_id: UUID (auth.users.id)
entity_id: UUID (entities.id)
date_spent: DATE
amount: NUMERIC
category: ENUM ('Food', 'Transport', 'Medical', ...)
description: TEXT
is_tax_deductible: BOOLEAN
payment_method: TEXT (nullable)
pdf_upload_url: TEXT (nullable)
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
  └── EntityProvider (top-level context)
      └── App.jsx (session management + routing)
          ├── AuthPage (no session)
          └── Routes (has session)
              ├── / → EntityGate (smart router)
              ├── /entities/new → EntitySetup (create entity form)
              ├── /entities → EntitiesPage (entity selector)
              └── /entities/:entityId/* → EntityDashboard
                  ├── EntityProvider (entityId prop)
                  ├── DashboardLayout (sidebar + navigation)
                  └── Routes
                      ├── income → IncomePage
                      ├── expenses → ExpensePage
                      ├── analytics → AnalyticsPage
                      └── reports → ReportsPage
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
- App.jsx detects session via `onAuthStateChange`

### 2. EntityGate (Smart Router)
**File:** `src/pages/EntityGate.jsx`
- Checks if user has entities in database
- **If no entities:** Redirect to `/entities/new` (EntitySetup)
- **If has entities:** Redirect to `/entities` (EntitiesPage)

### 3. Entity Selection
**File:** `src/pages/EntitiesPage.jsx`
- Lists all user's entities
- On click: Navigate to `/entities/{entityId}`
- Passes entityId to EntityDashboard

### 4. Dashboard
**File:** `src/pages/EntityDashboard.jsx`
- Receives entityId from URL params
- Creates EntityProvider with `entityId` prop
- EntityProvider pre-selects that entity
- Renders DashboardLayout + pages for that entity

### 5. Data Operations
- **Income/Expense insertion:** User fills form → data saved with `entity_id` + `user_id`
- **Data retrieval:** Pages query with `.eq('entity_id', entity.id)`
- **RLS enforcement:** Database prevents cross-user access via `user_id = auth.uid()`

---

## Critical Data Flow

### Adding an Income Entry
```
1. User fills IncomePage form with:
   - amount_net
   - description
   - (date_received defaults to today)

2. handleSubmit() executes:
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

3. RLS Policy Validation:
   Database checks: user_id = auth.uid()
   ✅ PASS → Entry saved

4. Entry appears in:
   - Income list (immediately)
   - Analytics page (aggregated)
   - Reports page (in date range)
```

### Switching Entities
```
1. User clicks entity in DashboardLayout dropdown

2. DashboardLayout executes:
   setEntity(selectedEntityId)  ← Updates context

3. EntityProvider updates:
   entity = <new entity object>

4. IncomePage & ExpensePage useEffect triggered:
   useEffect(() => {
     if (entity) {
       loadIncome()  // Re-queries with new entity_id
     }
   }, [entity])

5. UI re-renders with new entity's data
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

- [ ] AnalyticsPage: Implement proper aggregations by entity
- [ ] ReportsPage: Implement date-range filtering and exports
- [ ] PDF upload integration via Supabase Storage
- [ ] Auto-create Personal entity on user signup
- [ ] Payment method tracking
- [ ] Tax-deductible expense filtering
- [ ] Monthly/yearly breakdown views
- [ ] CSV/PDF export functionality
- [ ] Document attachment viewing

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

### "Create your first entity" on login despite having entities
**Likely cause:** EntityGate querying wrong column name
**Fix:** Ensure EntityGate uses `eq('created_by', user.id)` not `eq('user_id', user.id)`

### Income/Expense entries not appearing
**Likely cause:** Entity ID mismatch or RLS rejection
**Debug:**
1. Check browser console for error
2. Verify Supabase RLS policy allows user_id = auth.uid()
3. Confirm entity_id exists in entities table

### Date appearing as null or wrong format
**Likely cause:** Sending Date object instead of ISO string
**Fix:** Use `new Date().toISOString().split('T')[0]`

---

## References

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [React Router](https://reactrouter.com/)
- [Context API](https://react.dev/reference/react/useContext)
