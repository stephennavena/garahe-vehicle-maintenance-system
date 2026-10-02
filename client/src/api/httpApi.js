// The real backend.
//
// Same function names and same return shapes as mockApi.js, so components
// cannot tell the difference. Data lives in your PostgreSQL database via the
// Express API.
//
// The DB uses snake_case column names (vehicle_id, job_type, current_mileage).
// This file normalises them to camelCase on the way out so the rest of the
// frontend code works unchanged whether it is talking to mock or real.

const envUrl = import.meta.env.VITE_API_BASE_URL;
// If accessed from mobile/network (e.g. 192.168.x.x) and envUrl points to localhost,
// substitute the computer's IP so mobile phones can reach the Express API on port 3000.
const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (!envUrl || envUrl.includes('localhost'))
  ? `http://${window.location.hostname}:3000`
  : (envUrl || 'http://localhost:3000');

// ── Helpers ────────────────────────────────────────────────────────────────────

function getGarageId() {
  try {
    return localStorage.getItem('garahe:garage_id') || 'demo';
  } catch {
    return 'demo';
  }
}

async function request(path, options = {}) {
  const garageId = getGarageId();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Garage-Id': garageId,
      ...options.headers,
    },
  })

  // DELETE returns 204 No Content — no body to parse
  if (response.status === 204) return null

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`)
  }

  return data
}

// Convert a DB vehicle row (snake_case) to the shape the UI expects (camelCase)
function normaliseVehicle(row) {
  return {
    id: row.id,
    model: row.model,
    currentMileage: row.current_mileage,
    photoUrl: row.photo_url || '',
    created_at: row.created_at,
  }
}

// Convert a DB maintenance row (snake_case) to the shape the UI expects
function normaliseEntry(row) {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    jobType: row.job_type,
    date: row.date ? row.date.slice(0, 10) : row.date, // keep YYYY-MM-DD only
    mileage: row.mileage,
    cost: Number(row.cost),
    notes: row.notes,
    nextDueKm: row.next_due_km ?? null,
    shopName: row.shop_name || '',
    created_at: row.created_at,
  }
}


// ── Vehicles ───────────────────────────────────────────────────────────────────

export async function listVehicles() {
  const rows = await request('/api/vehicles')
  return rows.map(normaliseVehicle)
}

export async function getVehicle(id) {
  const row = await request(`/api/vehicles/${id}`)
  return normaliseVehicle(row)
}

export async function createVehicle(input) {
  const row = await request('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify({
      model: input.model,
      current_mileage: input.currentMileage ?? input.current_mileage ?? 0,
      photo_url: input.photoUrl ?? input.photo_url ?? '',
    }),
  })
  return normaliseVehicle(row)
}

export async function updateVehicle(id, input) {
  const row = await request(`/api/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      model: input.model,
      current_mileage: input.currentMileage ?? input.current_mileage ?? 0,
      photo_url: input.photoUrl ?? input.photo_url ?? '',
    }),
  })
  return normaliseVehicle(row)
}

export async function deleteVehicle(id) {
  await request(`/api/vehicles/${id}`, { method: 'DELETE' })
}

// ── Maintenance entries ────────────────────────────────────────────────────────

export async function listMaintenanceEntries(vehicleId) {
  const path = vehicleId
    ? `/api/maintenance?vehicleId=${vehicleId}`
    : '/api/maintenance'
  const rows = await request(path)
  return rows.map(normaliseEntry)
}

export async function createMaintenanceEntry(input) {
  const row = await request('/api/maintenance', {
    method: 'POST',
    body: JSON.stringify({
      vehicle_id: input.vehicleId ?? input.vehicle_id,
      job_type: input.jobType ?? input.job_type,
      date: input.date,
      mileage: input.mileage,
      cost: input.cost ?? 0,
      notes: input.notes ?? '',
      next_due_km: input.nextDueKm ?? input.next_due_km ?? null,
      shop_name: input.shopName ?? input.shop_name ?? '',
    }),
  })
  return normaliseEntry(row)
}

export async function updateMaintenanceEntry(id, input) {
  const row = await request(`/api/maintenance/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      vehicle_id: input.vehicleId ?? input.vehicle_id,
      job_type: input.jobType ?? input.job_type,
      date: input.date,
      mileage: input.mileage,
      cost: input.cost ?? 0,
      notes: input.notes ?? '',
      next_due_km: input.nextDueKm ?? input.next_due_km ?? null,
      shop_name: input.shopName ?? input.shop_name ?? '',
    }),
  })
  return normaliseEntry(row)
}

export async function deleteMaintenanceEntry(id) {
  await request(`/api/maintenance/${id}`, { method: 'DELETE' })
}

// ── Garages ────────────────────────────────────────────────────────────────────

export async function getGarage(code) {
  const cleanCode = (code || '').trim().toLowerCase().slice(0, 64)
  return request(`/api/garages/${cleanCode}`)
}

export async function createGarageRecord({ id, name }) {
  const cleanCode = (id || '').trim().toLowerCase().slice(0, 64)
  return request('/api/garages', {
    method: 'POST',
    body: JSON.stringify({ id: cleanCode, name }),
  })
}


