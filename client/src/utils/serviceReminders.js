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
    if (!last) continue // No history — can't compute without a baseline

    const lastDate = new Date(last.date)
    lastDate.setHours(0, 0, 0, 0)
    const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))

    let status = null
    let detail = null

    // 1. Mileage check:
    // If the user specified an explicit nextDueKm on their last service, that custom target
    // completely replaces the generic vehicle interval.km!
    if (last.nextDueKm != null && !isNaN(Number(last.nextDueKm))) {
      const targetKm = Number(last.nextDueKm)
      const kmLeft = targetKm - currentMileage
      if (kmLeft < 0) {
        status = 'overdue'
        detail = `${jobType} overdue by ${Math.abs(kmLeft).toLocaleString()} km (scheduled for ${targetKm.toLocaleString()} km)`
      } else if (kmLeft === 0) {
        status = 'due-soon'
        detail = `${jobType} due now (reached ${targetKm.toLocaleString()} km target)`
      } else if (kmLeft <= 500) {
        status = 'due-soon'
        detail = `${jobType} due in ~${kmLeft.toLocaleString()} km (at ${targetKm.toLocaleString()} km)`
      }
      // If kmLeft > 500, it is NOT due yet by mileage!
    } else if (interval.km != null) {
      // Default periodic km interval (e.g. every 5,000 km)
      const kmSince = currentMileage - last.mileage
      const kmLeft = interval.km - kmSince
      if (kmLeft < 0) {
        status = 'overdue'
        detail = `${jobType} overdue by ${Math.abs(kmLeft).toLocaleString()} km past service interval`
      } else if (kmLeft === 0) {
        status = 'due-soon'
        detail = `${jobType} due now (reached ${interval.km.toLocaleString()} km interval)`
      } else if (kmLeft <= 500) {
        status = 'due-soon'
        detail = `${jobType} due in ~${kmLeft.toLocaleString()} km`
      }
    }

    // 2. Day/time interval check (only upgrades severity, doesn't downgrade)
    if (interval.days != null) {
      const daysLeft = interval.days - daysSince
      if (daysLeft < 0 && status !== 'overdue') {
        status = 'overdue'
        detail = `${jobType} overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} past interval`
      } else if (daysLeft === 0 && !status) {
        status = 'due-soon'
        detail = `${jobType} due today`
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
