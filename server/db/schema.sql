-- Garahe - Vehicle Maintenance Log
-- Complete database schema for production and local environments.
-- Safe to run against an empty database and safe to run twice (all statements use IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS garages (
  id          VARCHAR(64) PRIMARY KEY,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id               SERIAL      PRIMARY KEY,
  model            TEXT        NOT NULL,
  current_mileage  INTEGER     NOT NULL DEFAULT 0 CHECK (current_mileage >= 0),
  photo_url        TEXT        NOT NULL DEFAULT '',
  garage_id        VARCHAR(64) NOT NULL DEFAULT 'demo',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_garage_id ON vehicles(garage_id);

CREATE TABLE IF NOT EXISTS maintenance_entries (
  id          SERIAL         PRIMARY KEY,
  vehicle_id  INTEGER        NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  job_type    TEXT           NOT NULL,
  date        DATE           NOT NULL,
  mileage     INTEGER        NOT NULL CHECK (mileage >= 0),
  cost        NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  notes       TEXT           NOT NULL DEFAULT '',
  next_due_km INTEGER,
  shop_name   TEXT           NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Index for vehicle maintenance history, ordered by date descending
CREATE INDEX IF NOT EXISTS maintenance_entries_vehicle_id_date_idx
  ON maintenance_entries (vehicle_id, date DESC);
