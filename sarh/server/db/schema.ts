export const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  token_version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name_lower TEXT GENERATED ALWAYS AS (lower(customer_name)) STORED,
  customer_email_lower TEXT GENERATED ALWAYS AS (lower(customer_email)) STORED,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  created_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 999),
  unit_price REAL NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
  ON orders(status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_orders_total_amount
  ON orders(total_amount DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name_lower
  ON orders(customer_name_lower COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email_lower
  ON orders(customer_email_lower COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);
`