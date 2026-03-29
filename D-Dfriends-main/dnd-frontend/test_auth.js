const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgxvjeqjcyphlkuszmoi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtneHZqZXFqY3lwaGxrdXN6bW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODkyMjEsImV4cCI6MjA4OTE2NTIyMX0.RD2_K2OOe87gYvpVvkgJ-WaJ0gnZogewQb1UMj_lJ9o');

async function test() {
  console.log('Testing SignUp...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'test_lobby_3@dnd.local',
    password: 'password123'
  });
  console.log('SignUp Data ID:', signUpData?.user?.id);
  console.log('SignUp Error:', signUpError);

  if (signUpData?.user) {
    console.log('\nTesting Profiles Insert...');
    const { data: profData, error: profError } = await supabase
      .from('profiles')
      .insert([{ id: signUpData.user.id, username: 'test_lobby_3', status: 'pending' }])
      .select();
    console.log('Profile Insert Data:', profData);
    console.log('Profile Insert Error:', profError);
  }
}
test();
