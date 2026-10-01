// Service interval definitions — how often (km and days) each job type is due.
// Used to compute reminder badges on vehicle cards and the Dashboard.

export const SERVICE_INTERVALS = {
  'Oil Change':          { km: 5000,  days: 180 },
  'PMS':                 { km: 5000,  days: 180 },
  'Brake Pads':          { km: 30000, days: null },
  'Brake Fluid':         { km: null,  days: 730 },   // ~2 years
  'Tire Change':         { km: 50000, days: null },
  'Tire Rotation':       { km: 10000, days: null },
  'Air Filter':          { km: 15000, days: null },
  'Cabin Filter':        { km: 20000, days: 365 },
  'Battery Replacement': { km: null,  days: 1095 },  // ~3 years
  'Spark Plugs':         { km: 20000, days: null },
  'Coolant Flush':       { km: 50000, days: 730 },
  'Transmission Service':{ km: 40000, days: null },
  'Timing Belt':         { km: 80000, days: null },
  'Wheel Alignment':     { km: 20000, days: null },
  'Suspension':          { km: null,  days: null },
  'Wiper Blades':        { km: null,  days: 365 },
  'General Inspection':  { km: 10000, days: 180 },
}

/**
 * Given all maintenance entries for a vehicle and its current mileage,
 * return an array of overdue/due-soon reminder objects.
 *
 * Each reminder: { jobType, status: 'overdue'|'due-soon', detail }
 */
export function computeReminders(entries, currentMileage) {
  const reminders = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Group entries by jobType and find the most recent one per type
  const latestByType = {}
  for (const e of entries) {
    if (!latestByType[e.jobType] || new Date(e.date) > new Date(latestByType[e.jobType].date)) {
      latestByType[e.jobType] = e
    }
  }

  for (const [jobType, interval] of Object.entries(SERVICE_INTERVALS)) {
    const last = latestByType[jobType]

    // Also check next_due_km set explicitly on the most recent entry
    if (last?.nextDueKm != null) {
      const kmLeft = last.nextDueKm - currentMileage
      if (kmLeft <= 0) {
        reminders.push({ jobType, status: 'overdue', detail: `${jobType} next service was due at ${last.nextDueKm.toLocaleString()} km` })
        continue
      } else if (kmLeft <= 500) {
        reminders.push({ jobType, status: 'due-soon', detail: `${jobType} due in ${kmLeft.toLocaleString()} km` })
        continue
      }
    }

    if (!last) continue // No history — can't compute without a baseline

    const lastDate = new Date(last.date)
    lastDate.setHours(0, 0, 0, 0)
    const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
    const kmSince = currentMileage - last.mileage

    let status = null
    let detail = null

    // Check km interval
    if (interval.km != null) {
      const kmLeft = interval.km - kmSince
      if (kmLeft <= 0) {
        status = 'overdue'
        detail = `${jobType} overdue — ${Math.abs(kmLeft).toLocaleString()} km past service interval`
      } else if (kmLeft <= 500) {
        status = 'due-soon'
        detail = `${jobType} due in ~${kmLeft.toLocaleString()} km`
      }
    }

    // Check day interval (only upgrades severity, doesn't downgrade)
    if (interval.days != null) {
      const daysLeft = interval.days - daysSince
      if (daysLeft <= 0 && status !== 'overdue') {
        status = 'overdue'
        detail = `${jobType} overdue — ${Math.abs(daysLeft)} days past service interval`
      } else if (daysLeft <= 30 && !status) {
        status = 'due-soon'
        detail = `${jobType} due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
      }
    }

    if (status) {
      reminders.push({ jobType, status, detail })
    }
  }

  return reminders
}
