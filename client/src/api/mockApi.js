import seed from './seed.json'

function getStorageKey() {
  const garageId = (localStorage.getItem('garahe:garage_id') || 'demo').toLowerCase();
  return garageId === 'demo' ? 'garahe:data' : `garahe:data:${garageId}`;
}

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

function read() {
  const key = getStorageKey();
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(key);
    }
  }
  const initial = key === 'garahe:data'
    ? seed
    : { vehicles: [], maintenanceEntries: [] };
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

function write(data) {
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

// ── Vehicles ───────────────────────────────────────────────────────────────────

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
  write(data)
}

// ── Maintenance entries ────────────────────────────────────────────────────────

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

// ── Garages ────────────────────────────────────────────────────────────────────

export async function getGarage(code) {
  await delay()
  const cleanCode = (code || '').trim().toLowerCase()
  if (cleanCode === 'demo') {
    return { id: 'demo', name: 'Demo Showcase', exists: true }
  }
  let registered = {}
  try {
    registered = JSON.parse(localStorage.getItem('garahe:registered_garages') || '{}')
  } catch {}

  if (registered[cleanCode]) {
    return { id: cleanCode, name: registered[cleanCode], exists: true }
  }

  const existingData = localStorage.getItem(`garahe:data:${cleanCode}`)
  if (existingData) {
    try {
      const parsed = JSON.parse(existingData)
      if (parsed.vehicles && parsed.vehicles.length > 0) {
        return { id: cleanCode, name: `Garage ${cleanCode.toUpperCase()}`, exists: true }
      }
    } catch {}
  }

  throw new Error(`No garage found with code "${cleanCode.toUpperCase()}".`)
}

export async function createGarageRecord({ id, name }) {
  await delay()
  const cleanCode = (id || '').trim().toLowerCase()
  const cleanName = name || `Garage ${cleanCode.toUpperCase()}`
  let registered = {}
  try {
    registered = JSON.parse(localStorage.getItem('garahe:registered_garages') || '{}')
  } catch {}
  registered[cleanCode] = cleanName
  localStorage.setItem('garahe:registered_garages', JSON.stringify(registered))
  return { id: cleanCode, name: cleanName, exists: true }
}
