// seed.js — popola la tabella service_areas su Supabase dal file GeoJSON di OSM
// Utilizzo: node seed.js
// Richiede SUPABASE_URL e SUPABASE_SERVICE_KEY nel file .env

require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// ── Configurazione ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY === 'your_service_role_key_here') {
  console.error('❌  Imposta SUPABASE_URL e SUPABASE_SERVICE_KEY nel file .env');
  console.error('   Usa la Service Role Key (non la anon key) per bypassare le RLS.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const GEOJSON_PATH = './aree_servizio.geojson';
const CHUNK_SIZE = 500;

// ── Normalizzazione brand ─────────────────────────────────────────────────────
function normalizeBrand(properties) {
  const raw = (properties.operator ?? properties.brand ?? '').toLowerCase();
  if (raw.includes('autogrill'))    return 'Autogrill';
  if (raw.includes('chef express')) return 'Chef Express';
  if (raw.includes('sarni'))        return 'Sarni';
  return 'Altro';
}

// ── Parsing GeoJSON ───────────────────────────────────────────────────────────
function parseFeatures(geojson) {
  return geojson.features
    .filter((f) => f.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates))
    .map((f) => ({
      name:      f.properties?.name ?? 'Area di Servizio',
      brand:     normalizeBrand(f.properties ?? {}),
      longitude: f.geometry.coordinates[0],
      latitude:  f.geometry.coordinates[1],
    }));
}

// ── Insert a chunk ────────────────────────────────────────────────────────────
async function insertChunk(rows, index, total) {
  const { error } = await supabase.from('service_areas').insert(rows);
  if (error) {
    console.error(`  ✗ Chunk ${index} fallito:`, error.message);
    return false;
  }
  console.log(`  ✓ Chunk ${index}: ${rows.length} righe inserite (totale: ${Math.min(index * CHUNK_SIZE, total)}/${total})`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📂  Lettura file GeoJSON...');
  let geojson;
  try {
    geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf-8'));
  } catch (e) {
    console.error('❌  Impossibile leggere', GEOJSON_PATH, '—', e.message);
    process.exit(1);
  }

  const rows = parseFeatures(geojson);
  console.log(`📍  Aree trovate nel GeoJSON: ${geojson.features.length}`);
  console.log(`✅  Aree valide (con coordinate): ${rows.length}`);

  // Riepilogo brand
  const brandCount = rows.reduce((acc, r) => {
    acc[r.brand] = (acc[r.brand] ?? 0) + 1;
    return acc;
  }, {});
  console.log('🏷️   Distribuzione brand:', brandCount);

  if (rows.length === 0) {
    console.log('⚠️   Nessun dato da inserire. Uscita.');
    return;
  }

  console.log(`\n🚀  Inizio inserimento in blocchi da ${CHUNK_SIZE}...`);
  const chunks = [];
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push(rows.slice(i, i + CHUNK_SIZE));
  }

  let successi = 0;
  for (let i = 0; i < chunks.length; i++) {
    const ok = await insertChunk(chunks[i], i + 1, rows.length);
    if (ok) successi += chunks[i].length;
  }

  console.log(`\n🎉  Completato: ${successi}/${rows.length} aree inserite in service_areas.`);
}

main();
