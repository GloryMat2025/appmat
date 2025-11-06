// test-env.js
import 'dotenv/config' // auto load .env.local

console.log('✅ Environment variables loaded (ESM)');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY);
console.log('VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY);
console.log('FCM_SERVER_KEY:', process.env.FCM_SERVER_KEY);
console.log('WEB_PUSH_EMAIL:', process.env.WEB_PUSH_EMAIL);
