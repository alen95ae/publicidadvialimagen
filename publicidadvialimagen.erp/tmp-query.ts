import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing env values')
    process.exit(1)
  }
  const supabase = createClient(url, key)
  const { data, error } = await supabase.from('soportes').select('*').limit(5)
  console.log('error:', error)
  console.dir(data, { depth: 5 })
}

main()
