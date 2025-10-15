#!/usr/bin/env node
import { seedDefaults } from '../lib/rbac_pg.js';

(async ()=>{
  await seedDefaults();
  console.log('✅ Seeded default permissions & roles');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
