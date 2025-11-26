const fs = require('fs');
const content = [
  'VAPID_PUBLIC_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0b2l1cmxlZndvZHhqY2ljaGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MDM1MDcsImV4cCI6MjA3NzI3OTUwN30.32q_7ibQJAukXc1jk3Z1rOmX9Iu4uyY7HbKc56Rm050.',
  'VAPID_PRIVATE_KEY=7rHhZbKjZt...',
  'SUPABASE_URL=https://qtoiurlefwodxjcichgz.supabase.co',
  'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0b2l1cmxlZndvZHhqY2ljaGd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcwMzUwNywiZXhwIjoyMDc3Mjc5NTA3fQ.OnH6tCC7kdwmweAlle480CoP3KsMkmMuzKF-GOthhT0ere',
  '# Optional: FCM server key for legacy FCM sends. Leave empty if not used.',
  'FCM_SERVER_KEY='
].join('\n') + '\n';
fs.writeFileSync('supabase/.env.local', content, 'utf8');
console.log('wrote supabase/.env.local (bytes:', Buffer.byteLength(content),')');
