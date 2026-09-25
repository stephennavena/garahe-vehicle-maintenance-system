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

export async function createVehicle(pool, { model, current_mileage = 0 }) {
  const result = await pool.query(
    `INSERT INTO vehicles (model, current_mileage)
     VALUES ($1, $2)
     RETURNING *`,
    [model, current_mileage]
  )
  return result.rows[0]
}

export async function updateVehicle(pool, id, { model, current_mileage }) {
  const result = await pool.query(
    `UPDATE vehicles
     SET model = $1, current_mileage = $2
     WHERE id = $3
     RETURNING *`,
    [model, current_mileage, id]
  )
  return result.rows[0] ?? null
}

export async function deleteVehicle(pool, id) {
  // maintenance_entries rows are removed automatically via ON DELETE CASCADE
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

export async function createEntry(pool, { vehicle_id, job_type, date, mileage, cost, notes }) {
  const result = await pool.query(
    `INSERT INTO maintenance_entries (vehicle_id, job_type, date, mileage, cost, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [vehicle_id, job_type, date, mileage, cost ?? 0, notes ?? '']
  )

  // If this entry's mileage is higher than the vehicle's recorded mileage, update it.
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
