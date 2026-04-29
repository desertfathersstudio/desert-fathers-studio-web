/**
 * DFS — Phase 1 Migration Script (v2)
 *
 * Reads Google Sheets CSV exports and inserts data into Supabase.
 * Idempotent: uses upsert on natural keys so you can re-run safely.
 *
 * Usage:
 *   1. Place all CSVs in the same folder as this script (migration/)
 *   2. .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   3. From dfs-website folder: node migration/migrate.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ---------- helpers ----------
function parseCSV(filename) {
  const text = fs.readFileSync(path.join(CSV_DIR, filename), 'utf8');
  const rows = [];
  let i = 0, field = '', row = [], inQuote = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuote) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQuote = false; i++; continue; }
      field += c; i++;
    } else {
      if (c === '"') { inQuote = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\n' || c === '\r') {
        if (field !== '' || row.length) { row.push(field); rows.push(row); }
        field = ''; row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
        i++; continue;
      }
      field += c; i++;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, j) => [h, (r[j] ?? '').trim()])));
}

const clean = s => {
  if (s == null) return null;
  s = String(s).trim();
  if (s === '' || s === '-') return null;
  return s;
};
const money = s => {
  s = clean(s); if (!s) return null;
  return parseFloat(s.replace(/\$/g, '').replace(/,/g, ''));
};
const intOrNull = s => {
  s = clean(s); if (!s) return null;
  const n = parseFloat(s); return Number.isFinite(n) ? Math.round(n) : null;
};
const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
const fixName = s => {
  if (!s) return s;
  s = s.startsWith('RP. -') ? s.replace('RP. -', 'RP -') : s;
  return s.replace(/\s+/g, ' ').trim();
};

// stickers in packs that CAN be ordered individually too
const PACK_EXCEPTIONS = new Set([
  'RP - Ascension',
  'RP - Pentecost',
  'HWP - Jesus Entry into Jerusalem',
  'HWP - The Last Supper',
  'HWP - Jesus Prayer in Gethsemenie',
  'HWP - Christ in Hades',
]);

// canceled designs — skipped entirely (not imported as products, removed from mfg items)
const CANCELED_DESIGNS = new Set(['Pntokrator (Realism Face)']);

// ---------- inventory plan ----------
function plannedInventory(sku, productName, category) {
  // Pope Shenoud: 65 on hand + 60 incoming
  if (sku === 'STK-17') return { on_hand: 65, incoming: 60 };

  const stkNum = parseInt(sku.replace('STK-', ''), 10);
  // Round 1: STK-1 → STK-35 (except STK-17): 0 on hand, 60 incoming
  if (stkNum >= 1 && stkNum <= 35) return { on_hand: 0, incoming: 60 };
  // Round 2: STK-36 → STK-67: 0 / 0
  if (stkNum >= 36 && stkNum <= 67) return { on_hand: 0, incoming: 0 };
  // Resurrection Pack: 13 / 0
  if (category === 'Resurrection Pack') return { on_hand: 13, incoming: 0 };
  // Holy Week Pack: 0 / 0
  if (category === 'Holy Week Pack') return { on_hand: 0, incoming: 0 };
  return { on_hand: 0, incoming: 0 };
}

// ---------- main ----------
async function main() {
  console.log('Connecting to Supabase...');

  const { data: cats } = await supabase.from('categories').select('id, name');
  const catId = Object.fromEntries(cats.map(c => [c.name, c.id]));
  const catById = Object.fromEntries(cats.map(c => [c.id, c.name]));

  const { data: packs } = await supabase.from('sticker_packs').select('id, short_code');
  const packId = Object.fromEntries(packs.map(p => [p.short_code, p.id]));

  const { data: suppliers } = await supabase.from('suppliers').select('id, name');
  const supplierId = Object.fromEntries(suppliers.map(s => [s.name, s.id]));

  // ---------- PRODUCTS ----------
  console.log('\n→ Products');
  const productRows = parseCSV('Stickers_Business_Tracking_-_Products.csv');
  const sectionHeaders = new Set(['Round 1', 'Round 2', 'RESSURECTION', 'HOLY WEEK']);

  const productsToInsert = [];
  for (const r of productRows) {
    const name = fixName(clean(r['Design Name']));
    const sku = clean(r['Product ID']);
    if (!name || sectionHeaders.has(name) || !sku) continue;
    if (CANCELED_DESIGNS.has(name)) continue;

    const category = clean(r['Category']);
    const cat = catId[category];
    let pack = null;
    if (category === 'Resurrection Pack') pack = packId['RP'];
    if (category === 'Holy Week Pack') pack = packId['HWP'];

    const inPack = !!pack;
    const canBuyIndividually = inPack ? PACK_EXCEPTIONS.has(name) : true;

    productsToInsert.push({
      sku,
      name,
      category_id: cat || null,
      pack_id: pack,
      can_buy_individually: canBuyIndividually,
      size: clean(r['Size']) || '8cm',
      drive_link: clean(r['Design Link']),
      retail_price: 1.50,
      review_status: 'approved', // all approved per Jerome
      review_comments: clean(r['Comments']),
      active: true,
    });
  }

  const { error: pErr } = await supabase
    .from('products')
    .upsert(productsToInsert, { onConflict: 'sku' });
  if (pErr) throw pErr;
  console.log(`  ✓ ${productsToInsert.length} products upserted (all approved)`);

  const { data: dbProducts } = await supabase.from('products').select('id, sku, name, category_id, pack_id');
  const idBySku = Object.fromEntries(dbProducts.map(p => [p.sku, p.id]));
  const idByName = Object.fromEntries(dbProducts.map(p => [p.name, p.id]));
  const idByNorm = Object.fromEntries(dbProducts.map(p => [norm(p.name), p.id]));

  // ---------- INVENTORY (planned values) ----------
  console.log('\n→ Inventory');
  const invRows = dbProducts.map(p => {
    const categoryName = p.category_id ? catById[p.category_id] : null;
    const { on_hand, incoming } = plannedInventory(p.sku, p.name, categoryName);
    return {
      product_id: p.id,
      on_hand,
      incoming,
      low_stock_threshold: 10,
    };
  });
  const { error: iErr } = await supabase
    .from('inventory')
    .upsert(invRows, { onConflict: 'product_id' });
  if (iErr) throw iErr;

  const totalOnHand = invRows.reduce((s, r) => s + r.on_hand, 0);
  const totalIncoming = invRows.reduce((s, r) => s + r.incoming, 0);
  console.log(`  ✓ ${invRows.length} inventory rows upserted`);
  console.log(`    on hand: ${totalOnHand}, incoming: ${totalIncoming}`);

  // pack inventory: 0/0 (you have singles, no pre-assembled packs)
  await supabase.from('pack_inventory').upsert([
    { pack_id: packId['RP'], on_hand: 0, incoming: 0, low_stock_threshold: 5 },
    { pack_id: packId['HWP'], on_hand: 0, incoming: 0, low_stock_threshold: 5 },
  ], { onConflict: 'pack_id' });
  console.log(`  ✓ pack inventory initialized (0/0 for both packs)`);

  // ---------- MANUFACTURING ORDERS ----------
  console.log('\n→ Manufacturing Orders');
  const orderRows = parseCSV('Stickers_Business_Tracking_-_Orders.csv');

  function parseDate(s) {
    s = clean(s); if (!s) return null;
    const d = new Date(s);
    return isNaN(d) ? null : d.toISOString().slice(0, 10);
  }

  const mfgToInsert = orderRows
    .filter(r => clean(r['Order ID']))
    .map(r => ({
      order_id: clean(r['Order ID']),
      supplier_id: supplierId[clean(r['Supplier'])] || null,
      order_date: parseDate(r['Order Date']) || '2026-01-01',
      arrival_date: parseDate(r['Arrival Date']),
      total_qty: intOrNull(r['Total Qty']),
      base_cost: money(r['Base Product Cost']),
      shipping: money(r['Shipping']) ?? 0,
      extra_costs: money(r['Extra Costs']) ?? 0,
      total_cost: money(r['Total Order Cost']),
      status: (clean(r['Status']) || 'ordered').toLowerCase(),
      tracking_number: clean(r['Tracking Number']),
      notes: clean(r['Notes']),
    }));

  const { error: mErr } = await supabase
    .from('mfg_orders')
    .upsert(mfgToInsert, { onConflict: 'order_id' });
  if (mErr) throw mErr;
  console.log(`  ✓ ${mfgToInsert.length} manufacturing orders upserted`);

  const { data: dbMfg } = await supabase.from('mfg_orders').select('id, order_id');
  const mfgIdByOrderId = Object.fromEntries(dbMfg.map(m => [m.order_id, m.id]));

  // ---------- MFG ORDER ITEMS ----------
  console.log('\n→ Mfg Order Items');
  const itemRows = parseCSV('Stickers_Business_Tracking_-_Order_Items.csv');

  // wipe and re-insert
  const orderUUIDs = mfgToInsert.map(o => mfgIdByOrderId[o.order_id]).filter(Boolean);
  if (orderUUIDs.length) {
    await supabase.from('mfg_order_items').delete().in('mfg_order_id', orderUUIDs);
  }

  const itemsToInsert = [];
  let unmatched = 0;
  let skipped = 0;
  for (const r of itemRows) {
    const oid = clean(r['Order ID']);
    let design = fixName(clean(r['Design Name']));
    if (!oid || !design) continue;

    // skip canceled designs
    if (CANCELED_DESIGNS.has(design)) { skipped++; continue; }

    let pid = idByName[design] || idByNorm[norm(design)] || null;
    if (!pid && design === 'RP - Resurrection w/ Guards') pid = idByName['RP - Resurrection w/ Guards (RP)'];
    if (!pid) { unmatched++; console.warn(`    unmatched: ${oid} "${design}"`); continue; }

    const itemType = (clean(r['Item Type']) || 'full_batch').toLowerCase().replace(/ /g, '_');

    itemsToInsert.push({
      mfg_order_id: mfgIdByOrderId[oid],
      product_id: pid,
      qty_ordered: intOrNull(r['Qty Ordered']) || 0,
      item_type: itemType,
      unit_cost: money(r['Unit Cost']),
      line_base_cost: money(r['Line Base Cost']),
      shipping_allocation: money(r['Shipping Allocation']) ?? 0,
      extra_cost_allocation: money(r['Extra Cost Allocation']) ?? 0,
      total_line_cost: money(r['Total Line Cost']),
      received: clean(r['Received?']) === 'Yes',
      notes: clean(r['Notes']),
    });
  }

  const { error: iiErr } = await supabase.from('mfg_order_items').insert(itemsToInsert);
  if (iiErr) throw iiErr;
  console.log(`  ✓ ${itemsToInsert.length} mfg order items inserted (skipped ${skipped} canceled, ${unmatched} unmatched)`);

  // ---------- WHOLESALE ACCOUNTS ----------
  console.log('\n→ Wholesale Accounts');
  const { data: tiers } = await supabase.from('pricing_tiers').select('id, name');
  const tierId = Object.fromEntries(tiers.map(t => [t.name, t.id]));

  const wholesaleSeed = [
    {
      business_name: 'St. Moses Abbey',
      pricing_tier_id: tierId['Abbey'],
      email: 'TODO@example.com',
      approved: true,
      notes: 'Deepest tier — primary partnership',
    },
    {
      business_name: 'St. Mary & St. Demiana Convent',
      pricing_tier_id: tierId['Monasteries / Convents'],
      email: 'TODO@example.com',
      approved: true,
      notes: 'Convent tier',
    },
  ];

  const { data: existing } = await supabase
    .from('wholesale_accounts')
    .select('business_name');
  const existingNames = new Set((existing || []).map(e => e.business_name));
  const toAdd = wholesaleSeed.filter(w => !existingNames.has(w.business_name));
  if (toAdd.length) {
    const { error: wErr } = await supabase.from('wholesale_accounts').insert(toAdd);
    if (wErr) throw wErr;
  }
  console.log(`  ✓ ${toAdd.length} wholesale accounts added (${wholesaleSeed.length - toAdd.length} already existed)`);

  console.log('\n✅ Migration complete.\n');
  console.log(`Expected: 99 products, ${totalOnHand} stickers on hand, ${totalIncoming} incoming.`);
  console.log('Next: verify in Supabase Table Editor → inventory.');
}

main().catch(e => {
  console.error('\n❌ Migration failed:');
  console.error(e);
  process.exit(1);
});
