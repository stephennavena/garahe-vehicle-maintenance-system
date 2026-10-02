-- Sample data for demo showcase garage.
-- Safe for initial setup.

TRUNCATE TABLE maintenance_entries RESTART IDENTITY CASCADE;
TRUNCATE TABLE vehicles RESTART IDENTITY CASCADE;

INSERT INTO vehicles (id, model, current_mileage, photo_url, garage_id) VALUES
  (1, 'BMW E90 318i',   85420, '', 'demo'),
  (2, 'Honda Civic EK', 64405, '', 'demo');

SELECT setval('vehicles_id_seq', (SELECT MAX(id) FROM vehicles));

-- Vehicle 1: BMW E90 318i
INSERT INTO maintenance_entries (vehicle_id, job_type, date, mileage, cost, notes, next_due_km, shop_name) VALUES
  (1, 'Oil Change',   '2026-09-15', 85420, 2500.00, 'Castrol Edge 5W-30, full synthetic', 90420, 'Bimmer Haus'),
  (1, 'Brake Pads',   '2026-09-15', 85420, 3800.00, 'Replaced front brake pads', 115000, 'Bimmer Haus'),
  (1, 'Tire Rotation','2026-08-01', 84100, 500.00,  'Rotated all four tires', 94100, 'Goodyear Servitek'),
  (1, 'PMS',          '2026-06-10', 81500, 4200.00, 'Periodic maintenance service at casa', 86500, 'BMW AutoAllee'),
  (1, 'Air Filter',   '2026-03-22', 79000, 650.00,  'Replaced engine air filter', 94000, 'DIY');

-- Vehicle 2: Honda Civic EK
INSERT INTO maintenance_entries (vehicle_id, job_type, date, mileage, cost, notes, next_due_km, shop_name) VALUES
  (2, 'Oil Change',   '2026-09-10', 64405, 1800.00, 'Petron Blaze 10W-40 semi-synthetic', 69405, 'SpeedLab'),
  (2, 'Tire Change',  '2026-08-20', 63800, 9600.00, 'New rear tires, Bridgestone Ecopia', null, 'Bridgestone Tire Center'),
  (2, 'Battery Replacement', '2026-05-14', 61200, 3500.00, 'Replaced battery, Motolite Gold', null, 'Motolite Express');

SELECT setval('maintenance_entries_id_seq', (SELECT MAX(id) FROM maintenance_entries));
