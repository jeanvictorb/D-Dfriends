import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgxvjeqjcyphlkuszmoi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtneHZqZXFqY3lwaGxrdXN6bW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODkyMjEsImV4cCI6MjA4OTE2NTIyMX0.RD2_K2OOe87gYvpVvkgJ-WaJ0gnZogewQb1UMj_lJ9o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
