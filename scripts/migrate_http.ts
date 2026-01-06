import { readFileSync } from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

async function run() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceKey || !supabaseUrl) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local')
    process.exit(1)
  }

  // Derive project ref from URL like https://<ref>.supabase.co
  const urlObj = new URL(supabaseUrl)
  const host = urlObj.host // e.g., aqshisastebjacqoskvb.supabase.co
  const projectRef = host.split('.')[0]
  if (!projectRef) {
    console.error('❌ Could not derive project ref from NEXT_PUBLIC_SUPABASE_URL')
    process.exit(1)
  }

  const migrationFiles = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_add_vapi_assistant_id.sql',
    'supabase/migrations/003_add_elevenlabs_voice_fields.sql',
    'supabase/migrations/004_visitor_payments_and_sessions.sql',
    'supabase/migrations/005_add_paywall_currency_description.sql',
    'supabase/migrations/006_disable_rls_visitor_tables.sql',
    'supabase/migrations/007_add_unique_constraint_paywall_org.sql',
    'supabase/add_elevenlabs_agent_id.sql',
  ]

  try {
    for (const rel of migrationFiles) {
      const filePath = path.join(__dirname, '..', rel)
      const sql = readFileSync(filePath, 'utf8')
      console.log(`\n🌐 Applying via SQL API: ${rel}`)
      const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        } as any,
        body: JSON.stringify({ query: sql }),
      })
      const text = await resp.text()
      if (!resp.ok) {
        console.error('❌ SQL API error:', text)
        process.exit(1)
      } else {
        console.log('✅ Applied:', rel)
      }
    }
    console.log('\n🎉 All migrations applied via SQL API.')
  } catch (err: any) {
    console.error('❌ Migration (HTTP) failed:', err?.message || err)
    process.exit(1)
  }
}

run()


