// Data-access layer for Garahe - Vehicle Maintenance Log
//
// Every query is parameterised: values go in the array, never into the string.
// This prevents SQL injection from any form field.

// ── VEHICLES ──────────────────────────────────────────────────────────────────

export async function getAllVehicles(pool) {
  const result = await pool.query(
    'SELECT * FROM vehicles ORDER BY created_at DESC'
  )
  return result.rows
}

export async function getVehicleById(pool, id) {
  const result = await pool.query(
    'SELECT * FROM vehicles WHERE id = $1',
    [id]
  )
  return result.rows[0] ?? null
}

export async function createVehicle(pool, { model, current_mileage = 0, photo_url = '' }) {
  const result = await pool.query(
    `INSERT INTO vehicles (model, current_mileage, photo_url)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [model, current_mileage, photo_url]
  )
  return result.rows[0]
}

export async function updateVehicle(pool, id, { model, current_mileage, photo_url }) {
  const result = await pool.query(
    `UPDATE vehicles
     SET model = $1, current_mileage = $2, photo_url = COALESCE($3, photo_url)
     WHERE id = $4
     RETURNING *`,
    [model, current_mileage, photo_url ?? null, id]
  )
  return result.rows[0] ?? null
}

export async function deleteVehicle(pool, id) {
  // maintenance_entries and fuel_logs rows are removed automatically via ON DELETE CASCADE
  const result = await pool.query(
    'DELETE FROM vehicles WHERE id = $1 RETURNING id',
    [id]
  )
  return result.rowCount > 0
}

// ── MAINTENANCE ENTRIES ────────────────────────────────────────────────────────

export async function getAllEntries(pool, vehicleId) {
  if (vehicleId) {
    const result = await pool.query(
      `SELECT * FROM maintenance_entries
       WHERE vehicle_id = $1
       ORDER BY date DESC, created_at DESC`,
      [vehicleId]
    )
    return result.rows
  }
  const result = await pool.query(
    'SELECT * FROM maintenance_entries ORDER BY date DESC, created_at DESC'
  )
  return result.rows
}

export async function getEntryById(pool, id) {
  const result = await pool.query(
    'SELECT * FROM maintenance_entries WHERE id = $1',
    [id]
  )
  return result.rows[0] ?? null
}

export async function createEntry(pool, { vehicle_id, job_type, date, mileage, cost, notes, next_due_km, shop_name }) {
  const result = await pool.query(
    `INSERT INTO maintenance_entries (vehicle_id, job_type, date, mileage, cost, notes, next_due_km, shop_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [vehicle_id, job_type, date, mileage, cost ?? 0, notes ?? '', next_due_km ?? null, shop_name ?? '']
  )

  // If this entry's mileage is higher than the vehicle's recorded mileage, update it.
  await pool.query(
    `UPDATE vehicles SET current_mileage = $1
     WHERE id = $2 AND current_mileage < $1`,
    [mileage, vehicle_id]
  )

  return result.rows[0]
}

export async function updateEntry(pool, id, { vehicle_id, job_type, date, mileage, cost, notes, next_due_km, shop_name }) {
  const result = await pool.query(
    `UPDATE maintenance_entries
     SET job_type = $1, date = $2, mileage = $3, cost = $4, notes = $5,
         next_due_km = $6, shop_name = $7
     WHERE id = $8
     RETURNING *`,
    [job_type, date, mileage, cost ?? 0, notes ?? '', next_due_km ?? null, shop_name ?? '', id]
  )
  if (!result.rows[0]) return null

  // Keep vehicle mileage in sync
  await pool.query(
    `UPDATE vehicles SET current_mileage = $1
     WHERE id = $2 AND current_mileage < $1`,
    [mileage, vehicle_id]
  )

  return result.rows[0]
}

export async function deleteEntry(pool, id) {
  const result = await pool.query(
    'DELETE FROM maintenance_entries WHERE id = $1 RETURNING id',
    [id]
  )
  return result.rowCount > 0
}

// ── FUEL LOGS ─────────────────────────────────────────────────────────────────

export async function getAllFuelLogs(pool, vehicleId) {
  if (vehicleId) {
    const result = await pool.query(
      `SELECT * FROM fuel_logs WHERE vehicle_id = $1 ORDER BY date DESC, created_at DESC`,
      [vehicleId]
    )
    return result.rows
  }
  const result = await pool.query(
    'SELECT * FROM fuel_logs ORDER BY date DESC, created_at DESC'
  )
  return result.rows
}

export async function createFuelLog(pool, { vehicle_id, date, mileage, liters, price_per_liter, notes }) {
  const result = await pool.query(
    `INSERT INTO fuel_logs (vehicle_id, date, mileage, liters, price_per_liter, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [vehicle_id, date, mileage, liters, price_per_liter, notes ?? '']
  )

  // Also update vehicle mileage
  await pool.query(
    `UPDATE vehicles SET current_mileage = $1 WHERE id = $2 AND current_mileage < $1`,
    [mileage, vehicle_id]
  )

  return result.rows[0]
}

export async function updateFuelLog(pool, id, { vehicle_id, date, mileage, liters, price_per_liter, notes }) {
  const result = await pool.query(
    `UPDATE fuel_logs
     SET date = $1, mileage = $2, liters = $3, price_per_liter = $4, notes = $5
     WHERE id = $6
     RETURNING *`,
    [date, mileage, liters, price_per_liter, notes ?? '', id]
  )
  if (!result.rows[0]) return null

  await pool.query(
    `UPDATE vehicles SET current_mileage = $1 WHERE id = $2 AND current_mileage < $1`,
    [mileage, vehicle_id]
  )

  return result.rows[0]
}

export async function deleteFuelLog(pool, id) {
  const result = await pool.query(
    'DELETE FROM fuel_logs WHERE id = $1 RETURNING id',
    [id]
  )
  return result.rowCount > 0
}
