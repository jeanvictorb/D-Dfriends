import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgxvjeqjcyphlkuszmoi.supabase.co'
const supabaseAnonKey = 'sb_publishable_KLqZaN3KHNqZDVEcz2siTg_74oQJ3qx'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const { data, error } = await supabase.from('characters').select('*').limit(1)
  if (error) {
    console.error(error)
  } else {
    console.log('Columns in characters:', data[0] ? Object.keys(data[0]) : 'No rows found')
  }
}

check()
