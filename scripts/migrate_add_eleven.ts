import { readFileSync } from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

async function run() {
  const dbUrl = process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    console.error('❌ SUPABASE_DB_URL is not set.')
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = (() => {
    try {
      if (!supabaseUrl) return ''
      const u = new URL(supabaseUrl)
      return (u.host || '').split('.')[0] || ''
    } catch {
      return ''
    }
  })()

  const dbu = new URL(dbUrl)
  const isPoolHost = /\\.pooler\\.supabase\\.com$/i.test(dbu.hostname)

  const client = new Client({
    host: dbu.hostname,
    port: dbu.port ? parseInt(dbu.port, 10) : 5432,
    user: decodeURIComponent(dbu.username),
    password: decodeURIComponent(dbu.password),
    database: dbu.pathname.replace(/^\//, ''),
    ssl: { rejectUnauthorized: false },
    ...(isPoolHost && projectRef ? { options: `project=${projectRef}` } : {}),
  })

  const fileRel = 'supabase/migrations/add_elevenlabs_agent_id.sql'
  const filePath = path.join(__dirname, '..', fileRel)

  try {
    console.log('🔌 Connecting to Supabase Postgres...')
    await client.connect()
    console.log('✅ Connected.')
    console.log(`📦 Applying: ${fileRel}`)
    const raw = readFileSync(filePath, 'utf8')
    const sql = raw
      .split('\\n')
      .filter((line) => !/^\\s*CREATE\\s+EXTENSION/i.test(line))
      .join('\\n')
    await client.query(sql)
    console.log('✅ Done:', fileRel)
  } catch (err: any) {
    console.error('❌ Migration failed:', err?.message || err)
    process.exitCode = 1
  } finally {
    await client.end().catch(() => {})
  }
}

run()


