import { readFileSync } from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { Client } from 'pg'

// Load .env.local like the other scripts
dotenv.config({ path: path.join(__dirname, '../.env.local') })

async function run() {
  const dbUrl = process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    console.error('❌ SUPABASE_DB_URL is not set.')
    console.error('Set it to your Supabase Postgres connection string (URI), e.g.:')
    console.error('postgresql://postgres:YOUR_DB_PASSWORD@db.aqshisastebjacqoskvb.supabase.co:5432/postgres')
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
    // For Supabase PgBouncer pooled connections, pass project ref via options
    ...(isPoolHost && projectRef ? { options: `project=${projectRef}` } : {}),
  })

  let migrationFiles = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_add_vapi_assistant_id.sql',
    'supabase/migrations/003_add_elevenlabs_voice_fields.sql',
    'supabase/migrations/004_visitor_payments_and_sessions.sql',
    'supabase/migrations/005_add_paywall_currency_description.sql',
    'supabase/migrations/005_add_venue_background_image.sql',
    'supabase/migrations/006_disable_rls_visitor_tables.sql',
    'supabase/migrations/006_setup_venue_images_storage.sql',
    'supabase/migrations/007_add_unique_constraint_paywall_org.sql',
    'supabase/migrations/008_add_voice_platform.sql',
    'supabase/migrations/add_elevenlabs_agent_id.sql',
    'supabase/migrations/009_add_landing_spec.sql',
  ]

  const startFrom = process.env.MIGRATE_FROM?.trim()
  if (startFrom) {
    const idx = migrationFiles.findIndex((rel) => rel.includes(startFrom))
    if (idx >= 0) {
      migrationFiles = migrationFiles.slice(idx)
      console.log(`➡️  Starting migrations from: ${migrationFiles[0]}`)
    } else {
      console.warn(`⚠️  MIGRATE_FROM value '${startFrom}' not found; running all.`)
    }
  }

  const isPooled = /\\.pooler\\.supabase\\.com/.test(dbUrl)
  const stripExtensions = (sql: string) => {
    if (!isPooled) return sql
    // PgBouncer (txn pooling on port 6543) rejects CREATE EXTENSION.
    // Supabase usually has required extensions pre-enabled.
    return sql
      .split('\\n')
      .filter((line) => !/^\\s*CREATE\\s+EXTENSION/i.test(line))
      .join('\\n')
  }

  try {
    console.log('🔌 Connecting to Supabase Postgres...')
    await client.connect()
    console.log('✅ Connected.')

    for (const rel of migrationFiles) {
      const filePath = path.join(__dirname, '..', rel)
      console.log(`\n📦 Applying: ${rel}`)
      const raw = readFileSync(filePath, 'utf8')
      const sql = stripExtensions(raw)
      await client.query(sql)
      console.log(`✅ Done: ${rel}`)
    }

    console.log('\n🎉 All migrations applied successfully.')
  } catch (err: any) {
    console.error('❌ Migration failed:', err?.message || err)
    process.exitCode = 1
  } finally {
    await client.end().catch(() => {})
  }
}

run()


