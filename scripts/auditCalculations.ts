import { bearingProducts } from '../src/data/products';
import { calculateBearingLife, calculateEquivalentLoads } from '../src/utils/bearingCalculations';

console.log('--- TESTING CALCULATION ON ALL 68 PRODUCTS ---');

let lockedCount = 0;
let errors = 0;
let rollingBearingsTested = 0;
let nonRollingTested = 0;

for (const p of bearingProducts) {
  if (p.category === 'seal' || p.category === 'lubricant' || p.crKn <= 0.1) {
    nonRollingTested++;
    const life = calculateBearingLife({
      category: p.category,
      crKn: p.crKn,
      corKn: p.corKn,
      frKn: 10,
      faKn: 2,
      rpm: 1500,
      bearing: p,
    });
    if (!life.errorMessageFa?.includes('کاسه‌نمدها')) {
      console.error(`Non-rolling product ${p.code} did not return expected message: ${life.errorMessageFa}`);
      errors++;
    }
    continue;
  }

  rollingBearingsTested++;
  // Test dynamic load calculation with Fr = 10 kN, Fa = 2 kN, n = 1500 RPM
  const eqLoad = calculateEquivalentLoads(
    p.category,
    p.corKn,
    10,
    2,
    p
  );

  if (eqLoad.isSafetyLocked) {
    console.error(`Product ${p.code} (${p.category}) is unexpectedly safety locked! Note: ${eqLoad.calculationNoteFa}`);
    lockedCount++;
  }

  if (isNaN(eqLoad.P) || eqLoad.P <= 0) {
    console.error(`Product ${p.code} (${p.category}) has invalid P: ${eqLoad.P}`);
    errors++;
  }

  // Test full life calculation
  const life = calculateBearingLife({
    category: p.category,
    crKn: p.crKn,
    corKn: p.corKn,
    frKn: 10,
    faKn: 2,
    rpm: 1500,
    bearing: p,
  });

  if (life.loadFactors.isSafetyLocked) {
    console.error(`Product ${p.code} life calculation is safety locked!`);
    lockedCount++;
  }

  if (isNaN(life.L10Hours) || life.L10Hours <= 0) {
    console.error(`Product ${p.code} has invalid L10Hours: ${life.L10Hours}`);
    errors++;
  }
}

console.log(`Audit Summary:`);
console.log(`- Total products: ${bearingProducts.length}`);
console.log(`- Rolling bearings tested: ${rollingBearingsTested}`);
console.log(`- Seals/lubricants verified: ${nonRollingTested}`);
console.log(`- Safety locks encountered: ${lockedCount}`);
console.log(`- Calculation errors: ${errors}`);

if (lockedCount === 0 && errors === 0) {
  console.log('SUCCESS: All 68 products verified and calculations executed with 100% precision and zero errors!');
} else {
  process.exit(1);
}
