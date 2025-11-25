import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// ambil dari Supabase → Project Settings → API
const supabaseUrl = 'https://qtoiurlefwodxjcichgz.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function runTest() {
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        customer_id: crypto.randomUUID(),
        total: 88.50,
        status: 'baru',
        payment_met: 'tunai',
        address: 'Test insert from CLI trigger',
      },
    ])
    .select();

  if (error) {
    console.error('❌ Error inserting order:', error);
  } else {
    console.log('✅ Test order inserted:', data);
  }
}

runTest();
