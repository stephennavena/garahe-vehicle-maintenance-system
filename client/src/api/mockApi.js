// The simulated backend.
//
// Same function names, same return types, and the same shape of failure as
// httpApi.js, so your components cannot tell the difference. Data lives in the
// visitor's own browser and goes no further.

import seed from './seed.json'

const KEY = 'garahe:data'

// A real network is not instant. Keeping this delay is what forces you to build
// a loading state now, while it is cheap, instead of discovering you need one
// the day you switch to the real API.
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

function read() {
  const stored = localStorage.getItem(KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // Corrupted storage. Start again rather than crashing the app.
      localStorage.removeItem(KEY)
    }
  }
  localStorage.setItem(KEY, JSON.stringify(seed))
  return seed
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  return data
}

// -- VEHICLES --

export async function listVehicles() {
  await delay()
  return read().vehicles || []
}

export async function getVehicle(id) {
  await delay()
  const found = (read().vehicles || []).find((row) => String(row.id) === String(id))
  if (!found) throw new Error('Not found')
  return found
}

export async function createVehicle(input) {
  await delay()
  const data = read()
  const created = {
    ...input,
    id: crypto.randomUUID()
  }
  data.vehicles = [...(data.vehicles || []), created]
  write(data)
  return created
}

export async function updateVehicle(id, input) {
  await delay()
  const data = read()
  const rows = data.vehicles || []
  const index = rows.findIndex((row) => String(row.id) === String(id))
  if (index === -1) throw new Error('Not found')
  rows[index] = { ...rows[index], ...input }
  data.vehicles = rows
  write(data)
  return rows[index]
}

export async function deleteVehicle(id) {
  await delay()
  const data = read()
  data.vehicles = (data.vehicles || []).filter((row) => String(row.id) !== String(id))
  // Optional: also delete associated maintenance entries
  data.maintenanceEntries = (data.maintenanceEntries || []).filter((row) => String(row.vehicleId) !== String(id))
  write(data)
}

// -- MAINTENANCE ENTRIES --

export async function listMaintenanceEntries(vehicleId) {
  await delay()
  const entries = read().maintenanceEntries || []
  if (vehicleId) {
    return entries.filter(e => String(e.vehicleId) === String(vehicleId)).sort((a, b) => new Date(b.date) - new Date(a.date))
  }
  return entries.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function createMaintenanceEntry(input) {
  await delay()
  const data = read()
  const created = {
    ...input,
    id: crypto.randomUUID()
  }
  data.maintenanceEntries = [...(data.maintenanceEntries || []), created]
  
  // Optional: Update vehicle's current mileage if this entry's mileage is higher
  const vehicles = data.vehicles || []
  const vIndex = vehicles.findIndex(v => String(v.id) === String(input.vehicleId))
  if (vIndex !== -1 && input.mileage > vehicles[vIndex].currentMileage) {
      vehicles[vIndex].currentMileage = input.mileage;
  }
  data.vehicles = vehicles;

  write(data)
  return created
}

export async function deleteMaintenanceEntry(id) {
  await delay()
  const data = read()
  data.maintenanceEntries = (data.maintenanceEntries || []).filter((row) => String(row.id) !== String(id))
  write(data)
}
