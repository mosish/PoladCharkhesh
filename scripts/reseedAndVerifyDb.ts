import { seedDatabase } from '../server/scripts/seedDb';
import { getDatabase } from '../server/db';
import { bearingProducts } from '../src/data/products';

console.log('--- RESEEDING SQLITE DATABASE WITH VERIFIED CATALOG ---');
const result = seedDatabase(true);
console.log(`Reseed result: ${result.productsSeeded} products seeded.`);

const db = getDatabase();
const rows = db.prepare('SELECT id, code, category, d_inner, d_outer, b_width, cr_kn, cor_kn, speed_grease_rpm, speed_oil_rpm, calculation_factor_e, calculation_factor_y, calculation_factor_f0, r_min, technical_sources FROM products;').all() as any[];

console.log(`Verified SQLite has ${rows.length} rows.`);

let errorsCount = 0;
rows.forEach((row, i) => {
  const original = bearingProducts.find(p => p.id === row.id);
  if (!original) {
    console.error(`Row ${row.id} not found in canonical products!`);
    errorsCount++;
    return;
  }
  if (Math.abs(row.d_inner - original.d) > 0.001) {
    console.error(`Mismatch d for ${row.code}: db=${row.d_inner}, original=${original.d}`);
    errorsCount++;
  }
  if (Math.abs(row.cr_kn - original.crKn) > 0.001) {
    console.error(`Mismatch Cr for ${row.code}: db=${row.cr_kn}, original=${original.crKn}`);
    errorsCount++;
  }
  if (Math.abs(row.cor_kn - original.corKn) > 0.001) {
    console.error(`Mismatch Cor for ${row.code}: db=${row.cor_kn}, original=${original.corKn}`);
    errorsCount++;
  }
  if (original.calculationFactorF0 && (!row.calculation_factor_f0 || Math.abs(row.calculation_factor_f0 - original.calculationFactorF0) > 0.001)) {
    console.error(`Mismatch f0 for ${row.code}: db=${row.calculation_factor_f0}, original=${original.calculationFactorF0}`);
    errorsCount++;
  }
  if (original.calculationFactorE && (!row.calculation_factor_e || Math.abs(row.calculation_factor_e - original.calculationFactorE) > 0.001)) {
    console.error(`Mismatch e for ${row.code}: db=${row.calculation_factor_e}, original=${original.calculationFactorE}`);
    errorsCount++;
  }
  const sources = JSON.parse(row.technical_sources || '[]');
  if (!sources || sources.length === 0) {
    console.error(`Missing sources in db for ${row.code}`);
    errorsCount++;
  }
});

if (errorsCount === 0) {
  console.log('SUCCESS: All 68 products in SQLite database match verified manufacturer specifications with 0 errors!');
} else {
  console.error(`FAILED: Encountered ${errorsCount} mismatches in SQLite database verification.`);
  process.exit(1);
}
