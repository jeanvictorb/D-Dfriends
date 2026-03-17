import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgxvjeqjcyphlkuszmoi.supabase.co'
const supabaseAnonKey = 'sb_publishable_KLqZaN3KHNqZDVEcz2siTg_74oQJ3qx'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
