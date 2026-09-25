-- Sample data for development.
--
-- This starts with TRUNCATE. That is correct on your laptop and catastrophic
-- against the database your live demo depends on. Check which DATABASE_URL is
-- loaded before you run it.

TRUNCATE TABLE maintenance_entries RESTART IDENTITY CASCADE;
TRUNCATE TABLE vehicles RESTART IDENTITY CASCADE;

INSERT INTO vehicles (model, current_mileage) VALUES
  ('BMW E90 318i',   85420),
  ('Honda Civic EK', 64405);

-- Vehicle 1: BMW E90 318i
INSERT INTO maintenance_entries (vehicle_id, job_type, date, mileage, cost, notes) VALUES
  (1, 'Oil Change',   '2026-09-15', 85420, 2500.00, 'Castrol Edge 5W-30, full synthetic'),
  (1, 'Brake Pads',   '2026-09-15', 85420, 3800.00, 'Replaced front brake pads'),
  (1, 'Tire Rotation','2026-08-01', 84100, 500.00,  'Rotated all four tires'),
  (1, 'PMS',          '2026-06-10', 81500, 4200.00, 'Periodic maintenance service at casa'),
  (1, 'Air Filter',   '2026-03-22', 79000, 650.00,  'Replaced engine air filter');

-- Vehicle 2: Honda Civic EK
INSERT INTO maintenance_entries (vehicle_id, job_type, date, mileage, cost, notes) VALUES
  (2, 'Oil Change',   '2026-09-10', 64405, 1800.00, 'Petron Blaze 10W-40 semi-synthetic'),
  (2, 'Tire Change',  '2026-08-20', 63800, 9600.00, 'New rear tires, Bridgestone Ecopia'),
  (2, 'Battery',      '2026-05-14', 61200, 3500.00, 'Replaced battery, Motolite Gold');
