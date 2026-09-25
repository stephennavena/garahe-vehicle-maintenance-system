import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pool } from './db/pool.js'
import * as repo from './maintenanceRepo.js'

const app = express()

// CORS before the routes. Middleware registered after a route never sees that
// route's requests.
//
// Name your origins. app.use(cors()) with no options sends
// Access-Control-Allow-Origin: *, which lets any site on the internet call this
// API from a visitor's browser, and is incompatible with cookies.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(helmet())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))

// ── Health checks ────────────────────────────────────────────────────────────

// Is the process alive?
app.get('/healthz', (request, response) => {
  response.json({ ok: true })
})

// Is the database reachable? A different question, and the one that tells you
// in two seconds which half of a problem you have.
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

  if (!model) errors.push('model is required')
  if (model.length > 120) errors.push('model must be 120 characters or fewer')
  if (!Number.isInteger(current_mileage) || current_mileage < 0) {
    errors.push('current_mileage must be a non-negative whole number')
  }

  return { errors, value: { model, current_mileage } }
}

function validateEntry(body) {
  const errors = []
  const vehicle_id = Number(body.vehicle_id)
  const job_type = typeof body.job_type === 'string' ? body.job_type.trim() : ''
  const date = typeof body.date === 'string' ? body.date.trim() : ''
  const mileage = Number(body.mileage)
  const cost = Number(body.cost)
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''

  if (!Number.isInteger(vehicle_id) || vehicle_id < 1) errors.push('vehicle_id must be a valid vehicle id')
  if (!job_type) errors.push('job_type is required')
  if (job_type.length > 120) errors.push('job_type must be 120 characters or fewer')
  if (!date || isNaN(Date.parse(date))) errors.push('date must be a valid date (YYYY-MM-DD)')
  if (!Number.isInteger(mileage) || mileage < 0) errors.push('mileage must be a non-negative whole number')
  if (isNaN(cost) || cost < 0) errors.push('cost must be a non-negative number')
  if (notes.length > 2000) errors.push('notes must be 2000 characters or fewer')

  return { errors, value: { vehicle_id, job_type, date, mileage, cost, notes } }
}

// ── Vehicle routes ────────────────────────────────────────────────────────────

app.get('/api/vehicles', async (request, response, next) => {
  try {
    response.json(await repo.getAllVehicles(pool))
  } catch (error) {
    next(error)
  }
})

app.get('/api/vehicles/:id', async (request, response, next) => {
  try {
    const row = await repo.getVehicleById(pool, request.params.id)
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
    response.status(201).json(await repo.createVehicle(pool, value))
  } catch (error) {
    next(error)
  }
})

app.put('/api/vehicles/:id', async (request, response, next) => {
  const { errors, value } = validateVehicle(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const row = await repo.updateVehicle(pool, request.params.id, value)
    if (!row) return response.status(404).json({ error: 'Vehicle not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/vehicles/:id', async (request, response, next) => {
  try {
    const removed = await repo.deleteVehicle(pool, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Vehicle not found' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

// ── Maintenance entry routes ───────────────────────────────────────────────────

// GET /api/maintenance           — all entries (optional ?vehicleId=N filter)
// GET /api/maintenance/:id       — one entry
// POST /api/maintenance          — create entry
// DELETE /api/maintenance/:id    — delete entry

app.get('/api/maintenance', async (request, response, next) => {
  try {
    const { vehicleId } = request.query
    response.json(await repo.getAllEntries(pool, vehicleId || null))
  } catch (error) {
    next(error)
  }
})

app.get('/api/maintenance/:id', async (request, response, next) => {
  try {
    const row = await repo.getEntryById(pool, request.params.id)
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
    response.status(201).json(await repo.createEntry(pool, value))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/maintenance/:id', async (request, response, next) => {
  try {
    const removed = await repo.deleteEntry(pool, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Entry not found' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

// ── Catch-all & error handler ─────────────────────────────────────────────────

app.use((request, response) => {
  response.status(404).json({ error: 'No such route' })
})

// The detail goes in your logs; the visitor gets a plain message. Sending a
// stack trace to a stranger tells them about your file layout and dependencies.
app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ error: 'Something went wrong on the server' })
})

// The host chooses the port and tells you through PORT. Hardcoding 3000 is the
// commonest reason a first deploy is marked unhealthy and killed.
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Garahe API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})
