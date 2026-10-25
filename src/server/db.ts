import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(process.cwd(), 'data/artstudio.db');
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initializes the database schema with tables, constraints, foreign keys, and unique indexes
 */
export function initDatabase() {
  db.exec(`
    -- 1. USERS & PROFILES TABLE
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'admin', 'studio')),
      phone TEXT,
      created_at TEXT NOT NULL
    );

    -- 2. STUDIO CONFIGURATION / SETTINGS
    CREATE TABLE IF NOT EXISTS studio_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 3. PAINTINGS INVENTORY TABLE
    CREATE TABLE IF NOT EXISTS paintings (
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

    -- 4. PAINTING ORDERS TABLE (Single purchase rule)
    CREATE TABLE IF NOT EXISTS painting_orders (
      id TEXT PRIMARY KEY,
      painting_id TEXT NOT NULL REFERENCES paintings(id) ON DELETE RESTRICT,
      customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      shipping_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed', 'cancelled')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Partial index ensuring only ONE active ('placed') order per painting
    CREATE UNIQUE INDEX IF NOT EXISTS uq_painting_active_order 
      ON painting_orders(painting_id) 
      WHERE status = 'placed';

    -- 5. WALL PAINTING BOOKINGS TABLE
    CREATE TABLE IF NOT EXISTS wall_bookings (
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

    -- Partial index ensuring only ONE active booking per scheduled date
    CREATE UNIQUE INDEX IF NOT EXISTS uq_active_wall_booking_date 
      ON wall_bookings(scheduled_date) 
      WHERE status IN ('requested', 'confirmed');

    -- 6. POTTERY ITEMS SPECIFICATION TABLE
    CREATE TABLE IF NOT EXISTS pottery_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      base_price REAL NOT NULL CHECK(base_price > 0),
      dimensions TEXT,
      image_url TEXT
    );

    -- 7. POTTERY GLAZES SPECIFICATION TABLE
    CREATE TABLE IF NOT EXISTS pottery_glazes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      finish TEXT,
      description TEXT
    );

    -- 8. CUSTOM POTTERY REQUESTS TABLE
    CREATE TABLE IF NOT EXISTS pottery_requests (
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
  `);

  console.log('[SQLite] Schema initialized at:', DB_PATH);
}
