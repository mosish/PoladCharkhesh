import { bearingProducts } from '../src/data/products';

console.log('--- DETAILED INSPECTION OF ALL 68 PRODUCTS ---');
bearingProducts.forEach((p, idx) => {
  console.log(`\n================== [ITEM ${idx + 1}/68] ${p.id} ==================`);
  console.log(`Code: ${p.code} | Category: ${p.category} | Schematic: ${p.schematicType}`);
  console.log(`Name (FA): ${p.nameFa}`);
  console.log(`Name (EN): ${p.nameEn}`);
  console.log(`Dimensions: d=${p.d}mm, D=${p.D}mm, B=${p.B}mm, weight=${p.weightKg}kg`);
  console.log(`Loads: Cr=${p.crKn}kN, C0r=${p.corKn}kN`);
  console.log(`Speeds: Grease=${p.speedGreaseRpm}rpm, Oil=${p.speedOilRpm}rpm, Thermal=${p.thermalSpeedRatingRpm || 'N/A'}rpm`);
  console.log(`Calculation Factors: e=${p.calculationFactorE}, Y=${p.calculationFactorY}, Y0=${p.calculationFactorY0}, Y1=${p.calculationFactorY1}, Y2=${p.calculationFactorY2}, f0=${p.calculationFactorF0}, rMin=${p.rMin}`);
  console.log(`Sources: ${JSON.stringify(p.technicalSources)}`);
});
