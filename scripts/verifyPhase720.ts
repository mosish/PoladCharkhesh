import './testDatabase';
import { getDatabase } from '../server/db';
import { companyDb } from '../server/services/companyDb';
import { validateCompanyPayload, containsForbiddenKeys } from '../server/validation';
import { 
  COMPANY_INFO, 
  generateWorkingHoursStrings, 
  toPersianDigits, 
  CANONICAL_WORKING_HOURS_CONFIG,
  StructuredWorkingHours
} from '../src/data/company';
import { bearingProducts } from '../src/data/products';
import { calculateBearingLife } from '../src/utils/bearingCalculations';

async function runPhase72Verification() {
  console.log('=====================================================');
  console.log('PHASE 7.2 - COMPANY, CONTACT & GLOBAL SETTINGS VERIFICATION');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // 1. CANONICAL PRODUCT INTEGRITY (68 Products Invariant)
  // ----------------------------------------------------
  console.log('--- 1. Canonical Product Integrity Invariant ---');
  const db = getDatabase();
  const dbCountRow = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_archived = 0;').get() as any;
  const dbTotalRow = db.prepare('SELECT COUNT(*) as c FROM products;').get() as any;

  assert(dbTotalRow.c === 68, `Database products count is strictly 68 (actual: ${dbTotalRow.c})`);
  assert(dbCountRow.c === 68, `Active products count is strictly 68 (actual: ${dbCountRow.c})`);
  assert(bearingProducts.length === 68, `Static canonical dataset has strictly 68 products (actual: ${bearingProducts.length})`);

  // Verify technical calculation invariant
  const testP = db.prepare('SELECT * FROM products WHERE code = ?;').get('6204-2RSH / 2RS1') as any;
  assert(testP && testP.d_inner === 20 && testP.cr_kn === 13.5 && testP.cor_kn === 6.55, 'Technical engineering data for 6204-2RSH unmodified');
  
  const life = calculateBearingLife({
    category: 'ball',
    crKn: testP.cr_kn,
    corKn: testP.cor_kn,
    frKn: 1.35,
    faKn: 0,
    rpm: 1000,
    reliabilityLevel: 90,
  });
  assert(Math.round(life.L10Hours) === 16667, 'ISO 281 bearing life calculation formula output verified');

  // ----------------------------------------------------
  // 2. CANONICAL COMPANY VALUES & ALIASES PRESERVATION
  // ----------------------------------------------------
  console.log('\n--- 2. Company Identity & Aliases Preservation ---');
  assert(COMPANY_INFO.nameFa === 'پولاد چرخِش', 'Canonical Persian brand name preserved');
  assert(COMPANY_INFO.nameEn === 'PoladCharkhesh', 'Canonical English brand name preserved');
  assert(COMPANY_INFO.primaryPhone === '09127195313', 'Canonical primary phone preserved');
  assert(COMPANY_INFO.landlinePhone === '02177209117', 'Canonical landline phone preserved');
  assert(COMPANY_INFO.whatsappNumber === '+989127195313', 'Canonical WhatsApp number preserved');
  assert(COMPANY_INFO.addressFa.includes('دردشت'), 'Canonical Persian address preserved');
  assert(COMPANY_INFO.addressEn.includes('Dardasht'), 'Canonical English address preserved');

  // Check aliases
  assert(COMPANY_INFO.companyNameFa === COMPANY_INFO.nameFa, 'companyNameFa alias matches nameFa');
  assert(COMPANY_INFO.companyNameEn === COMPANY_INFO.nameEn, 'companyNameEn alias matches nameEn');
  assert(COMPANY_INFO.taglineFa === COMPANY_INFO.sloganFa, 'taglineFa alias matches sloganFa');
  assert(COMPANY_INFO.officeAddressFa === COMPANY_INFO.addressFa, 'officeAddressFa alias matches addressFa');

  // ----------------------------------------------------
  // 3. CONTACT & COMMUNICATION REPEATABLE FIELDS & TOGGLES
  // ----------------------------------------------------
  console.log('\n--- 3. Contact & Communication Repeatable Lines ---');
  const initialCompany = companyDb.getCompanyInfo();
  assert(Array.isArray(initialCompany.landlinePhones), 'landlinePhones is array');
  assert(initialCompany.landlinePhones!.includes('02177209117'), 'Canonical landline 02177209117 present in landlinePhones array');
  assert(initialCompany.whatsappEnabled === true, 'whatsappEnabled defaults to true');
  assert(initialCompany.phoneEnabled === true, 'phoneEnabled defaults to true');
  assert(initialCompany.contactCtaEnabled === true, 'contactCtaEnabled defaults to true');

  // ----------------------------------------------------
  // 4. STRUCTURED WORKING HOURS & BILINGUAL GENERATOR
  // ----------------------------------------------------
  console.log('\n--- 4. Structured Working Hours & Bilingual Output ---');
  const testConfig: StructuredWorkingHours = {
    workDaysFa: 'شنبه تا چهارشنبه',
    workDaysEn: 'Sat - Wed',
    openTime: '08:00',
    closeTime: '16:00',
    hasThursdayHours: true,
    thursdayOpenTime: '08:00',
    thursdayCloseTime: '13:00',
    closedDaysFa: 'جمعه تعطیل',
    closedDaysEn: 'Friday Closed',
  };

  const generated = generateWorkingHoursStrings(testConfig);
  assert(generated.workingHoursFa.includes('شنبه تا چهارشنبه: ۰۸:۰۰ الی ۱۶:۰۰'), 'Persian working hours formatted with Persian digits');
  assert(generated.workingHoursFa.includes('پنج‌شنبه: ۰۸:۰۰ الی ۱۳:۰۰'), 'Thursday hours properly appended in Persian');
  assert(generated.workingHoursEn === 'Sat - Wed: 08:00 - 16:00 | Thu: 08:00 - 13:00', 'English working hours properly generated');
  assert(generated.workingHoursShortFa === '۰۸:۰۰ الی ۱۶:۰۰', 'Short format Persian generated');
  assert(generated.workingHoursShortEn === '08:00 - 16:00', 'Short format English generated');

  // ----------------------------------------------------
  // 5. SECURITY & VALIDATION DEFENSES
  // ----------------------------------------------------
  console.log('\n--- 5. Security & Server Validation Rules ---');
  
  // Prototype pollution rejection
  const protoAttempt = JSON.parse('{"__proto__": {"polluted": true}, "companyNameFa": "پولاد"}');
  assert(containsForbiddenKeys(protoAttempt) === true, 'containsForbiddenKeys catches __proto__ injection');
  const vProto = validateCompanyPayload(protoAttempt);
  assert(!vProto.isValid, 'validateCompanyPayload rejects prototype pollution');

  // Email format validation
  const vBadEmail = validateCompanyPayload({ inquiryEmail: 'invalid-email-address' });
  assert(!vBadEmail.isValid && vBadEmail.errors.some(e => e.includes('پست الکترونیکی')), 'Rejects invalid inquiryEmail format');

  // Valid email passes
  const vGoodEmail = validateCompanyPayload({ inquiryEmail: 'sales@poladcharkhesh.ir' });
  assert(vGoodEmail.isValid && vGoodEmail.sanitized?.inquiryEmail === 'sales@poladcharkhesh.ir', 'Valid email accepted');

  // Arbitrary unwhitelisted keys filtered out
  const vUnwhitelisted = validateCompanyPayload({ 
    companyNameFa: 'پولاد چرخِش',
    injectedKeyHacked: 'malicious payload',
    internalConfig: 1234
  });
  assert(vUnwhitelisted.isValid, 'Payload with extra keys processes sanitized whitelist');
  assert(vUnwhitelisted.sanitized?.injectedKeyHacked === undefined, 'Unapproved key filtered out from sanitized result');
  assert(vUnwhitelisted.sanitized?.internalConfig === undefined, 'Internal unapproved key filtered out');
  assert(vUnwhitelisted.sanitized?.companyNameFa === 'پولاد چرخِش', 'Whitelisted key preserved');

  // Repeatable landline validation
  const vPhones = validateCompanyPayload({
    landlinePhones: ['02177209117', '02177209118', '021-77209119']
  });
  assert(vPhones.isValid && vPhones.sanitized?.landlinePhones.length === 3, 'Valid repeatable landline phones validated');

  // ----------------------------------------------------
  // 6. DATABASE PERSISTENCE & RESTORE ROUNDTRIP
  // ----------------------------------------------------
  console.log('\n--- 6. SQLite Persistence & Restart Verification ---');
  
  // Verify persistence inside an isolated savepoint so production-like data is never changed by the test.
  db.exec('SAVEPOINT phase72_company_verification;');
  try {
    const originalCompany = companyDb.getCompanyInfo();
    const probeSecondaryMobile = originalCompany.secondaryMobile === '09121112233' ? '09121112234' : '09121112233';
    const probeEmail = originalCompany.inquiryEmail === 'phase72-check@example.invalid'
      ? 'phase72-check-2@example.invalid'
      : 'phase72-check@example.invalid';

    const updatedResult = companyDb.updateCompanyInfo({
      secondaryMobile: probeSecondaryMobile,
      inquiryEmail: probeEmail,
    }, 'phase72-verifier');

    assert(updatedResult.secondaryMobile === probeSecondaryMobile, 'updateCompanyInfo returns merged secondaryMobile');
    assert(updatedResult.inquiryEmail === probeEmail, 'updateCompanyInfo returns merged inquiryEmail');

    const freshRead = companyDb.getCompanyInfo();
    assert(freshRead.secondaryMobile === probeSecondaryMobile, 'SQLite read retains saved secondaryMobile inside verification savepoint');
    assert(freshRead.inquiryEmail === probeEmail, 'SQLite read retains saved inquiryEmail inside verification savepoint');
  } finally {
    db.exec('ROLLBACK TO phase72_company_verification;');
    db.exec('RELEASE phase72_company_verification;');
  }

  // ----------------------------------------------------
  // 7. NON-ECOMMERCE INTEGRITY
  // ----------------------------------------------------
  console.log('\n--- 7. Non-Ecommerce Rule Verification ---');
  const sampleProduct = db.prepare('SELECT * FROM products LIMIT 1;').get() as any;
  assert(sampleProduct.price === undefined, 'No pricing column exists on products table');
  assert(sampleProduct.cart === undefined, 'No cart column exists on products table');

  console.log('\n=====================================================');
  console.log(`PHASE 7.2 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase72Verification().catch((err) => {
  console.error('Phase 7.2 verification threw unexpected error:', err);
  process.exit(1);
});
