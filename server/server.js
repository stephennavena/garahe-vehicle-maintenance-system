import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pool } from './db/pool.js'
import * as repo from './maintenanceRepo.js'

const app = express()

// CORS before the routes. Middleware registered after a route never sees that
// route's requests.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(helmet())
app.use(cors({
  origin: allowedOrigins,
  allowedHeaders: ['Content-Type', 'X-Garage-Id'],
}))
app.use(express.json({ limit: '2mb' })) // allow larger payloads for photo URLs

// ── Garage Isolation Middleware ───────────────────────────────────────────────
// Extracts the active garage code from the X-Garage-Id header (defaults to 'demo').
app.use((request, response, next) => {
  const raw = request.headers['x-garage-id']
  const garageId = typeof raw === 'string' && raw.trim()
    ? raw.trim().toLowerCase().slice(0, 64)
    : 'demo'
  request.garageId = garageId
  next()
})

// ── Health checks ────────────────────────────────────────────────────────────

app.get('/healthz', (request, response) => {
  response.json({ ok: true })
})

app.get('/readyz', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, db: 'up' })
  } catch (error) {
    console.error('readyz failed:', error.message)
    response.status(503).json({ ok: false, db: 'down' })
  }
})

// ── Validation ───────────────────────────────────────────────────────────────

function validateVehicle(body) {
  const errors = []
  const model = typeof body.model === 'string' ? body.model.trim() : ''
  const current_mileage = Number(body.current_mileage)
  const photo_url = typeof body.photo_url === 'string' ? body.photo_url.trim() : ''

  if (!model) errors.push('model is required')
  if (model.length > 120) errors.push('model must be 120 characters or fewer')
  if (!Number.isInteger(current_mileage) || current_mileage < 0) {
    errors.push('current_mileage must be a non-negative whole number')
  }

  return { errors, value: { model, current_mileage, photo_url } }
}

function validateEntry(body) {
  const errors = []
  const vehicle_id = Number(body.vehicle_id)
  const job_type = typeof body.job_type === 'string' ? body.job_type.trim() : ''
  const date = typeof body.date === 'string' ? body.date.trim() : ''
  const mileage = Number(body.mileage)
  const cost = Number(body.cost)
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''
  const next_due_km = (body.next_due_km !== '' && body.next_due_km != null) ? Number(body.next_due_km) : null
  const shop_name = typeof body.shop_name === 'string' ? body.shop_name.trim() : ''

  if (!Number.isInteger(vehicle_id) || vehicle_id < 1) errors.push('vehicle_id must be a valid vehicle id')
  if (!job_type) errors.push('job_type is required')
  if (job_type.length > 120) errors.push('job_type must be 120 characters or fewer')
  if (!date || isNaN(Date.parse(date))) errors.push('date must be a valid date (YYYY-MM-DD)')
  if (!Number.isInteger(mileage) || mileage < 0) errors.push('mileage must be a non-negative whole number')
  if (isNaN(cost) || cost < 0) errors.push('cost must be a non-negative number')
  if (notes.length > 2000) errors.push('notes must be 2000 characters or fewer')
  if (next_due_km != null && (!Number.isInteger(next_due_km) || next_due_km < 0)) {
    errors.push('next_due_km must be a non-negative whole number')
  }
  if (shop_name.length > 200) errors.push('shop_name must be 200 characters or fewer')

  return { errors, value: { vehicle_id, job_type, date, mileage, cost, notes, next_due_km, shop_name } }
}


// ── Vehicle routes ────────────────────────────────────────────────────────────

app.get('/api/vehicles', async (request, response, next) => {
  try {
    response.json(await repo.getAllVehicles(pool, request.garageId))
  } catch (error) {
    next(error)
  }
})

app.get('/api/vehicles/:id', async (request, response, next) => {
  try {
    const row = await repo.getVehicleById(pool, request.params.id, request.garageId)
    if (!row) return response.status(404).json({ error: 'Vehicle not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.post('/api/vehicles', async (request, response, next) => {
  const { errors, value } = validateVehicle(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    response.status(201).json(await repo.createVehicle(pool, { ...value, garage_id: request.garageId }))
  } catch (error) {
    next(error)
  }
})

app.put('/api/vehicles/:id', async (request, response, next) => {
  const { errors, value } = validateVehicle(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const row = await repo.updateVehicle(pool, request.params.id, value, request.garageId)
    if (!row) return response.status(404).json({ error: 'Vehicle not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/vehicles/:id', async (request, response, next) => {
  try {
    const removed = await repo.deleteVehicle(pool, request.params.id, request.garageId)
    if (!removed) return response.status(404).json({ error: 'Vehicle not found' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

// ── Maintenance entry routes ───────────────────────────────────────────────────

app.get('/api/maintenance', async (request, response, next) => {
  try {
    const { vehicleId } = request.query
    response.json(await repo.getAllEntries(pool, vehicleId || null, request.garageId))
  } catch (error) {
    next(error)
  }
})

app.get('/api/maintenance/:id', async (request, response, next) => {
  try {
    const row = await repo.getEntryById(pool, request.params.id, request.garageId)
    if (!row) return response.status(404).json({ error: 'Entry not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.post('/api/maintenance', async (request, response, next) => {
  const { errors, value } = validateEntry(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const created = await repo.createEntry(pool, value, request.garageId)
    if (!created) return response.status(404).json({ error: 'Vehicle not found in this garage' })
    response.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

app.put('/api/maintenance/:id', async (request, response, next) => {
  const { errors, value } = validateEntry(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const row = await repo.updateEntry(pool, request.params.id, value, request.garageId)
    if (!row) return response.status(404).json({ error: 'Entry not found in this garage' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/maintenance/:id', async (request, response, next) => {
  try {
    const removed = await repo.deleteEntry(pool, request.params.id, request.garageId)
    if (!removed) return response.status(404).json({ error: 'Entry not found in this garage' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})


// ── Catch-all & error handler ─────────────────────────────────────────────────

app.use((request, response) => {
  response.status(404).json({ error: 'No such route' })
})

app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ error: 'Something went wrong on the server' })
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Garahe API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})
