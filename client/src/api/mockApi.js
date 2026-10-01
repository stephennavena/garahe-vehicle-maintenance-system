// The simulated backend.
//
// Same function names, same return types, and the same shape of failure as
// httpApi.js, so your components cannot tell the difference. Data lives in the
// visitor's own browser and goes no further.

import seed from './seed.json'

const KEY = 'garahe:data'

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

function read() {
  const stored = localStorage.getItem(KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
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
  return (read().vehicles || []).map(v => ({
    ...v,
    photoUrl: v.photoUrl || '',
  }))
}

export async function getVehicle(id) {
  await delay()
  const found = (read().vehicles || []).find((row) => String(row.id) === String(id))
  if (!found) throw new Error('Not found')
  return { ...found, photoUrl: found.photoUrl || '' }
}

export async function createVehicle(input) {
  await delay()
  const data = read()
  const created = {
    ...input,
    photoUrl: input.photoUrl || '',
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
  data.maintenanceEntries = (data.maintenanceEntries || []).filter((row) => String(row.vehicleId) !== String(id))
  data.fuelLogs = (data.fuelLogs || []).filter((row) => String(row.vehicleId) !== String(id))
  write(data)
}

// -- MAINTENANCE ENTRIES --

export async function listMaintenanceEntries(vehicleId) {
  await delay()
  const entries = (read().maintenanceEntries || []).map(e => ({
    ...e,
    nextDueKm: e.nextDueKm ?? null,
    shopName: e.shopName || '',
  }))
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
    nextDueKm: input.nextDueKm ?? null,
    shopName: input.shopName || '',
    id: crypto.randomUUID()
  }
  data.maintenanceEntries = [...(data.maintenanceEntries || []), created]

  // Update vehicle's current mileage if this entry's mileage is higher
  const vehicles = data.vehicles || []
  const vIndex = vehicles.findIndex(v => String(v.id) === String(input.vehicleId))
  if (vIndex !== -1 && input.mileage > vehicles[vIndex].currentMileage) {
    vehicles[vIndex].currentMileage = input.mileage;
  }
  data.vehicles = vehicles;

  write(data)
  return created
}

export async function updateMaintenanceEntry(id, input) {
  await delay()
  const data = read()
  const rows = data.maintenanceEntries || []
  const index = rows.findIndex((row) => String(row.id) === String(id))
  if (index === -1) throw new Error('Not found')
  rows[index] = { ...rows[index], ...input, nextDueKm: input.nextDueKm ?? null, shopName: input.shopName || '' }
  data.maintenanceEntries = rows
  write(data)
  return rows[index]
}

export async function deleteMaintenanceEntry(id) {
  await delay()
  const data = read()
  data.maintenanceEntries = (data.maintenanceEntries || []).filter((row) => String(row.id) !== String(id))
  write(data)
}

// -- FUEL LOGS --

export async function listFuelLogs(vehicleId) {
  await delay()
  const logs = (read().fuelLogs || []).map(l => ({
    ...l,
    totalCost: Number(l.liters) * Number(l.pricePerLiter),
  }))
  if (vehicleId) {
    return logs.filter(l => String(l.vehicleId) === String(vehicleId)).sort((a, b) => new Date(b.date) - new Date(a.date))
  }
  return logs.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function createFuelLog(input) {
  await delay()
  const data = read()
  const created = {
    ...input,
    totalCost: Number(input.liters) * Number(input.pricePerLiter),
    id: crypto.randomUUID()
  }
  data.fuelLogs = [...(data.fuelLogs || []), created]

  // Update vehicle mileage
  const vehicles = data.vehicles || []
  const vIndex = vehicles.findIndex(v => String(v.id) === String(input.vehicleId))
  if (vIndex !== -1 && input.mileage > vehicles[vIndex].currentMileage) {
    vehicles[vIndex].currentMileage = input.mileage;
  }
  data.vehicles = vehicles;

  write(data)
  return created
}

export async function updateFuelLog(id, input) {
  await delay()
  const data = read()
  const rows = data.fuelLogs || []
  const index = rows.findIndex((row) => String(row.id) === String(id))
  if (index === -1) throw new Error('Not found')
  rows[index] = {
    ...rows[index],
    ...input,
    totalCost: Number(input.liters) * Number(input.pricePerLiter),
  }
  data.fuelLogs = rows
  write(data)
  return rows[index]
}

export async function deleteFuelLog(id) {
  await delay()
  const data = read()
  data.fuelLogs = (data.fuelLogs || []).filter((row) => String(row.id) !== String(id))
  write(data)
}
