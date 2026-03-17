import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgxvjeqjcyphlkuszmoi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtneHZqZXFqY3lwaGxrdXN6bW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODkyMjEsImV4cCI6MjA4OTE2NTIyMX0.RD2_K2OOe87gYvpVvkgJ-WaJ0gnZogewQb1UMj_lJ9o'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('Tentando login com admin@admin.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@admin.com',
    password: 'admin1',
  });

  if (error) {
    console.error('Erro de login:', error.message);
  } else {
    console.log('Login efetuado com sucesso:', data.user?.email);
    
    // Check tables
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(1);
    if (pErr) console.error('Erro profiles:', pErr);
    else console.log('Profiles table acessível.');
  }
}

testLogin();
