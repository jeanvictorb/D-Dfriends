import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgxvjeqjcyphlkuszmoi.supabase.co'
const supabaseKey = 'sb_publishable_KLqZaN3KHNqZDVEcz2siTg_74oQJ3qx'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugMessage() {
  const { data, error } = await supabase
    .from('room_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching message:', error)
    return
  }

  if (data && data[0]) {
    const msg = data[0]
    console.log('--- MESSAGE DEBUG ---')
    console.log('ID:', msg.id)
    console.log('Player:', msg.player_name)
    console.log('Content Length:', msg.content.length)
    console.log('Content Ends With:', msg.content.substring(msg.content.length - 20))
    console.log('----------------------')
  } else {
    console.log('No messages found.')
  }
}

debugMessage()
