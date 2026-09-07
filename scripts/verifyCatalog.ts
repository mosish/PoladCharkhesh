import { bearingProducts } from '../src/data/products';

console.log(`Total Products: ${bearingProducts.length}`);

interface AuditIssue {
  index: number;
  id: string;
  code: string;
  category: string;
  issues: string[];
}

const auditIssues: AuditIssue[] = [];

bearingProducts.forEach((p, idx) => {
  const issues: string[] = [];

  // Check dimension validity
  if (p.category !== 'lubricant') {
    if (!p.d || p.d <= 0) issues.push(`Invalid d: ${p.d}`);
    if (!p.D || p.D <= 0) issues.push(`Invalid D: ${p.D}`);
    if (!p.B || p.B <= 0) issues.push(`Invalid B: ${p.B}`);
    if (p.d >= p.D) issues.push(`d (${p.d}) >= D (${p.D})`);
  }

  // Check load ratings
  if (p.category === 'ball' || p.category === 'roller' || p.category === 'spherical' || p.category === 'cylindrical' || p.category === 'thrust') {
    if (!p.crKn || p.crKn <= 0) issues.push(`Missing or zero Cr: ${p.crKn}`);
    if (!p.corKn || p.corKn <= 0) issues.push(`Missing or zero C0r: ${p.corKn}`);
  }

  // Check speeds
  if (p.category !== 'lubricant') {
    if (p.speedGreaseRpm === undefined || p.speedGreaseRpm === null) issues.push('Missing speedGreaseRpm');
  }

  // Check weight
  if (p.weightKg === undefined || p.weightKg === null || p.weightKg <= 0) {
    if (p.category !== 'lubricant') issues.push('Missing or zero weightKg');
  }

  // Check calculation factors
  if (p.category === 'roller' && (p.schematicType === 'tapered' || p.code.includes('30') || p.code.includes('32') || p.code.includes('SET'))) {
    if (!p.calculationFactorE) issues.push('Missing calculationFactorE (e)');
    if (!p.calculationFactorY) issues.push('Missing calculationFactorY (Y)');
    if (!p.calculationFactorY0) issues.push('Missing calculationFactorY0 (Y0)');
  }

  if (p.category === 'spherical') {
    if (!p.calculationFactorE) issues.push('Missing calculationFactorE (e)');
    if (!p.calculationFactorY1 && !p.calculationFactorY) issues.push('Missing calculationFactorY1 or Y');
    if (!p.calculationFactorY2) issues.push('Missing calculationFactorY2');
    if (!p.calculationFactorY0) issues.push('Missing calculationFactorY0');
  }

  // Check sources
  if (!p.technicalSources || p.technicalSources.length === 0) {
    issues.push('No technical sources documented');
  } else {
    p.technicalSources.forEach((s, sIdx) => {
      if (!s.manufacturer) issues.push(`Source ${sIdx} missing manufacturer`);
      if (!s.reference) issues.push(`Source ${sIdx} missing reference`);
    });
  }

  if (issues.length > 0) {
    auditIssues.push({
      index: idx + 1,
      id: p.id,
      code: p.code,
      category: p.category,
      issues
    });
  }
});

console.log(`Found ${auditIssues.length} products with issues/gaps:`);
auditIssues.forEach(item => {
  console.log(`[#${item.index}] ${item.code} (${item.category}):`);
  item.issues.forEach(iss => console.log(`   - ${iss}`));
});
