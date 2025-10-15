#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../lib/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf-8');

(async () => {
  await query(sql);
  console.log('✅ schema applied');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
