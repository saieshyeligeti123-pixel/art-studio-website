# System Design & Architecture Document

> **Application:** Atelier Terre & Toile — Art Studio Website  
> **Domain:** GDGC Web Development Domain Selection Assignment  
> **Database:** SQLite (`data/artstudio.db` using Node 22 native `DatabaseSync`)  
> **Server Runtime:** Node.js Express 4.x + TypeScript (`tsx`)  
> **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion  

---

## 1. Architectural Overview

The application is structured as a full-stack, single-repository web application. The frontend is a React SPA running on Vite, and the backend is an Express HTTP server mounting RESTful API routes (`/api/*`), static asset handlers (`/seedData/*`), and Vite middlewares during development.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│   React 19 SPA · Tailwind CSS · TypeScript · State Store    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON + JWT Bearer
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express 4.x Application                     │
│  ├── /api/auth/*     (Authentication, Registration, Me)     │
│  ├── /api/paintings* (Catalog, Detail, Admin Edit, Purchase)│
│  ├── /api/orders*    (Orders List, Customer Cancellation)   │
│  ├── /api/murals*    (Bookings, Date Conflicts, Approvals)  │
│  ├── /api/pottery*   (Catalog, Commissions, Kiln Status)   │
│  └── /seedData/*     (Verified Seed Images & JSON Assets)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Synchronous Parameterized SQL
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 SQLite Engine (DatabaseSync)                │
│  ├── Database file: data/artstudio.db                       │
│  ├── Foreign Keys Enabled: PRAGMA foreign_keys = ON         │
│  ├── Write-Ahead Logging:  PRAGMA journal_mode = WAL        │
│  └── Partial Unique Indexes for Single Purchase & Bookings  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema & Relational Model

The database enforces integrity through primary keys, foreign keys with referential actions (`CASCADE`, `RESTRICT`), check constraints, and partial unique indexes.

### 2.1 Schema Definition

```sql
-- 1. USERS & PROFILES TABLE
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer', 'admin', 'studio')),
  phone TEXT,
  created_at TEXT NOT NULL
);

-- 2. STUDIO SETTINGS TABLE
CREATE TABLE studio_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. PAINTINGS TABLE
CREATE TABLE paintings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  price REAL NOT NULL CHECK(price > 0),
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'sold')),
  description TEXT NOT NULL,
  category TEXT,
  year INTEGER,
  medium TEXT,
  dimensions TEXT,
  featured INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. PAINTING ORDERS TABLE
CREATE TABLE painting_orders (
  id TEXT PRIMARY KEY,
  painting_id TEXT NOT NULL REFERENCES paintings(id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shipping_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Partial Unique Index: Exactly one active ('placed') order per painting
CREATE UNIQUE INDEX uq_painting_active_order 
  ON painting_orders(painting_id) 
  WHERE status = 'placed';

-- 5. WALL MURALS TABLE
CREATE TABLE wall_bookings (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date TEXT NOT NULL,
  wall_size_sqft INTEGER NOT NULL CHECK(wall_size_sqft >= 10 AND wall_size_sqft <= 500),
  rate_per_sqft REAL NOT NULL DEFAULT 150.0,
  total_price REAL NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state_zip TEXT NOT NULL,
  style_preference TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested', 'confirmed', 'declined', 'cancelled')),
  admin_response_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Partial Unique Index: Exactly one active booking per calendar date
CREATE UNIQUE INDEX uq_active_wall_booking_date 
  ON wall_bookings(scheduled_date) 
  WHERE status IN ('requested', 'confirmed');

-- 6. POTTERY ITEMS TABLE
CREATE TABLE pottery_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price REAL NOT NULL CHECK(base_price > 0),
  dimensions TEXT,
  image_url TEXT
);

-- 7. POTTERY GLAZES TABLE
CREATE TABLE pottery_glazes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  finish TEXT,
  description TEXT
);

-- 8. CUSTOM POTTERY REQUESTS TABLE
CREATE TABLE pottery_requests (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES pottery_items(id) ON DELETE RESTRICT,
  glaze_id TEXT NOT NULL REFERENCES pottery_glazes(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK(quantity >= 1 AND quantity <= 12),
  estimated_price REAL NOT NULL CHECK(estimated_price > 0),
  required_date TEXT NOT NULL,
  special_notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested', 'accepted', 'declined', 'cancelled')),
  admin_response_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 3. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Method & Endpoint | Unauthenticated | Customer Role | Studio Admin Role |
|---|---|:---:|:---:|:---:|
| User Registration | `POST /api/auth/register` | ✅ (Always customer) | ❌ | ❌ |
| User Login | `POST /api/auth/login` | ✅ | ✅ | ✅ |
| View Paintings | `GET /api/paintings` | ✅ (Public) | ✅ | ✅ |
| Catalog Painting | `POST /api/paintings` | 401 | 403 | ✅ |
| Edit Painting | `PUT /api/paintings/:id` | 401 | 403 | ✅ (Only if available) |
| Purchase Painting | `POST /api/paintings/:id/purchase` | 401 | ✅ | ✅ |
| View Orders | `GET /api/orders` | 401 | ✅ (Own orders) | ✅ (All orders) |
| Cancel Order | `POST /api/orders/:id/cancel` | 401 | ✅ (Own orders; 404 otherwise) | ✅ |
| Book Wall Mural | `POST /api/murals` | 401 | ✅ | ✅ |
| Cancel Mural Booking | `POST /api/murals/:id/cancel` | 401 | ✅ (Own, > 3 days; 404 otherwise) | ✅ |
| Confirm/Decline Mural | `PUT /api/murals/:id/status` | 401 | 403 | ✅ |
| Request Pottery | `POST /api/pottery` | 401 | ✅ | ✅ |
| Edit Pottery Request | `PUT /api/pottery/:id` | 401 | ✅ (Own, if 'requested'; 404 otherwise) | ✅ |
| Cancel Pottery Request| `POST /api/pottery/:id/cancel` | 401 | ✅ (Own, if 'requested'; 404 otherwise) | ✅ |
| Accept/Decline Pottery| `PUT /api/pottery/:id/status` | 401 | 403 | ✅ |
| Reset Seed Importer | `POST /api/admin/reset-seed` | 401 | 403 | ✅ |

### 3.1 HTTP Status Code Enforcements

1. **HTTP 401 (Unauthenticated):** Handled by `requireAuth` middleware whenever a valid `Authorization: Bearer <token>` is absent or expired.
2. **HTTP 403 (Forbidden):** Handled by `requireAdmin` middleware whenever an authenticated non-admin attempts a curator/admin privilege.
3. **HTTP 404 (Cross-Tenant Record Isolation):** If a customer attempts to query, edit, or cancel a record owned by another customer, the endpoint deliberately returns `404 Not Found` rather than `403 Forbidden`. This conceals the existence of other users' records.
4. **HTTP 409 (Conflict):**
   - Attempting to purchase a painting with `status = 'sold'`.
   - Attempting to book a wall mural on a date that already has an active (`requested` or `confirmed`) booking.
   - Attempting to register with an email that is already in use.

---

## 4. Assignment Domain Constraints & Business Logic

### 4.1 Service 1: Paintings
- **Unique Originality:** 12 Indian folk/classical paintings from `seedData.zip`.
- **Atomic Transactions:** Purchases run inside a SQLite transaction:
  1. Read painting with `SELECT ... WHERE id = ?`.
  2. Verify `status === 'available'`.
  3. Insert into `painting_orders` with `status = 'placed'`.
  4. Update `paintings` set `status = 'sold'`.
  5. Commit transaction.
- **Cancellation Restores Catalog:** When a customer cancels their order:
  1. Order `status` changes to `'cancelled'`.
  2. Painting `status` reverts to `'available'`.
- **Curator Editing Lock:** Admins can edit titles, descriptions, and prices only when `painting.status === 'available'`. Sold paintings are locked.

### 4.2 Service 2: Wall Murals
- **Lead Time Window:** The scheduled date must be between **7 and 90 days** from `Date.now()`.
- **Wall Area:** Size must be between **10 and 500 sq ft**.
- **Pricing:** Derived dynamically from database configuration `wall_mural_rate_per_sqft` (₹150/sq ft).
- **Date Exclusivity:** Handled simultaneously by server check and the partial unique index `uq_active_wall_booking_date`.
- **Cancellation Cutoff:** If `diffDays <= 3`, cancellation is rejected with `CANCELLATION_DEADLINE_PASSED`.

### 4.3 Service 3: Custom Pottery
- **Seed Specifications:** Items and glazes must correspond to existing records (`i-01` to `i-05`, `g-01` to `g-06`).
- **Batch Volume:** Quantity is restricted to **1 to 12 pieces**.
- **Kiln & Curing Turnaround:** Required completion date must be at least **14 days** away.
- **Status Progression:** Status begins as `requested`. Customers may only modify or cancel commissions while the status remains `requested`.

---

## 5. Security & Secret Management

- Passwords are never stored in plain text; they are salted and hashed using `bcryptjs` with 10 salt rounds.
- Secrets (`JWT_SECRET`) are loaded from environment variables with fallback defaults for zero-setup local evaluation.
- No third-party SaaS credentials (e.g. Supabase keys) are required; all persistence runs on local SQLite.
