import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kgxvjeqjcyphlkuszmoi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtneHZqZXFqY3lwaGxrdXN6bW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODkyMjEsImV4cCI6MjA4OTE2NTIyMX0.RD2_K2OOe87gYvpVvkgJ-WaJ0gnZogewQb1UMj_lJ9o');

async function test() {
  console.log('Testing SignUp for existing user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'test_lobby_4@dnd.local',
    password: 'password123'
  });
  console.log('SignUp Error:', signUpError?.message);

  console.log('\nTesting SignUp for new user with bad password...');
  const { data: signUpData2, error: signUpError2 } = await supabase.auth.signUp({
    email: 'test_lobby_5@dnd.local',
    password: '123'
  });
  console.log('Bad Pass Error:', signUpError2?.message);
}
test();
