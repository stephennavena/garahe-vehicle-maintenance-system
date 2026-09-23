// The real API.
//
// Same function names, same return types, and the same shape of failure as
// mockApi.js, so your components cannot tell the difference.

// Vite compiles this in at build time. It is public.
const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }
  return response.json()
}

// -- VEHICLES --

export async function listVehicles() {
  const res = await fetch(`${BASE_URL}/api/vehicles`)
  return handleResponse(res)
}

export async function getVehicle(id) {
  const res = await fetch(`${BASE_URL}/api/vehicles/${id}`)
  return handleResponse(res)
}

export async function createVehicle(input) {
  const res = await fetch(`${BASE_URL}/api/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse(res)
}

export async function updateVehicle(id, input) {
  const res = await fetch(`${BASE_URL}/api/vehicles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse(res)
}

export async function deleteVehicle(id) {
  const res = await fetch(`${BASE_URL}/api/vehicles/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
}

// -- MAINTENANCE ENTRIES --

export async function listMaintenanceEntries(vehicleId) {
  let url = `${BASE_URL}/api/maintenance`
  if (vehicleId) {
    url = `${BASE_URL}/api/vehicles/${vehicleId}/maintenance`
  }
  const res = await fetch(url)
  return handleResponse(res)
}

export async function createMaintenanceEntry(input) {
  const res = await fetch(`${BASE_URL}/api/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse(res)
}

export async function deleteMaintenanceEntry(id) {
  const res = await fetch(`${BASE_URL}/api/maintenance/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
}
