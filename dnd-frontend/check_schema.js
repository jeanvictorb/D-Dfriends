import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('characters').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
  if (data && data.length > 0) {
    console.log('Type of user_id:', typeof data[0].user_id);
    console.log('Sample user_id:', data[0].user_id);
  } else {
    // try to insert dummy to see error
    const { error: insErr } = await supabase.from('characters').insert({ name: 'test', user_id: '123e4567-e89b-12d3-a456-426614174000' });
    console.log('Insert UUID test error:', insErr);
  }
}

checkSchema();
