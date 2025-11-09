#!/usr/bin/env node
// Helper to call admin-only debug actions on notify-new-order
// Usage (cmd.exe):
//   set ADMIN_TEST_TOKEN=... & set NOTIFY_URL=https://<project>.functions.supabase.co/notify-new-order & node supabase\scripts\admin_debug.cjs list
//   set ADMIN_TEST_TOKEN=... & set NOTIFY_URL=... & node supabase\scripts\admin_debug.cjs insert_test
//   set ADMIN_TEST_TOKEN=... & set NOTIFY_URL=... & node supabase\scripts\admin_debug.cjs delete_by_id <id>

const token = process.env.ADMIN_TEST_TOKEN;
const urlBase = process.env.NOTIFY_URL || 'https://qtoiurlefwodxjcichgz.functions.supabase.co/notify-new-order';

if (!token) {
  console.error('Please set ADMIN_TEST_TOKEN in your environment.');
  process.exit(2);
}

const action = process.argv[2];

if (!action) {
  console.error('Usage: node supabase/scripts/admin_debug.cjs <list|insert_test|delete_by_id> [id]');
  process.exit(2);
}

async function call(path) {
  const res = await fetch(path, { method: 'POST', headers: { 'x-admin-token': token, 'Content-Type': 'application/json' } });
  const text = await res.text().catch(() => '');
  console.log('status:', res.status);
  try { console.log(JSON.parse(text)); } catch (e) { console.log(text); }
}

(async () => {
  try {
    if (action === 'list') {
      await call(`${urlBase}?action=list`);
    } else if (action === 'insert_test') {
      await call(`${urlBase}?action=insert_test`);
    } else if (action === 'delete_by_id') {
      const id = process.argv[3];
      if (!id) { console.error('delete_by_id requires <id>'); process.exit(2); }
      await call(`${urlBase}?action=delete_by_id&id=${encodeURIComponent(id)}`);
    } else {
      console.error('unknown action:', action);
      process.exit(2);
    }
  } catch (err) {
    console.error('error calling admin endpoint:', err);
    process.exit(1);
  }
})();
