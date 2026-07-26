const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MEDICINES_FILE = path.join(__dirname, '../data/medicine.csv');
const GENERICS_FILE = path.join(__dirname, '../data/generic.csv');

function readCSVFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file missing: ${filePath}`);
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  if (!lines.length) return [];

  function parseLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (vals[idx] || '').replace(/^"|"$/g, '');
    });
    rows.push(row);
  }
  return rows;
}

function parsePrice(packageContainer, packageSize) {
  const str = packageContainer || packageSize || '';
  if (!str) return 1.00;
  const match = str.match(/(?:৳|Tk\.?|BDT)?\s*([\d\.]+)/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 100) / 100;
  }
  return 1.00;
}

function stripHTML(html) {
  if (!html) return null;
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() || null;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Reading Bangladesh Medicine CSV files from database/data/...');
    const medicines = readCSVFile(MEDICINES_FILE);
    const generics = readCSVFile(GENERICS_FILE);

    console.log(`Loaded ${medicines.length} medicines and ${generics.length} generic entries from local CSV files.`);

    const genericMap = new Map();
    generics.forEach((g) => {
      const name = (g['generic name'] || g.name || '').trim().toLowerCase();
      if (name) genericMap.set(name, g);
    });

    await client.connect();
    console.log('Connected to PostgreSQL database.');

    const seen = new Set();
    let insertedCount = 0;
    const batchSize = 500;
    let batch = [];

    async function flushBatch() {
      if (!batch.length) return;

      const valuePlaceholders = [];
      const queryValues = [];
      let paramIdx = 1;

      batch.forEach((row) => {
        const placeholders = [];
        for (let i = 0; i < 14; i++) {
          placeholders.push(`$${paramIdx++}`);
        }
        valuePlaceholders.push(`(${placeholders.join(', ')})`);
        queryValues.push(
          row.brand, row.salt, row.strength, row.dosageForm, row.manufacturer,
          row.uses, row.sideEffects, row.contraindications, row.drugInteractions,
          row.storageInstructions, row.prescriptionRequired, row.estimatedPrice,
          row.isGeneric, row.trustRating
        );
      });

      const sql = `
        INSERT INTO master_pharmacy (
          brand_name, salt_composition, strength, dosage_form, manufacturer,
          uses, side_effects, contraindications, drug_interactions, storage_instructions,
          prescription_required, estimated_price, is_generic, trust_rating
        ) VALUES ${valuePlaceholders.join(', ')}
        ON CONFLICT DO NOTHING;
      `;

      await client.query(sql, queryValues);
      insertedCount += batch.length;
      if (insertedCount % 2500 === 0 || insertedCount === medicines.length) {
        console.log(`Imported ${insertedCount} / ${medicines.length} records...`);
      }
      batch = [];
    }

    for (const m of medicines) {
      const brand = (m['brand name'] || m.brand_name || '').trim();
      const salt = (m.generic || m.generic_name || '').trim();
      const strength = (m.strength || '').trim() || 'N/A';
      const dosageForm = (m['dosage form'] || m.dosage_form || m.type || '').trim() || 'Tablet';
      const manufacturer = (m.manufacturer || '').trim() || 'Unknown';
      const estimatedPrice = parsePrice(m['package container'], m['package size']);

      if (!brand || !salt) continue;

      const dedupKey = `${brand.toLowerCase()}|${salt.toLowerCase()}|${strength.toLowerCase()}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const gInfo = genericMap.get(salt.toLowerCase()) || {};
      const uses = stripHTML(gInfo.indication || gInfo['indication description']);
      const sideEffects = stripHTML(gInfo['side effects description']);
      const contraindications = stripHTML(gInfo['contraindications description']);
      const drugInteractions = stripHTML(gInfo['interaction description']);

      batch.push({
        brand,
        salt,
        strength,
        dosageForm,
        manufacturer,
        uses: uses ? uses.substring(0, 2000) : null,
        sideEffects: sideEffects ? sideEffects.substring(0, 2000) : null,
        contraindications: contraindications ? contraindications.substring(0, 2000) : null,
        drugInteractions: drugInteractions ? drugInteractions.substring(0, 2000) : null,
        storageInstructions: 'Store below 30°C in a cool dry place',
        prescriptionRequired: false,
        estimatedPrice,
        isGeneric: false,
        trustRating: 5.00,
      });

      if (batch.length >= batchSize) {
        await flushBatch();
      }
    }

    await flushBatch();

    const res = await client.query('SELECT COUNT(*) FROM master_pharmacy;');
    console.log(`\n✅ Database population complete! Total records in master_pharmacy: ${res.rows[0].count}`);

  } catch (err) {
    console.error('Error populating database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
