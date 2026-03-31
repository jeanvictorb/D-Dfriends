import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgxvjeqjcyphlkuszmoi.supabase.co'
const supabaseKey = 'sb_publishable_KLqZaN3KHNqZDVEcz2siTg_74oQJ3qx'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRoomsSchema() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching rooms:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns in rooms:', Object.keys(data[0]))
  } else {
    console.log('No rooms found to check schema.')
  }
}

checkRoomsSchema()
