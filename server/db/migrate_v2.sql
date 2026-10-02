-- Garahe v2 migration
-- Adds: photo_url to vehicles, next_due_km + shop_name to maintenance_entries.
-- Safe to run on an existing database (uses IF NOT EXISTS / ALTER IF NOT EXISTS pattern).

-- vehicles: add photo_url
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT '';

-- maintenance_entries: add next_due_km (optional next service odometer) and shop_name
ALTER TABLE maintenance_entries ADD COLUMN IF NOT EXISTS next_due_km  INTEGER;
ALTER TABLE maintenance_entries ADD COLUMN IF NOT EXISTS shop_name    TEXT NOT NULL DEFAULT '';
