import { BearingProduct, BearingCategory } from '../types';

/**
 * POLAD CHARKHESH — CORE BEARING CALCULATION ENGINE
 * Standards Compliance:
 *  - ISO 281:2007 (Dynamic Load Ratings & Basic Life L10/L10h)
 *  - ISO 76:2006 (Static Load Ratings & Static Safety Factor s0)
 *  - ISO 5753-1:2009 (Radial Internal Clearance)
 */

export interface DynamicLoadFactors {
  X: number;
  Y: number;
  X0: number;
  Y0: number;
  e: number;
  P: number; // Dynamic equivalent load (kN)
  P0: number; // Static equivalent load (kN)
  isProductSpecific: boolean;
  isWarning: boolean;
  warningFa: string;
  warningEn: string;
  calculationNoteFa: string;
  calculationNoteEn: string;
  sourceLabelFa: string;
  sourceLabelEn: string;
}

export interface BearingLifeInput {
  bearing?: BearingProduct | null;
  category: BearingCategory;
  crKn: number; // Dynamic load rating (kN)
  corKn: number; // Static load rating (kN)
  frKn: number; // Radial load (kN)
  faKn: number; // Axial load (kN)
  rpm: number; // Rotational speed (RPM)
  reliabilityLevel?: 90 | 95 | 98 | 99; // Percentage
  // Optional override factors for custom mode
  customFactors?: {
    e?: number;
    Y?: number;
    Y0?: number;
    Y1?: number;
    Y2?: number;
  };
}

export interface BearingLifeOutput {
  loadFactors: DynamicLoadFactors;
  pExponent: number;
  loadRatio: number; // Cr / P
  L10RevolutionsMillions: number; // 10^6 revs
  L10Hours: number; // Operating hours
  reliabilityLevel: number;
  a1Factor: number;
  LnaRevolutionsMillions: number;
  LnaHours: number;
  s0: number; // Static safety factor
  pMinKn: number; // Minimum recommended load to prevent skidding (kN)
  isUnderloaded: boolean;
  isOverloaded: boolean;
  isValid: boolean;
  errorMessageFa?: string;
  errorMessageEn?: string;
}

/**
 * ISO 281:2007 Table 1 — Deep Groove Ball Bearings
 * Exact Fa / C0r factor interpolation for e and Y (X = 0.56 when Fa/Fr > e)
 */
export const ISO_281_BALL_FACTORS: ReadonlyArray<{ ratio: number; e: number; Y: number }> = [
  { ratio: 0.014, e: 0.19, Y: 2.30 },
  { ratio: 0.028, e: 0.22, Y: 1.99 },
  { ratio: 0.056, e: 0.26, Y: 1.71 },
  { ratio: 0.084, e: 0.28, Y: 1.55 },
  { ratio: 0.110, e: 0.30, Y: 1.45 },
  { ratio: 0.170, e: 0.34, Y: 1.31 },
  { ratio: 0.280, e: 0.38, Y: 1.15 },
  { ratio: 0.420, e: 0.42, Y: 1.04 },
  { ratio: 0.560, e: 0.44, Y: 1.00 },
];

/**
 * Piecewise linear interpolation for Deep Groove Ball Bearing factors e and Y
 */
export function interpolateBallFactors(faCorRatio: number): { e: number; Y: number } {
  if (faCorRatio <= ISO_281_BALL_FACTORS[0].ratio) {
    return { e: ISO_281_BALL_FACTORS[0].e, Y: ISO_281_BALL_FACTORS[0].Y };
  }
  const lastIndex = ISO_281_BALL_FACTORS.length - 1;
  if (faCorRatio >= ISO_281_BALL_FACTORS[lastIndex].ratio) {
    return { e: ISO_281_BALL_FACTORS[lastIndex].e, Y: ISO_281_BALL_FACTORS[lastIndex].Y };
  }
  for (let i = 0; i < lastIndex; i++) {
    const lower = ISO_281_BALL_FACTORS[i];
    const upper = ISO_281_BALL_FACTORS[i + 1];
    if (faCorRatio >= lower.ratio && faCorRatio <= upper.ratio) {
      const frac = (faCorRatio - lower.ratio) / (upper.ratio - lower.ratio);
      const e = lower.e + frac * (upper.e - lower.e);
      const Y = lower.Y + frac * (upper.Y - lower.Y);
      return { 
        e: Math.round(e * 1000) / 1000, 
        Y: Math.round(Y * 1000) / 1000 
      };
    }
  }
  return { e: 0.25, Y: 1.7 };
}

