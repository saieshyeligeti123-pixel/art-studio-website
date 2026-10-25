# Atelier Terre & Toile — Art Studio Website

> **GDGC Web Development Domain Selection Assignment**  
> Full-Stack React + TypeScript + Node.js Express + SQLite (`data/artstudio.db`)

An artisan studio and gallery web application built with a warm cream and charcoal aesthetic, featuring an original paintings gallery, wall mural bookings, custom pottery commissions, customer and admin portals, strict role-based access control (RBAC), and persistent SQLite transactions.

---

## 🎨 Overview & Three Core Services

### 1. Unique Paintings Gallery
- **Verified Official Seed Inventory:** 12 Indian folk and classical artworks (`p-001` through `p-012`) including Madhubani, Warli, Tanjore, Pattachitra, Kalamkari, Gond, and Kerala mural styles.
- **Single-Purchase Constraint:** Each painting is unique and can be purchased only once. A partial unique index and database transaction prevent concurrent or duplicate purchases.
- **Cancellation Re-availability:** When a customer cancels their order, the artwork is automatically restored to `available` status in the gallery.
- **Admin Lock:** Studio curators can add or edit paintings only while they are available. Sold artworks are locked from editing.

### 2. Wall-Painting Mural Service
- **Booking Rules:** Customers select a date **7–90 days** from today, enter a wall size of **10–500 sq ft**, and provide a complete address.
- **Exclusive Scheduling:** Exactly **one active booking** (`requested` or `confirmed`) is allowed per calendar date, enforced by SQLite partial unique index `uq_active_wall_booking_date`.
- **Pricing Calculation:** `Total Price = Wall Size (sq ft) × ₹150 / sq ft` (verified from `seedData.zip`).
- **Cancellation Deadline:** Customers can cancel up to **three days before** the scheduled appointment date. Requests within 3 days are locked.
- **Studio Approvals:** Admin can confirm or decline bookings with optional curator notes.

### 3. Custom Pottery Studio
- **Verified Seed Catalog:** 5 traditional pottery silhouettes (`Kulhad`, `Surahi`, `Matka`, `Diya set`, `Gamla`) and 6 artisan glazes (`Kumkum Red`, `Haldi Yellow`, `Mehendi Green`, `Indigo Blue`, `Sandalwood Beige`, `Charcoal Black`).
- **Batch Restrictions:** Quantity between **1 and 12 pieces**.
- **Curing Lead Time:** Required completion date must be at least **14 days away** to allow throwing, slow drying, bisque firing, and glaze vitrification.
- **Status Lifecycle:** `requested` ➔ `accepted` / `declined` / `cancelled`.
- **Edit/Cancel Lock:** Customers can edit or cancel requests **only while their status is `requested`**. Once accepted by the studio, commissions are locked into the firing schedule.

---

## 🔐 Security & Role-Based Access Control (RBAC)

- **HTTP 401 Unauthorized:** Unauthenticated requests attempting to reserve paintings, schedule murals, or submit pottery requests receive HTTP 401.
- **HTTP 403 Forbidden:** Authenticated customers attempting admin actions (e.g., catalog editing, mural confirmations, commission approvals) receive HTTP 403.
- **HTTP 404 Isolation:** Customers attempting to access or modify orders, bookings, or requests belonging to another customer receive HTTP 404 (not 403), preserving customer privacy.
- **Admin Account Provisioning:** Public registration form (`/api/auth/register`) strictly hardcodes the `customer` role. Admin/studio accounts are provisioned exclusively via database migrations/seed scripts.
- **Password Security:** Salted and hashed with `bcryptjs` (10 rounds).
- **Session Tokens:** Signed with JWT (`jsonwebtoken`) and validated on every protected API call.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js v20+ or v22+
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Populate Seed Data into SQLite
```bash
npm run seed
```
*Imports 12 paintings, 5 pottery silhouettes, 6 glazes, ₹150/sq ft rate, studio admin (`studio@artstudio.in`), and demo customer (`saieshyeligeti123@gmail.com`) into `data/artstudio.db`.*

### 3. Run Automated Business Rules Test Suite
```bash
npm run test
```
*Validates 100% of assignment business constraints, single-purchase transactions, lead-time checks, and RBAC rules.*

### 4. Start Full-Stack Dev Server
```bash
npm run dev
```
*Starts Express on port 3000 with Vite middleware. Open `http://localhost:3000` in your browser.*

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` to configure custom variables:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_PATH` | Path to SQLite database file | `data/artstudio.db` |
| `JWT_SECRET` | Secret key for signing session tokens (required >=32 chars in production) | `artstudio-dev-only-...` |
| `PORT` | Local server listening port | `3000` |

---

## 🔑 Pre-Seeded Evaluation Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Customer** | `saieshyeligeti123@gmail.com` | `Customer@123` | Purchase paintings, book murals, request pottery, manage own orders |
| **Studio Admin** | `studio@artstudio.in` | `Studio@123` | Catalog paintings, approve/decline murals, manage kiln requests |

*(Both accounts feature convenient 1-click evaluator login buttons on the Sign In page for immediate testing.)*

---

## ⏱️ 5-Minute Evaluation Presentation Plan

| Time | Slide / Screen | Topic & Key Points |
|---|---|---|
| **0:00 – 1:00** | **Home & Gallery Overview** | - Introduce **Atelier Terre & Toile** art studio branding and design philosophy.<br>- Explain full-stack architecture: React 19 + TypeScript + Express + native SQLite (`node:sqlite`).<br>- Show the 12 Indian folk & classical paintings verified from `seedData.zip`. |
| **1:00 – 2:00** | **Authentication & RBAC** | - Demonstrate public registration enforcing `customer` role.<br>- Showcase 1-click demo logins for Saiesh (customer) and Studio Admin.<br>- Highlight HTTP 401, 403, and 404 security enforcements on the server. |
| **2:00 – 3:00** | **Service 1: Paintings** | - Purchase a painting (`p-001`) as customer.<br>- Show real-time status update to `sold` and verify double-purchase prevention.<br>- Cancel the order from Customer Dashboard and observe instant re-opening to `available` in gallery. |
| **3:00 – 4:00** | **Services 2 & 3: Murals & Pottery** | - **Mural Booking:** 7–90 day validation, 10–500 sq ft, 1-per-date exclusivity, ₹150/sq ft calculation, 3-day cancellation cutoff.<br>- **Pottery Request:** 1–12 quantity, 14-day lead time, 5 seed silhouettes, 6 seed glazes.<br>- Switch to Admin Dashboard to confirm/decline requests with studio notes. |
| **4:00 – 5:00** | **Automated Tests & Quality Audit** | - Run `npm run test` in terminal to show 100% passing suite covering all domain rules.<br>- Open the live SQLite Inspector modal.<br>- Conclude with code quality, database constraints, and submission readiness. |
