#!/usr/bin/env node
// validate-products.js - Validate products.json against Product interface
const fs = require('fs');
const path = require('path');

const PRODUCTS_PATH = path.resolve(__dirname, 'public/assets/data/products.json');

// Product interface definition (JS, not TS)
function validateProduct(p) {
  const errors = [];
  if (!p.id || typeof p.id !== 'string') errors.push('id (string) is required');
  if (!p.name_en || typeof p.name_en !== 'string') errors.push('name_en (string) is required');
  if (p.name_bm && typeof p.name_bm !== 'string') errors.push('name_bm must be string');
  if (typeof p.base_price !== 'number') errors.push('base_price (number) is required');
  if (p.currency !== 'MYR') errors.push('currency must be "MYR"');
  if (p.images && !Array.isArray(p.images)) errors.push('images must be array');
  if (p.tags && !Array.isArray(p.tags)) errors.push('tags must be array');
  if (p.allergens && !Array.isArray(p.allergens)) errors.push('allergens must be array');
  if (p.modifier_group_ids && !Array.isArray(p.modifier_group_ids)) errors.push('modifier_group_ids must be array');
  if (typeof p.is_active !== 'boolean') errors.push('is_active (boolean) is required');
  return errors;
}

function main() {
  if (!fs.existsSync(PRODUCTS_PATH)) {
    console.error('products.json not found:', PRODUCTS_PATH);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  if (!Array.isArray(data)) {
    console.error('products.json must be an array');
    process.exit(1);
  }
  let hasError = false;
  data.forEach((p, i) => {
    const errs = validateProduct(p);
    if (errs.length) {
      hasError = true;
      console.error(`Product at index ${i} (id=${p.id || '?'}) errors:`);
      errs.forEach(e => console.error('  -', e));
    }
  });
  if (hasError) {
    process.exit(1);
  } else {
    console.log('All products valid!');
  }
}

main();
