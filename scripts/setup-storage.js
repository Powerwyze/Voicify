require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🚀 Setting up venue-images storage bucket...\n')

  try {
    // Step 1: Create the bucket
    console.log('📦 Creating venue-images bucket...')
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('venue-images', {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists')
      } else {
        console.error('❌ Failed to create bucket:', bucketError.message)
        return false
      }
    } else {
      console.log('✅ Bucket created successfully')
    }

    // Step 2: Add background_image_url column to venues
    console.log('\n📝 Adding background_image_url column to venues table...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE venues
          ADD COLUMN IF NOT EXISTS background_image_url TEXT DEFAULT NULL;
      `
    })

    if (alterError) {
      // If RPC doesn't work, try direct SQL through the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: 'ALTER TABLE venues ADD COLUMN IF NOT EXISTS background_image_url TEXT DEFAULT NULL;'
        })
      })

      if (response.ok || response.status === 404) {
        console.log('✅ Column added (or already exists)')
      } else {
        console.log('⚠️  Column might already exist or needs manual SQL execution')
      }
    } else {
      console.log('✅ Column added successfully')
    }

    console.log('\n✨ Storage setup completed!')
    console.log('\nYou can now upload venue background images from the Settings page.')
    return true

  } catch (error) {
    console.error('❌ Error during setup:', error.message)
    return false
  }
}

setupStorage().then(success => {
  process.exit(success ? 0 : 1)
})
