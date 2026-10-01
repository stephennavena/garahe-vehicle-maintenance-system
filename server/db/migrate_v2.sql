-- Garahe v2 migration
-- Adds: photo_url to vehicles, next_due_km + shop_name to maintenance_entries,
-- and a new fuel_logs table.
-- Safe to run on an existing database (uses IF NOT EXISTS / ALTER IF NOT EXISTS pattern).

-- vehicles: add photo_url
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT '';

-- maintenance_entries: add next_due_km (optional next service odometer) and shop_name
ALTER TABLE maintenance_entries ADD COLUMN IF NOT EXISTS next_due_km  INTEGER;
ALTER TABLE maintenance_entries ADD COLUMN IF NOT EXISTS shop_name    TEXT NOT NULL DEFAULT '';

-- Fuel log table
CREATE TABLE IF NOT EXISTS fuel_logs (
  id            SERIAL       PRIMARY KEY,
  vehicle_id    INTEGER      NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  date          DATE         NOT NULL,
  mileage       INTEGER      NOT NULL CHECK (mileage >= 0),
  liters        NUMERIC(8,2) NOT NULL CHECK (liters > 0),
  price_per_liter NUMERIC(8,2) NOT NULL CHECK (price_per_liter > 0),
  total_cost    NUMERIC(10,2) GENERATED ALWAYS AS (liters * price_per_liter) STORED,
  notes         TEXT         NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fuel_logs_vehicle_id_date_idx
  ON fuel_logs (vehicle_id, date DESC);
