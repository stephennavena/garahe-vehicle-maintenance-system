// Data-access layer for Garahe - Vehicle Maintenance Log
//
// Every query is parameterised: values go in the array, never into the string.
// This prevents SQL injection from any form field.
// All queries are scoped by garage_id to ensure tenant isolation.

// ── VEHICLES ──────────────────────────────────────────────────────────────────

export async function getAllVehicles(pool, garageId = 'demo') {
  const result = await pool.query(
    'SELECT * FROM vehicles WHERE garage_id = $1 ORDER BY created_at DESC',
    [garageId]
  )
  return result.rows
}

export async function getVehicleById(pool, id, garageId = 'demo') {
  const result = await pool.query(
    'SELECT * FROM vehicles WHERE id = $1 AND garage_id = $2',
    [id, garageId]
  )
  return result.rows[0] ?? null
}

export async function createVehicle(pool, { model, current_mileage = 0, photo_url = '', garage_id = 'demo' }) {
  const result = await pool.query(
    `INSERT INTO vehicles (model, current_mileage, photo_url, garage_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [model, current_mileage, photo_url, garage_id]
  )
  return result.rows[0]
}

export async function updateVehicle(pool, id, { model, current_mileage, photo_url }, garageId = 'demo') {
  const result = await pool.query(
    `UPDATE vehicles
     SET model = $1, current_mileage = $2, photo_url = COALESCE($3, photo_url)
     WHERE id = $4 AND garage_id = $5
     RETURNING *`,
    [model, current_mileage, photo_url ?? null, id, garageId]
  )
  return result.rows[0] ?? null
}

export async function deleteVehicle(pool, id, garageId = 'demo') {
  // maintenance_entries rows are removed automatically via ON DELETE CASCADE
  const result = await pool.query(
    'DELETE FROM vehicles WHERE id = $1 AND garage_id = $2 RETURNING id',
    [id, garageId]
  )
  return result.rowCount > 0
}

// ── MAINTENANCE ENTRIES ────────────────────────────────────────────────────────

export async function getAllEntries(pool, vehicleId, garageId = 'demo') {
  if (vehicleId) {
    const result = await pool.query(
      `SELECT me.* FROM maintenance_entries me
       JOIN vehicles v ON me.vehicle_id = v.id
       WHERE me.vehicle_id = $1 AND v.garage_id = $2
       ORDER BY me.date DESC, me.created_at DESC`,
      [vehicleId, garageId]
    )
    return result.rows
  }
  const result = await pool.query(
    `SELECT me.* FROM maintenance_entries me
     JOIN vehicles v ON me.vehicle_id = v.id
     WHERE v.garage_id = $1
     ORDER BY me.date DESC, me.created_at DESC`,
    [garageId]
  )
  return result.rows
}

export async function getEntryById(pool, id, garageId = 'demo') {
  const result = await pool.query(
    `SELECT me.* FROM maintenance_entries me
     JOIN vehicles v ON me.vehicle_id = v.id
     WHERE me.id = $1 AND v.garage_id = $2`,
    [id, garageId]
  )
  return result.rows[0] ?? null
}

export async function createEntry(pool, { vehicle_id, job_type, date, mileage, cost, notes, next_due_km, shop_name }, garageId = 'demo') {
  // Validate vehicle ownership
  const vCheck = await pool.query(
    'SELECT id FROM vehicles WHERE id = $1 AND garage_id = $2',
    [vehicle_id, garageId]
  )
  if (!vCheck.rows[0]) return null

  const result = await pool.query(
    `INSERT INTO maintenance_entries (vehicle_id, job_type, date, mileage, cost, notes, next_due_km, shop_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [vehicle_id, job_type, date, mileage, cost ?? 0, notes ?? '', next_due_km ?? null, shop_name ?? '']
  )

  // If this entry's mileage is higher than the vehicle's recorded mileage, update it.
  await pool.query(
    `UPDATE vehicles SET current_mileage = $1
     WHERE id = $2 AND current_mileage < $1 AND garage_id = $3`,
    [mileage, vehicle_id, garageId]
  )

  return result.rows[0]
}

export async function updateEntry(pool, id, { vehicle_id, job_type, date, mileage, cost, notes, next_due_km, shop_name }, garageId = 'demo') {
  // Check ownership
  const entryCheck = await pool.query(
    `SELECT me.id, me.vehicle_id FROM maintenance_entries me
     JOIN vehicles v ON me.vehicle_id = v.id
     WHERE me.id = $1 AND v.garage_id = $2`,
    [id, garageId]
  )
  if (!entryCheck.rows[0]) return null

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
     WHERE id = $2 AND current_mileage < $1 AND garage_id = $3`,
    [mileage, vehicle_id, garageId]
  )

  return result.rows[0]
}

export async function deleteEntry(pool, id, garageId = 'demo') {
  const result = await pool.query(
    `DELETE FROM maintenance_entries
     WHERE id = $1 AND vehicle_id IN (SELECT id FROM vehicles WHERE garage_id = $2)
     RETURNING id`,
    [id, garageId]
  )
  return result.rowCount > 0
}

