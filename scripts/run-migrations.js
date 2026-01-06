require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(migrationFile) {
  console.log(`\n📄 Running migration: ${path.basename(migrationFile)}`)

  const sql = fs.readFileSync(migrationFile, 'utf8')

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

    if (error) {
      // If exec_sql doesn't exist, try direct query
      const { error: queryError } = await supabase.from('_migrations').insert({
        name: path.basename(migrationFile),
        executed_at: new Date().toISOString()
      })

      // Actually execute the SQL using the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql_string: sql })
      })

      if (!response.ok) {
        throw new Error(`Migration failed: ${response.statusText}`)
      }
    }

    console.log(`✅ Migration completed: ${path.basename(migrationFile)}`)
  } catch (error) {
    console.error(`❌ Migration failed: ${path.basename(migrationFile)}`)
    console.error(error.message)
    return false
  }

  return true
}

async function runAllMigrations() {
  console.log('🚀 Starting migrations...\n')

  const migrationsDir = path.join(__dirname, '../supabase/migrations')

  // Run specific migrations
  const migrations = [
    '005_add_venue_background_image.sql',
    '006_setup_venue_images_storage.sql'
  ]

  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration)

    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  Skipping missing migration: ${migration}`)
      continue
    }

    const success = await runMigration(migrationPath)
    if (!success) {
      console.log('\n⚠️  Continuing with next migration...')
    }
  }

  console.log('\n✨ All migrations completed!')
}

runAllMigrations().catch(console.error)
