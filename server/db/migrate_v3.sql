-- Garahe v3 migration
-- Adds garage_id to vehicles to enable lightweight private garage workspaces (Option 2)
-- Default is 'demo' so existing sample data belongs to the demo showcase garage.

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS garage_id VARCHAR(64) NOT NULL DEFAULT 'demo';
CREATE INDEX IF NOT EXISTS idx_vehicles_garage_id ON vehicles(garage_id);