/**
 * ISO 281:2007 Table 2 — Reliability Factor a1
 */
export function getReliabilityFactorA1(level: 90 | 95 | 98 | 99): number {
  switch (level) {
    case 95: return 0.64;
    case 98: return 0.37;
    case 99: return 0.25;
    case 90:
    default: return 1.00;
  }
}

/**
 * Calculate ISO 281 Equivalent Dynamic Radial Load P and ISO 76 Static Equivalent Load P0
 */
export function calculateEquivalentLoads(
  category: BearingCategory,
  corKn: number,
  frKn: number,
  faKn: number,
  bearing?: BearingProduct | null,
  customFactors?: { e?: number; Y?: number; Y0?: number; Y1?: number; Y2?: number }
): DynamicLoadFactors {
  const Fr = Math.max(0, isFinite(frKn) ? frKn : 0);
  const Fa = Math.max(0, isFinite(faKn) ? faKn : 0);
  const Cor = Math.max(0.01, isFinite(corKn) ? corKn : 0.01);

  // If zero load is applied
  if (Fr <= 0 && Fa <= 0) {
    return {
      X: 1,
      Y: 0,
      X0: 1,
      Y0: 0,
      e: 0,
      P: 0,
      P0: 0,
      isProductSpecific: false,
      isWarning: false,
      warningFa: '',
      warningEn: '',
      calculationNoteFa: 'لطفاً بارهای اعمالی شعاعی (Fr) یا محوری (Fa) را وارد نمایید.',
      calculationNoteEn: 'Please enter radial (Fr) or axial (Fa) operational loads.',
      sourceLabelFa: 'محاسبه ISO 281',
      sourceLabelEn: 'ISO 281 Calculation',
    };
  }

  let X = 1.0;
  let Y = 0.0;
  let X0 = 1.0;
  let Y0 = 0.0;
  let eFactor = 0.25;
  let isProductSpecific = false;
  let isWarning = false;
  let warningFa = '';
  let warningEn = '';
  let calculationNoteFa = '';
  let calculationNoteEn = '';
  let sourceLabelFa = 'محاسبه استاندارد ISO 281:2007';
  let sourceLabelEn = 'ISO 281:2007 Standard Calculation';

  if (category === 'ball') {
    // 1. DEEP GROOVE BALL BEARINGS (ISO 281:2007 Table 1 & ISO 76 Table 1)
    X0 = 0.6;
    Y0 = 0.5;
    if (Fa <= 0.00001) {
      X = 1.0;
      Y = 0.0;
      eFactor = 0.19;
      calculationNoteFa = 'بار شعاعی خالص (Fa = 0): بار دینامیکی معادل P = Fr (ضریب X=1, Y=0).';
      calculationNoteEn = 'Pure radial load (Fa = 0): Equivalent dynamic load P = Fr (X=1, Y=0).';
    } else {
      const faCorRatio = Fa / Cor;
      const { e, Y: interpolatedY } = interpolateBallFactors(faCorRatio);
      eFactor = e;

      const faFrRatio = Fr > 0 ? Fa / Fr : 99999;
      if (faFrRatio <= eFactor) {
        X = 1.0;
        Y = 0.0;
        calculationNoteFa = `نسبت بار محوری به شعاعی (${faFrRatio.toFixed(3)}) ≤ حد مجاز e (${eFactor.toFixed(3)}): بار معادل P = Fr (تأثیر محوری در محدوده لقی جذب می‌شود).`;
        calculationNoteEn = `Axial-to-radial ratio (${faFrRatio.toFixed(3)}) ≤ limit e (${eFactor.toFixed(3)}): P = Fr (axial force accommodated within internal clearance).`;
      } else {
        X = 0.56;
        Y = interpolatedY;
        calculationNoteFa = `نسبت بار محوری به شعاعی (${faFrRatio.toFixed(3)}) > حد e (${eFactor.toFixed(3)}): بر اساس جدول ۱ استاندارد ISO 281 مقدار P = 0.56·Fr + ${Y.toFixed(2)}·Fa می‌باشد.`;
        calculationNoteEn = `Axial-to-radial ratio (${faFrRatio.toFixed(3)}) > limit e (${eFactor.toFixed(3)}): In accordance with ISO 281 Table 1, P = 0.56·Fr + ${Y.toFixed(2)}·Fa.`;
      }
    }
  } else if (category === 'roller') {
    // 2. TAPERED ROLLER BEARINGS (Single Row — ISO 281:2007 Table 4, ISO 355 & Manufacturer Catalogs)
    // Pull product-specific factors if available; otherwise use custom/standard factors with clear notice.
    const productE = bearing?.calculationFactorE ?? customFactors?.e;
    const productY = bearing?.calculationFactorY ?? customFactors?.Y;
    const productY0 = bearing?.calculationFactorY0 ?? customFactors?.Y0;

    if (productE !== undefined && productY !== undefined) {
      eFactor = productE;
      Y = productY;
      Y0 = productY0 ?? 0.90;
      isProductSpecific = true;
      sourceLabelFa = 'ضرایب کاتالوگ رسمی سازنده (Product-Specific Data)';
      sourceLabelEn = 'Manufacturer Specific Catalog Factors';
    } else {
      // Default standard metric series (ISO 355 series 302/303 indicative average)
      eFactor = 0.37;
      Y = 1.60;
      Y0 = 0.90;
      isProductSpecific = false;
      sourceLabelFa = 'برآورد مقدماتی ضرایب مخروطی (ISO 355 Generic)';
      sourceLabelEn = 'ISO 355 Generic Preliminary Estimate';
    }

    X0 = 0.5;

    const faFrRatio = Fr > 0 ? Fa / Fr : 99999;
    if (faFrRatio <= eFactor) {
      X = 1.0;
      Y = 0.0;
      calculationNoteFa = `رولبرینگ مخروطی یک‌ردیفه: Fa/Fr (${faFrRatio.toFixed(3)}) ≤ e (${eFactor.toFixed(2)}) ⇐ P = Fr. توجه: برای چیدمان جفتی، نیروی محوری القایی داخلی (Fa_ind = 0.5·Fr/Y) باید منظور گردد.`;
      calculationNoteEn = `Single-row tapered roller: Fa/Fr (${faFrRatio.toFixed(3)}) ≤ e (${eFactor.toFixed(2)}) ⇐ P = Fr. Note: For paired bearings, internal induced thrust (0.5·Fr/Y) must be resolved.`;
    } else {
      X = 0.4;
      // Keep product-specific Y
      calculationNoteFa = `رولبرینگ مخروطی یک‌ردیفه: Fa/Fr (${faFrRatio.toFixed(3)}) > e (${eFactor.toFixed(2)}) ⇐ بر اساس ISO 281 جدول ۴ مقدار P = 0.4·Fr + ${Y.toFixed(2)}·Fa می‌باشد.`;
      calculationNoteEn = `Single-row tapered roller: Fa/Fr (${faFrRatio.toFixed(3)}) > e (${eFactor.toFixed(2)}) ⇐ per ISO 281 Table 4, P = 0.4·Fr + ${Y.toFixed(2)}·Fa.`;
    }
  } else if (category === 'spherical') {
    // 3. SPHERICAL ROLLER BEARINGS (Double Row — ISO 281:2007 Table 5 & Manufacturer Data)
    const productE = bearing?.calculationFactorE ?? customFactors?.e;
    const productY1 = bearing?.calculationFactorY1 ?? customFactors?.Y1;
    const productY2 = bearing?.calculationFactorY2 ?? customFactors?.Y2;
    const productY0 = bearing?.calculationFactorY0 ?? customFactors?.Y0;

    if (productE !== undefined && productY1 !== undefined && productY2 !== undefined) {
      eFactor = productE;
      X0 = 1.0;
      Y0 = productY0 ?? productY1;
      isProductSpecific = true;
      sourceLabelFa = 'ضرایب کاتالوگ رسمی سازنده (Product-Specific Data)';
      sourceLabelEn = 'Manufacturer Specific Catalog Factors';
      
      const faFrRatio = Fr > 0 ? Fa / Fr : 99999;
      if (faFrRatio <= eFactor) {
        X = 1.0;
        Y = productY1;
        calculationNoteFa = `رولبرینگ بشکه‌ای دو ردیفه: Fa/Fr (${faFrRatio.toFixed(3)}) ≤ e (${eFactor.toFixed(2)}) ⇐ P = Fr + ${Y.toFixed(2)}·Fa (جدول ۵ استاندارد ISO 281).`;
        calculationNoteEn = `Double row spherical roller: Fa/Fr (${faFrRatio.toFixed(3)}) ≤ e (${eFactor.toFixed(2)}) ⇐ P = Fr + ${Y.toFixed(2)}·Fa (ISO 281 Table 5).`;
      } else {
        X = 0.67;
        Y = productY2;
        calculationNoteFa = `رولبرینگ بشکه‌ای دو ردیفه: Fa/Fr (${faFrRatio.toFixed(3)}) > e (${eFactor.toFixed(2)}) ⇐ P = 0.67·Fr + ${Y.toFixed(2)}·Fa (جدول ۵ استاندارد ISO 281).`;
        calculationNoteEn = `Double row spherical roller: Fa/Fr (${faFrRatio.toFixed(3)}) > e (${eFactor.toFixed(2)}) ⇐ P = 0.67·Fr + ${Y.toFixed(2)}·Fa (ISO 281 Table 5).`;
      }
    } else {
      // Fallback series 222 standard baseline
      eFactor = 0.24;
      const Y1 = 2.8;
      const Y2 = 4.2;
      X0 = 1.0;
      Y0 = 2.8;
      isProductSpecific = false;
      sourceLabelFa = 'برآورد استاندارد سری 222 (ISO 281 Table 5)';
      sourceLabelEn = 'Standard Series 222 Estimate (ISO 281 Table 5)';

      const faFrRatio = Fr > 0 ? Fa / Fr : 99999;
      if (faFrRatio <= eFactor) {
        X = 1.0;
        Y = Y1;
        calculationNoteFa = `رولبرینگ بشکه‌ای با بار محوری سبک: P = Fr + 2.8·Fa (چون Fa/Fr ≤ ${eFactor}).`;
        calculationNoteEn = `Double row spherical roller with light thrust: P = Fr + 2.8·Fa (Fa/Fr ≤ ${eFactor}).`;
      } else {
        X = 0.67;
        Y = Y2;
        calculationNoteFa = `رولبرینگ بشکه‌ای با بار محوری سنگین: P = 0.67·Fr + 4.2·Fa (چون Fa/Fr > ${eFactor}).`;
        calculationNoteEn = `Double row spherical roller with heavy thrust: P = 0.67·Fr + 4.2·Fa (Fa/Fr > ${eFactor}).`;
      }
    }
  } else if (category === 'cylindrical') {
    // 4. CYLINDRICAL ROLLER BEARINGS (Non-locating NU, N — ISO 281:2007 Table 2 & ISO 76 Table 2)
    X = 1.0;
    Y = 0.0;
    X0 = 1.0;
    Y0 = 0.0;
    eFactor = 0.0;

    if (Fa > 0.001) {
      isWarning = true;
      warningFa = 'هشدار مهندسی: رولبرینگ‌های استوانه‌ای تیپ متداول (NU و N) فاقد لبه مهار محوری بوده و نباید تحت بار محوری مداوم (Fa) قرار گیرند. در صورت وجود بار محوری، از تیپ‌های لبه‌دار (NJ با حلقه زاویه‌گیر HJ یا NUP) استفاده فرمایید.';
      warningEn = 'Engineering Notice: Non-locating cylindrical roller bearings (NU, N) do not support continuous axial thrust. For axial locating duty, select flanged configurations (NJ+HJ, NUP).';
      calculationNoteFa = 'رولبرینگ استوانه‌ای: بار دینامیکی معادل P = Fr (بار محوری در تیپ‌های بدون لبه پشتیبانی نمی‌شود).';
      calculationNoteEn = 'Cylindrical roller: P = Fr (axial load not supported on standard NU/N rings).';
    } else {
      calculationNoteFa = 'رولبرینگ استوانه‌ای تحت بار شعاعی خالص: P = Fr (ضریب X=1, Y=0 مطابق با ISO 281).';
      calculationNoteEn = 'Cylindrical roller under pure radial load: P = Fr (X=1, Y=0 per ISO 281).';
    }
  } else if (category === 'thrust') {
    // 5. THRUST BALL BEARINGS (Single Direction, 90° Contact Angle — ISO 281:2007 Table 6 & ISO 76 Table 5)
    X = 0.0;
    Y = 1.0;
    X0 = 0.0;
    Y0 = 1.0;
    eFactor = 0.0;

    if (Fr > 0.001) {
      isWarning = true;
      warningFa = 'خطای بارگذاری: بیرینگ‌های کف‌گرد مسطح زاویه تماس ۹۰ درجه دارند و به هیچ عنوان قادر به تحمل بارهای شعاعی (Fr) نیستند. بار شعاعی باید صفر باشد.';
      warningEn = 'Load Condition Error: Flat thrust bearings have a 90° contact angle and must never be subjected to radial loads (Fr = 0 required).';
      calculationNoteFa = 'بیرینگ کف‌گرد: P = Fa (بار شعاعی باید صفر باشد).';
      calculationNoteEn = 'Thrust bearing: P = Fa (pure axial loading only).';
    } else {
      calculationNoteFa = 'بیرینگ کف‌گرد تحت بار محوری خالص: P = Fa (مطابق با ISO 281).';
      calculationNoteEn = 'Thrust bearing under pure axial load: P = Fa (per ISO 281).';
    }
  } else {
    // Other housings / default radial
    X = 1.0;
    Y = 0.0;
    X0 = 1.0;
    Y0 = 0.0;
    eFactor = 0.25;
    calculationNoteFa = 'محاسبه بار معادل دینامیکی بر اساس استاندارد ISO 281: P = Fr.';
    calculationNoteEn = 'Equivalent dynamic load per ISO 281: P = Fr.';
  }

  // Calculate dynamic equivalent load P
  const rawP = (X * Fr) + (Y * Fa);
  const P = Math.max(0.0001, isFinite(rawP) ? rawP : 0.0001);

  // Calculate static equivalent load P0 (ISO 76:2006)
  let rawP0 = 0;
  if (category === 'ball') {
    rawP0 = Math.max(Fr, (X0 * Fr) + (Y0 * Fa));
  } else if (category === 'roller') {
    rawP0 = Math.max(Fr, (X0 * Fr) + (Y0 * Fa));
  } else if (category === 'spherical') {
    rawP0 = (X0 * Fr) + (Y0 * Fa);
  } else if (category === 'cylindrical') {
    rawP0 = Fr;
  } else if (category === 'thrust') {
    rawP0 = Fa;
  } else {
    rawP0 = Math.max(Fr, (X0 * Fr) + (Y0 * Fa));
  }
  const P0 = Math.max(0.0001, isFinite(rawP0) ? rawP0 : 0.0001);

  return {
    X,
    Y,
    X0,
    Y0,
    e: eFactor,
    P: Math.round(P * 1000) / 1000,
    P0: Math.round(P0 * 1000) / 1000,
    isProductSpecific,
    isWarning,
    warningFa,
    warningEn,
    calculationNoteFa,
    calculationNoteEn,
    sourceLabelFa,
    sourceLabelEn,
  };
}

