import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Locally: copy .env.example to .env and fill it in. ' +
    'On a host: add it in the dashboard, then redeploy.'
  )
  process.exit(1)
}

const isLocal =
  process.env.DATABASE_URL.includes('localhost') ||
  process.env.DATABASE_URL.includes('127.0.0.1')

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error.message)
})