/**
 * Calculate ISO 281:2007 Basic Rating Life (L10, L10h) & ISO 76:2006 Static Safety Factor (s0)
 */
export function calculateBearingLife(input: BearingLifeInput): BearingLifeOutput {
  const {
    bearing,
    category,
    crKn,
    corKn,
    frKn,
    faKn,
    rpm,
    reliabilityLevel = 90,
    customFactors,
  } = input;

  const Cr = Math.max(0, isFinite(crKn) ? crKn : 0);
  const Cor = Math.max(0.01, isFinite(corKn) ? corKn : 0.01);
  const n = Math.max(0, isFinite(rpm) ? rpm : 0);
  const Fr = Math.max(0, isFinite(frKn) ? frKn : 0);
  const Fa = Math.max(0, isFinite(faKn) ? faKn : 0);

  // ISO 281 Contact Kinematics Life Exponent:
  // p = 3 for ball bearings (point contact)
  // p = 10/3 (~3.3333333333333335) for roller bearings (line contact: cylindrical, tapered, spherical)
  const isRoller = category === 'roller' || category === 'spherical' || category === 'cylindrical';
  const pExponent = isRoller ? (10 / 3) : 3;

  const loadFactors = calculateEquivalentLoads(category, Cor, Fr, Fa, bearing, customFactors);
  const a1Factor = getReliabilityFactorA1(reliabilityLevel);

  // Edge cases: No load or zero Cr
  if (Fr <= 0 && Fa <= 0) {
    return {
      loadFactors,
      pExponent,
      loadRatio: 0,
      L10RevolutionsMillions: 0,
      L10Hours: 0,
      reliabilityLevel,
      a1Factor,
      LnaRevolutionsMillions: 0,
      LnaHours: 0,
      s0: 0,
      pMinKn: 0,
      isUnderloaded: false,
      isOverloaded: false,
      isValid: false,
      errorMessageFa: 'لطفاً بارهای اعمالی را وارد نمایید.',
      errorMessageEn: 'Please enter operational loads.',
    };
  }

  if (Cr <= 0) {
    return {
      loadFactors,
      pExponent,
      loadRatio: 0,
      L10RevolutionsMillions: 0,
      L10Hours: 0,
      reliabilityLevel,
      a1Factor,
      LnaRevolutionsMillions: 0,
      LnaHours: 0,
      s0: 0,
      pMinKn: 0,
      isUnderloaded: false,
      isOverloaded: false,
      isValid: false,
      errorMessageFa: 'ظرفیت بار دینامیکی (Cr) نامعتبر است.',
      errorMessageEn: 'Dynamic load rating (Cr) must be greater than zero.',
    };
  }

  const P = loadFactors.P;
  const P0 = loadFactors.P0;

  // L10 = (Cr / P)^p in million revolutions (ISO 281:2007 Eq. 1)
  const loadRatio = Cr / P;
  const rawL10Rev = Math.pow(loadRatio, pExponent);
  const L10RevolutionsMillions = isFinite(rawL10Rev) ? rawL10Rev : 0;

  // L10h = (10^6 / (60 * n)) * L10 in hours (ISO 281:2007 Eq. 2)
  const L10Hours = n > 0 ? (1_000_000 / (60 * n)) * L10RevolutionsMillions : 0;

  // Reliability-adjusted life Lna = a1 * L10 (ISO 281:2007 Table 2)
  const LnaRevolutionsMillions = a1Factor * L10RevolutionsMillions;
  const LnaHours = a1Factor * L10Hours;

  // Static safety factor s0 = Cor / P0 (ISO 76:2006)
  const s0 = P0 > 0 ? Cor / P0 : 0;

  // Minimum required load to prevent roller skidding (P_min ≈ 0.01 to 0.02 * Cr)
  const pMinKn = Math.round((isRoller ? 0.02 * Cr : 0.01 * Cr) * 100) / 100;
  const isUnderloaded = P < pMinKn;
  const isOverloaded = P > 0.5 * Cr || s0 < 1.0;

  return {
    loadFactors,
    pExponent,
    loadRatio: Math.round(loadRatio * 1000) / 1000,
    L10RevolutionsMillions: Math.round(L10RevolutionsMillions * 100) / 100,
    L10Hours: Math.round(L10Hours),
    reliabilityLevel,
    a1Factor,
    LnaRevolutionsMillions: Math.round(LnaRevolutionsMillions * 100) / 100,
    LnaHours: Math.round(LnaHours),
    s0: Math.round(s0 * 100) / 100,
    pMinKn,
    isUnderloaded,
    isOverloaded,
    isValid: true,
  };
}

/**
 * AUTOMATED BENCHMARK SUITE & INTEGRITY TEST RUNNER
 * Directly executes calculations for all canonical bearing families and verifies tolerances.
 */
export interface BenchmarkTestCase {
  id: string;
  name: string;
  category: BearingCategory;
  crKn: number;
  corKn: number;
  frKn: number;
  faKn: number;
  rpm: number;
  factors?: { e?: number; Y?: number; Y0?: number; Y1?: number; Y2?: number };
  expected: {
    pExponent: number;
    P: number;
    P0: number;
    L10Hours: number;
    s0: number;
  };
}

export const CANONICAL_BENCHMARK_CASES: ReadonlyArray<BenchmarkTestCase> = [
  {
    id: 'case-6204-2rs',
    name: 'Deep Groove Ball Bearing 6204-2RS',
    category: 'ball',
    crKn: 13.5,
    corKn: 6.55,
    frKn: 2.5,
    faKn: 0.5,
    rpm: 1450,
    expected: {
      pExponent: 3,
      P: 2.50, // Fa/Fr = 0.20 <= e (0.274) ==> P = Fr
      P0: 2.50, // P0 = max(2.5, 0.6*2.5 + 0.5*0.5 = 1.75) = 2.50
      L10Hours: 18099, // (13.5/2.5)^3 * (1e6 / (60*1450)) = 157.464 * 11.494 = 18099.31 hrs
      s0: 2.62, // 6.55 / 2.5 = 2.62
    },
  },
  {
    id: 'case-30206',
    name: 'Single-Row Tapered Roller Bearing 30206',
    category: 'roller',
    crKn: 43.0,
    corKn: 45.0,
    frKn: 8.0,
    faKn: 3.5,
    rpm: 1000,
    factors: { e: 0.37, Y: 1.60, Y0: 0.90 },
    expected: {
      pExponent: 10 / 3,
      P: 8.80, // Fa/Fr = 0.4375 > e (0.37) ==> P = 0.4*8.0 + 1.60*3.5 = 3.2 + 5.6 = 8.80 kN
      P0: 8.00, // P0 = max(8.0, 0.5*8.0 + 0.9*3.5 = 7.15) = 8.00 kN
      L10Hours: 3345, // (43/8.8)^(10/3) * (1e6 / (60*1000)) = 200.72 * 16.6667 = 3345.3 hrs
      s0: 5.62, // 45.0 / 8.0 = 5.625
    },
  },
  {
    id: 'case-22212-ek',
    name: 'Spherical Roller Bearing 22212 EK',
    category: 'spherical',
    crKn: 159.0,
    corKn: 166.0,
    frKn: 25.0,
    faKn: 5.0,
    rpm: 750,
    factors: { e: 0.24, Y1: 2.8, Y2: 4.2, Y0: 2.8 },
    expected: {
      pExponent: 10 / 3,
      P: 39.00, // Fa/Fr = 0.20 <= e (0.24) ==> P = Fr + 2.8*Fa = 25.0 + 14.0 = 39.00 kN
      P0: 39.00, // P0 = Fr + 2.8*Fa = 25.0 + 14.0 = 39.00 kN
      L10Hours: 2395, // (159/39)^(10/3) * (1e6 / (60*750)) = 107.78 * 22.222 = 2395.1 hrs
      s0: 4.26, // 166.0 / 39.0 = 4.2564 => 4.26
    },
  },
  {
    id: 'case-nu-208-ecp',
    name: 'Cylindrical Roller Bearing NU 208 ECP',
    category: 'cylindrical',
    crKn: 56.0,
    corKn: 50.0,
    frKn: 10.0,
    faKn: 0.0,
    rpm: 1500,
    expected: {
      pExponent: 10 / 3,
      P: 10.00, // Pure radial ==> P = Fr = 10.0 kN
      P0: 10.00, // P0 = Fr = 10.0 kN
      L10Hours: 3471, // (56/10)^(10/3) * (1e6 / (60*1500)) = 312.42 * 11.111 = 3471.3 hrs
      s0: 5.00, // 50.0 / 10.0 = 5.00
    },
  },
  {
    id: 'case-51106',
    name: 'Thrust Ball Bearing 51106',
    category: 'thrust',
    crKn: 20.3,
    corKn: 37.5,
    frKn: 0.0,
    faKn: 3.0,
    rpm: 1000,
    expected: {
      pExponent: 3,
      P: 3.00, // Pure thrust ==> P = Fa = 3.0 kN
      P0: 3.00, // P0 = Fa = 3.0 kN
      L10Hours: 5163, // (20.3/3.0)^3 * (1e6 / (60*1000)) = 309.80 * 16.6667 = 5163.3 hrs
      s0: 12.50, // 37.5 / 3.0 = 12.50
    },
  },
];

export interface BenchmarkTestResult {
  id: string;
  name: string;
  passed: boolean;
  actualP: number;
  expectedP: number;
  actualP0: number;
  expectedP0: number;
  actualL10h: number;
  expectedL10h: number;
  actualS0: number;
  expectedS0: number;
  relativeErrorL10hPercent: number;
}

/**
 * Execute automated verification tests and return detailed results
 */
export function runBearingCalculationBenchmarks(): {
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  results: BenchmarkTestResult[];
} {
  const results: BenchmarkTestResult[] = CANONICAL_BENCHMARK_CASES.map(testCase => {
    const output = calculateBearingLife({
      category: testCase.category,
      crKn: testCase.crKn,
      corKn: testCase.corKn,
      frKn: testCase.frKn,
      faKn: testCase.faKn,
      rpm: testCase.rpm,
      customFactors: testCase.factors,
    });

    const pMatch = Math.abs(output.loadFactors.P - testCase.expected.P) < 0.05;
    const p0Match = Math.abs(output.loadFactors.P0 - testCase.expected.P0) < 0.05;
    const l10hDiff = Math.abs(output.L10Hours - testCase.expected.L10Hours);
    const relErrorPercent = testCase.expected.L10Hours > 0 
      ? (l10hDiff / testCase.expected.L10Hours) * 100 
      : 0;
    const l10hMatch = relErrorPercent < 0.5; // less than 0.5% difference
    const s0Match = Math.abs(output.s0 - testCase.expected.s0) < 0.05;

    const passed = pMatch && p0Match && l10hMatch && s0Match && output.isValid;

    return {
      id: testCase.id,
      name: testCase.name,
      passed,
      actualP: output.loadFactors.P,
      expectedP: testCase.expected.P,
      actualP0: output.loadFactors.P0,
      expectedP0: testCase.expected.P0,
      actualL10h: output.L10Hours,
      expectedL10h: testCase.expected.L10Hours,
      actualS0: output.s0,
      expectedS0: testCase.expected.s0,
      relativeErrorL10hPercent: Math.round(relErrorPercent * 100) / 100,
    };
  });

  const passedTests = results.filter(r => r.passed).length;
  const allPassed = passedTests === results.length;

  return {
    allPassed,
    totalTests: results.length,
    passedTests,
    results,
  };
}
