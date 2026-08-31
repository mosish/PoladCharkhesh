import React, { useState, useMemo } from 'react';
import { 
  Hourglass, 
  Activity, 
  RotateCw, 
  AlertTriangle, 
  Info, 
  Sliders, 
  Zap, 
  ShieldCheck, 
  BarChart3,
  Gauge,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Language, BearingProduct, BearingCategory } from '../types';
import { bearingProducts } from '../data/products';

interface BearingLifeCalculatorProps {
  language: Language;
  embedded?: boolean;
}

export const BearingLifeCalculator: React.FC<BearingLifeCalculatorProps> = ({ 
  language, 
  embedded = false 
}) => {
  // Filter rolling bearings for life calculation (exclude seals and lubricants)
  const availableBearings = useMemo(() => {
    return bearingProducts.filter(
      p => p.category !== 'seal' && p.category !== 'lubricant' && p.crKn > 0
    );
  }, []);

  // Selection Mode: 'catalog' | 'custom'
  const [selectionMode, setSelectionMode] = useState<'catalog' | 'custom'>('catalog');
  const [selectedBearingId, setSelectedBearingId] = useState<string>(
    availableBearings[0]?.id || 'pc-6204-2rs'
  );

  const selectedCatalogBearing = useMemo(() => {
    return availableBearings.find(b => b.id === selectedBearingId) || availableBearings[0];
  }, [availableBearings, selectedBearingId]);

  // Custom Input States (used if selectionMode === 'custom')
  const [customType, setCustomType] = useState<'ball' | 'roller' | 'spherical' | 'cylindrical' | 'thrust'>('ball');
  const [customCr, setCustomCr] = useState<number>(13.5);
  const [customCor, setCustomCor] = useState<number>(6.55);
  const [customSpeedLimit, setCustomSpeedLimit] = useState<number>(12000);

  // Operational Conditions
  const [radialLoadFr, setRadialLoadFr] = useState<number>(2.5); // in kN
  const [axialLoadFa, setAxialLoadFa] = useState<number>(0.5); // in kN
  const [operatingRpm, setOperatingRpm] = useState<number>(1450); // in RPM
  const [loadUnit, setLoadUnit] = useState<'kN' | 'N'>('kN');

  // Reliability Factor a1 (ISO 281: 90% = 1.0, 95% = 0.62, 96% = 0.53, 97% = 0.44, 98% = 0.33, 99% = 0.21)
  const [reliabilityLevel, setReliabilityLevel] = useState<90 | 95 | 98 | 99>(90);

  // Active Bearing Parameters
  const activeBearingType = selectionMode === 'catalog' ? selectedCatalogBearing.category : customType;
  const activeCrKn = selectionMode === 'catalog' ? selectedCatalogBearing.crKn : Math.max(0.1, customCr);
  const activeCorKn = selectionMode === 'catalog' ? selectedCatalogBearing.corKn : Math.max(0.1, customCor);
  const activeSpeedLimit = selectionMode === 'catalog' ? selectedCatalogBearing.speedGreaseRpm : customSpeedLimit;

  // Normalise loads to kN
  const loadFrKn = loadUnit === 'N' ? radialLoadFr / 1000 : radialLoadFr;
  const loadFaKn = loadUnit === 'N' ? axialLoadFa / 1000 : axialLoadFa;

  // ISO 281 Life Exponent p
  // p = 3 for ball bearings, p = 10/3 (~3.333) for roller bearings
  const isRoller = activeBearingType === 'roller' || activeBearingType === 'spherical' || activeBearingType === 'cylindrical';
  const exponentP = isRoller ? 10 / 3 : 3;

  // Reliability Factor a1 according to ISO 281:2007
  const factorA1 = useMemo(() => {
    switch (reliabilityLevel) {
      case 95: return 0.62;
      case 98: return 0.33;
      case 99: return 0.21;
      case 90:
      default: return 1.0;
    }
  }, [reliabilityLevel]);

  // ISO 281 Equivalent Dynamic Radial Load (P) Calculation
  const equivalentLoadCalculation = useMemo(() => {
    const Fr = Math.max(0, loadFrKn);
    const Fa = Math.max(0, loadFaKn);

    let X = 1.0;
    let Y = 0.0;
    let eFactor = 0.25;
    let calculationNoteFa = '';
    let calculationNoteEn = '';
    let isWarning = false;

    if (activeBearingType === 'ball') {
      // Deep groove ball bearing logic
      if (Fa <= 0.001) {
        X = 1.0;
        Y = 0.0;
        calculationNoteFa = 'بار شعاعی خالص (Fa = 0): بار معادل برابر با بار شعاعی است (P = Fr).';
        calculationNoteEn = 'Pure radial load (Fa = 0): Equivalent load equals radial load (P = Fr).';
      } else {
        // Fa / Cor ratio interpolation for contact factor e and Y
        const faCorRatio = Fa / Math.max(0.1, activeCorKn);
        if (faCorRatio <= 0.014) { eFactor = 0.19; Y = 2.30; }
        else if (faCorRatio <= 0.028) { eFactor = 0.22; Y = 1.99; }
        else if (faCorRatio <= 0.056) { eFactor = 0.26; Y = 1.71; }
        else if (faCorRatio <= 0.084) { eFactor = 0.28; Y = 1.55; }
        else if (faCorRatio <= 0.110) { eFactor = 0.30; Y = 1.45; }
        else if (faCorRatio <= 0.170) { eFactor = 0.34; Y = 1.31; }
        else if (faCorRatio <= 0.280) { eFactor = 0.38; Y = 1.15; }
        else { eFactor = 0.44; Y = 1.00; }

        const faFrRatio = Fr > 0 ? Fa / Fr : 999;
        if (faFrRatio <= eFactor) {
          X = 1.0;
          Y = 0.0;
          calculationNoteFa = `نسبت بار محوری به شعاعی (${faFrRatio.toFixed(2)}) ≤ حد مجاز e (${eFactor.toFixed(2)}): بار معادل P = Fr.`;
          calculationNoteEn = `Axial-to-radial ratio (${faFrRatio.toFixed(2)}) ≤ factor e (${eFactor.toFixed(2)}): P = Fr.`;
        } else {
          X = 0.56;
          calculationNoteFa = `نسبت بار محوری به شعاعی (${faFrRatio.toFixed(2)}) > حد e (${eFactor.toFixed(2)}): بار معادل P = 0.56·Fr + ${Y.toFixed(2)}·Fa.`;
          calculationNoteEn = `Axial-to-radial ratio (${faFrRatio.toFixed(2)}) > factor e (${eFactor.toFixed(2)}): P = 0.56·Fr + ${Y.toFixed(2)}·Fa.`;
        }
      }
    } else if (activeBearingType === 'spherical') {
      // Spherical roller bearing logic (e ~ 0.24, Y1 ~ 2.8, Y2 ~ 4.2)
      eFactor = 0.24;
      const faFrRatio = Fr > 0 ? Fa / Fr : 999;
      if (faFrRatio <= eFactor) {
        X = 1.0;
        Y = 2.8;
        calculationNoteFa = `رولبرینگ بشکه‌ای با بار محوری سبک: P = Fr + 2.8·Fa (Fa/Fr ≤ ${eFactor}).`;
        calculationNoteEn = `Spherical roller with light axial load: P = Fr + 2.8·Fa (Fa/Fr ≤ ${eFactor}).`;
      } else {
        X = 0.67;
        Y = 4.2;
        calculationNoteFa = `رولبرینگ بشکه‌ای با بار محوری سنگین: P = 0.67·Fr + 4.2·Fa (Fa/Fr > ${eFactor}).`;
        calculationNoteEn = `Spherical roller with heavy axial load: P = 0.67·Fr + 4.2·Fa (Fa/Fr > ${eFactor}).`;
      }
    } else if (activeBearingType === 'cylindrical') {
      // Standard cylindrical roller (NU, N) can take zero axial load
      X = 1.0;
      Y = 0.0;
      if (Fa > 0.05) {
        isWarning = true;
        calculationNoteFa = 'هشدار مهندسی: رولبرینگ‌های استوانه‌ای تیپ NU/N قادر به تحمل بار محوری مداوم نیستند. برای بار محوری از تیپ‌های NJ/NUP یا بلبرینگ کمکی استفاده شود.';
        calculationNoteEn = 'Engineering notice: Standard NU/N cylindrical roller bearings do not support continuous axial loads without thrust flanges (NJ/NUP).';
      } else {
        calculationNoteFa = 'رولبرینگ استوانه‌ای تحت بار شعاعی خالص: P = Fr.';
        calculationNoteEn = 'Cylindrical roller under pure radial load: P = Fr.';
      }
    } else if (activeBearingType === 'thrust') {
      // Pure thrust bearing
      X = 0.0;
      Y = 1.0;
      if (Fr > 0.05) {
        isWarning = true;
        calculationNoteFa = 'هشدار مهندسی: بیرینگ‌های کف‌گرد مسطح فقط برای بار محوری خالص (Fa) طراحی شده‌اند و بار شعاعی را تحمل نمی‌کنند.';
        calculationNoteEn = 'Engineering notice: Flat thrust bearings accommodate pure axial loads only and must not be subjected to radial forces.';
      } else {
        calculationNoteFa = 'بیرینگ کف‌گرد تحت بار محوری خالص: P = Fa.';
        calculationNoteEn = 'Thrust bearing under pure axial load: P = Fa.';
      }
    } else {
      // Tapered Roller
      eFactor = 0.35;
      const faFrRatio = Fr > 0 ? Fa / Fr : 999;
      if (faFrRatio <= eFactor) {
        X = 1.0;
        Y = 0.0;
        calculationNoteFa = `رولبرینگ مخروطی: P = Fr (Fa/Fr ≤ ${eFactor}).`;
        calculationNoteEn = `Tapered roller: P = Fr (Fa/Fr ≤ ${eFactor}).`;
      } else {
        X = 0.4;
        Y = 1.7;
        calculationNoteFa = `رولبرینگ مخروطی: P = 0.4·Fr + 1.7·Fa (Fa/Fr > ${eFactor}).`;
        calculationNoteEn = `Tapered roller: P = 0.4·Fr + 1.7·Fa (Fa/Fr > ${eFactor}).`;
      }
    }

    const calculatedP = (X * Fr) + (Y * Fa);
    const P = Math.max(0.01, calculatedP);

    // Static Equivalent Load P0 (ISO 76)
    const P0 = activeBearingType === 'ball' 
      ? Math.max(Fr, (0.6 * Fr) + (0.5 * Fa))
      : (activeBearingType === 'spherical' ? Fr + 2.0 * Fa : Fr);

    return {
      P: Math.round(P * 100) / 100,
      P0: Math.round(P0 * 100) / 100,
      X,
      Y,
      eFactor,
      calculationNoteFa,
      calculationNoteEn,
      isWarning,
    };
  }, [activeBearingType, activeCorKn, loadFaKn, loadFrKn]);

  // ISO 281 Life Calculations
  const lifeResults = useMemo(() => {
    const P = equivalentLoadCalculation.P;
    const Cr = activeCrKn;
    const Cor = activeCorKn;
    const n = Math.max(1, operatingRpm);

    // Basic rating life in million revolutions: L10 = (Cr / P)^p
    const loadRatio = Cr / P;
    const L10RevMillions = Math.pow(loadRatio, exponentP);
    
    // Adjusted million revolutions: Lnm = a1 * L10
    const LnaRevMillions = factorA1 * L10RevMillions;

    // Basic rating life in operating hours: L10h = (10^6 / (60 * n)) * L10
    const L10Hours = (1_000_000 / (60 * n)) * L10RevMillions;
    const LnaHours = factorA1 * L10Hours;

    // Static safety factor s0 = Cor / P0
    const s0 = Cor / Math.max(0.01, equivalentLoadCalculation.P0);

    // Minimum recommended load Pmin = 0.02 * Cr (to prevent roller skidding)
    const Pmin = 0.02 * Cr;
    const isUnderloaded = P < Pmin && n > (activeSpeedLimit * 0.4);

    // Heavy load / plastic deformation warning (P / Cor > 0.5)
    const isOverloaded = P > Cor * 0.5 || P > Cr;

    return {
      loadRatio: Math.round(loadRatio * 100) / 100,
      L10RevMillions: Math.round(L10RevMillions * 10) / 10,
      LnaRevMillions: Math.round(LnaRevMillions * 10) / 10,
      L10Hours: Math.round(L10Hours),
      LnaHours: Math.round(LnaHours),
      s0: Math.round(s0 * 100) / 100,
      Pmin: Math.round(Pmin * 100) / 100,
      isUnderloaded,
      isOverloaded,
    };
  }, [
    equivalentLoadCalculation.P,
    equivalentLoadCalculation.P0,
    activeCrKn,
    activeCorKn,
    operatingRpm,
    exponentP,
    factorA1,
    activeSpeedLimit
  ]);

  // Industry Target Lifespan Benchmark helper
  const getLifespanAssessment = (hours: number) => {
    if (hours < 8000) {
      return {
        badge: language === 'fa' ? 'عمر کاری محدود / بار بسیار سنگین' : 'Short Service Life / Heavy Duty',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        descFa: 'عمر کاری زیر ۸,۰۰۰ ساعت (کمتر از ۱ سال کار مداوم). برای کارکرد دائم صنعتی، انتخاب بیرینگ با Cr بزرگتر توصیه می‌شود.',
        descEn: 'Service life under 8,000h (less than 1 year continuous). Consider a larger bearing size for 24/7 industrial duty.',
      };
    }
    if (hours < 25000) {
      return {
        badge: language === 'fa' ? 'مناسب کارکرد صنعتی استاندارد' : 'Standard Industrial Service Life',
        color: 'text-sky-700 bg-sky-50 border-sky-200',
        descFa: 'عمر محاسبه‌شده بین ۸,۰۰۰ الی ۲۵,۰۰۰ ساعت (۱ تا ۳ سال کارکرد پیوسته). استاندارد مطلوب برای الکتروموتورهای عمومی و گیربکس‌ها.',
        descEn: 'Calculated life 8,000 to 25,000h (1-3 years continuous). Recommended range for general motors and gear drives.',
      };
    }
    if (hours < 60000) {
      return {
        badge: language === 'fa' ? 'عمر بسیار مطلوب / کارکرد سنگین مداوم' : 'Long-Life Heavy Continuous Duty',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        descFa: 'عمر محاسبه‌شده ۲۵,۰۰۰ الی ۶۰,۰۰۰ ساعت (۳ تا ۷ سال کارکرد بی‌وقفه). بسیار مطلوب برای پمپ‌های حساس و تجهیزات نیروگاهی و معدنی.',
        descEn: 'Calculated life 25,000 to 60,000h (3-7 years continuous). Optimal for power generation, mining, and critical process pumps.',
      };
    }
    return {
      badge: language === 'fa' ? 'عمر فوق‌العاده طولانی (Low Load / Conservative)' : 'Ultra High Fatigue Life',
      color: 'text-emerald-800 bg-emerald-100/80 border-emerald-300',
      descFa: 'عمر نامی فراتر از ۶۰,۰۰۰ ساعت (بیش از ۷ سال). بیرینگ در شرایط بار بسیار سبک و حاشیه امنیت خستگی بالا کار می‌کند.',
      descEn: 'Fatigue life exceeds 60,000h. Bearing operates with conservative stress and extensive fatigue safety margins.',
    };
  };

  const lifeAssessment = getLifespanAssessment(lifeResults.LnaHours);

  const content = (
    <div className="space-y-8 text-slate-800">
      {/* 1. SELECTION & BEARING SPECIFICATION HEADER */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#232c86] shrink-0 shadow-xs">
              <Hourglass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-100/80 text-blue-900 font-mono-spec text-[11px] font-bold">
                  ISO 281:2007 / DIN ISO 281
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                  {isRoller ? 'p = 10/3 (Roller)' : 'p = 3 (Ball)'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {language === 'fa' 
                  ? 'محاسبه‌گر طول عمر نامی بیرینگ بر اساس استاندارد ISO 281' 
                  : 'Bearing Basic Rating Life Calculator (ISO 281)'}
              </h3>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectionMode('catalog')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectionMode === 'catalog'
                  ? 'bg-[#232c86] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'fa' ? 'انتخاب از کاتالوگ پولاد چرخِش' : 'From Polad Catalog'}
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectionMode === 'custom'
                  ? 'bg-[#232c86] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'fa' ? 'ورود دستی پارامترها (Custom)' : 'Custom Parameters'}
            </button>
          </div>
        </div>

        {/* Catalog Selector or Manual Input Grid */}
        {selectionMode === 'catalog' ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {language === 'fa' ? 'انتخاب شماره فنی بیرینگ از کاتالوگ:' : 'Select Verified Bearing Code:'}
              </label>
              <select
                value={selectedBearingId}
                onChange={(e) => setSelectedBearingId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#232c86] cursor-pointer"
              >
                {availableBearings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {language === 'fa' ? b.nameFa : b.nameEn} ({b.d}×{b.D}×{b.B} mm | Cr={b.crKn}kN)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Spec Quick Bar */}
            <div className="md:col-span-6 grid grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center font-mono-spec">
              <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-500 block uppercase">Dynamic Cr</span>
                <span className="text-sm font-black text-[#232c86]">{selectedCatalogBearing.crKn} kN</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-500 block uppercase">Static C0r</span>
                <span className="text-sm font-black text-slate-800">{selectedCatalogBearing.corKn} kN</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-500 block uppercase">Speed Limit</span>
                <span className="text-sm font-black text-emerald-700">{selectedCatalogBearing.speedGreaseRpm} RPM</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'fa' ? 'نوع بیرینگ:' : 'Bearing Type:'}
              </label>
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="ball">{language === 'fa' ? 'بلبرینگ شیار عمیق (Ball)' : 'Deep Groove Ball'}</option>
                <option value="spherical">{language === 'fa' ? 'رولبرینگ بشکه‌ای (Spherical)' : 'Spherical Roller'}</option>
                <option value="cylindrical">{language === 'fa' ? 'رولبرینگ استوانه‌ای (Cylindrical)' : 'Cylindrical Roller'}</option>
                <option value="roller">{language === 'fa' ? 'رولبرینگ مخروطی (Tapered)' : 'Tapered Roller'}</option>
                <option value="thrust">{language === 'fa' ? 'بیرینگ کف‌گرد (Thrust)' : 'Thrust Bearing'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'fa' ? 'ظرفیت بار دینامیکی Cr (kN):' : 'Dynamic Rating Cr (kN):'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={customCr}
                onChange={(e) => setCustomCr(parseFloat(e.target.value) || 0.1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'fa' ? 'ظرفیت بار استاتیکی C0r (kN):' : 'Static Rating C0r (kN):'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={customCor}
                onChange={(e) => setCustomCor(parseFloat(e.target.value) || 0.1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'fa' ? 'سرعت حد مجاز (RPM):' : 'Limiting Speed (RPM):'}
              </label>
              <input
                type="number"
                step="500"
                min="100"
                value={customSpeedLimit}
                onChange={(e) => setCustomSpeedLimit(parseFloat(e.target.value) || 1000)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. OPERATING LOADS & SPEED INPUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>{language === 'fa' ? 'شرایط بارگذاری و سرعت کاری' : 'Operating Loads & Rotational Speed'}</span>
            </h4>

            {/* Load Unit Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => {
                  if (loadUnit === 'N') {
                    setRadialLoadFr(radialLoadFr / 1000);
                    setAxialLoadFa(axialLoadFa / 1000);
                  }
                  setLoadUnit('kN');
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  loadUnit === 'kN' ? 'bg-[#232c86] text-white' : 'text-slate-600'
                }`}
              >
                kN
              </button>
              <button
                type="button"
                onClick={() => {
                  if (loadUnit === 'kN') {
                    setRadialLoadFr(radialLoadFr * 1000);
                    setAxialLoadFa(axialLoadFa * 1000);
                  }
                  setLoadUnit('N');
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  loadUnit === 'N' ? 'bg-[#232c86] text-white' : 'text-slate-600'
                }`}
              >
                N
              </button>
            </div>
          </div>

          {/* Radial Load (Fr) Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">
                {language === 'fa' ? 'بار شعاعی عملیاتی (Radial Load Fr):' : 'Applied Radial Load (Fr):'}
              </span>
              <span className="font-mono font-black text-[#232c86] text-sm">
                {radialLoadFr} {loadUnit}
              </span>
            </div>
            <input
              type="range"
              min={loadUnit === 'kN' ? 0.1 : 100}
              max={loadUnit === 'kN' ? Math.max(20, Math.round(activeCrKn * 1.2)) : Math.max(20000, Math.round(activeCrKn * 1200))}
              step={loadUnit === 'kN' ? 0.1 : 100}
              value={radialLoadFr}
              onChange={(e) => setRadialLoadFr(parseFloat(e.target.value) || 0)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#232c86]"
            />
          </div>

          {/* Axial Load (Fa) Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">
                {language === 'fa' ? 'بار محوری عملیاتی (Axial Thrust Fa):' : 'Applied Axial Load (Fa):'}
              </span>
              <span className="font-mono font-black text-[#232c86] text-sm">
                {axialLoadFa} {loadUnit}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={loadUnit === 'kN' ? Math.max(15, Math.round(activeCorKn * 0.8)) : Math.max(15000, Math.round(activeCorKn * 800))}
              step={loadUnit === 'kN' ? 0.1 : 50}
              value={axialLoadFa}
              onChange={(e) => setAxialLoadFa(parseFloat(e.target.value) || 0)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#232c86]"
            />
          </div>

          {/* Rotational Speed (RPM) Slider & Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">
                {language === 'fa' ? 'سرعت چرخش شفت (Rotational Speed n):' : 'Rotational Speed (n):'}
              </span>
              <span className="font-mono font-black text-[#232c86] text-sm">
                {operatingRpm} RPM
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={Math.max(3000, activeSpeedLimit)}
              step={50}
              value={operatingRpm}
              onChange={(e) => setOperatingRpm(parseInt(e.target.value, 10) || 100)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#232c86]"
            />
            {operatingRpm > activeSpeedLimit && (
              <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {language === 'fa' 
                    ? `سرعت انتخابی (${operatingRpm} RPM) از حد مجاز گریس کاتالوگ (${activeSpeedLimit} RPM) بیشتر است.`
                    : `Selected speed (${operatingRpm} RPM) exceeds catalog grease limiting speed (${activeSpeedLimit} RPM).`}
                </span>
              </p>
            )}
          </div>

          {/* Reliability Factor a1 Selection */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {language === 'fa' ? 'ضریب قابلیت اطمینان (ISO 281 Factor a1):' : 'Reliability Factor (a1):'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { level: 90, a1: '1.0', label: 'L10 (90%)' },
                { level: 95, a1: '0.62', label: 'L5 (95%)' },
                { level: 98, a1: '0.33', label: 'L2 (98%)' },
                { level: 99, a1: '0.21', label: 'L1 (99%)' },
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setReliabilityLevel(item.level as any)}
                  className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    reliabilityLevel === item.level
                      ? 'bg-[#232c86] text-white border-[#232c86] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-mono text-[11px]">{item.label}</span>
                  <span className="text-[10px] opacity-80">a1={item.a1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. CALCULATION RESULTS & ENGINEERING METRICS */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Life Result Card */}
          <div className="bg-gradient-to-br from-[#232c86] to-[#151c5e] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold font-mono">
                {language === 'fa' ? `طول عمر محاسبه‌شده (L${100 - reliabilityLevel}h)` : `Rated Service Life (L${100 - reliabilityLevel}h)`}
              </span>
              <span className="text-xs text-blue-200 font-mono">
                P = {equivalentLoadCalculation.P} kN | Cr/P = {lifeResults.loadRatio}
              </span>
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                  {lifeResults.LnaHours > 1_000_000 
                    ? '> 1,000,000' 
                    : lifeResults.LnaHours.toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US')}
                </span>
                <span className="text-lg font-bold text-blue-200">
                  {language === 'fa' ? 'ساعت کاری' : 'Hours'}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-1 font-mono">
                ≈ {lifeResults.LnaRevMillions.toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US')} {language === 'fa' ? 'میلیون دور چرخش (10⁶ Rev)' : 'Million Revolutions'}
              </p>
            </div>

            {/* Assessment Badge */}
            <div className="mt-6 pt-4 border-t border-white/15">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-xs font-bold text-white mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lifeAssessment.badge}</span>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                {language === 'fa' ? lifeAssessment.descFa : lifeAssessment.descEn}
              </p>
            </div>
          </div>

          {/* Engineering Breakdown Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Dynamic Load Breakdown */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 block font-bold mb-1">
                {language === 'fa' ? 'بار دینامیکی معادل (P):' : 'Equivalent Dynamic Load (P):'}
              </span>
              <div className="text-lg font-black font-mono text-[#232c86]">
                {equivalentLoadCalculation.P} kN
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                X={equivalentLoadCalculation.X}, Y={equivalentLoadCalculation.Y.toFixed(2)}
              </span>
            </div>

            {/* Static Safety Factor s0 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 block font-bold mb-1">
                {language === 'fa' ? 'ضریب اطمینان استاتیکی (s0):' : 'Static Safety Factor (s0):'}
              </span>
              <div className={`text-lg font-black font-mono ${
                lifeResults.s0 >= 1.5 ? 'text-emerald-700' : 'text-amber-600'
              }`}>
                s₀ = {lifeResults.s0}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                {lifeResults.s0 >= 1.5 
                  ? (language === 'fa' ? 'ایمن در برابر دفرمگی' : 'Safe plastic deformation') 
                  : (language === 'fa' ? 'نیازمند بررسی بار ضربه‌ای' : 'Check shock loads')}
              </span>
            </div>
          </div>

          {/* Technical Note / Warning Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Info className="w-4 h-4 text-blue-600" />
              <span>{language === 'fa' ? 'منطق محاسبه بار معادل (ISO 281):' : 'ISO 281 Load Derivation Logic:'}</span>
            </div>
            <p>
              {language === 'fa' 
                ? equivalentLoadCalculation.calculationNoteFa 
                : equivalentLoadCalculation.calculationNoteEn}
            </p>
          </div>
        </div>
      </div>

      {/* 4. DESIGN GUIDANCE & STANDARD DISCLAIMER */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-3xl p-6 text-xs text-blue-950 leading-relaxed space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-[#232c86]">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>{language === 'fa' ? 'ملاحظات مهندسی و حدود استاندارد ISO 281 / DIN' : 'Engineering Assumptions & ISO 281 Scope'}</span>
        </div>
        <p>
          {language === 'fa' 
            ? 'طول عمر پایه L10h نشان‌دهنده احتمال بقای ۹۰٪ در شرایط روانکاری استاندارد و تمیز است. برای برآورد طول عمر تصحیح‌شده بر اساس ویسکوزیته روغن، دما و تمیزی روانکار (Lnm = a1 · aISO · L10 مطابق با ISO 281:2007)، با مهندسین فنی پولاد چرخِش مشورت فرمایید.'
            : 'Basic rating life L10h represents 90% survival probability under clean reference lubrication. For extended ISO 281:2007 rating life factoring oil viscosity ratio (κ) and contamination (ηc), please consult Polad Charkhesh technical engineers.'}
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section id="bearing-life-calculator" className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#232c86] text-xs font-bold font-mono-spec mb-3 shadow-xs">
          <Hourglass className="w-3.5 h-3.5 text-blue-600" />
          <span>{language === 'fa' ? 'استاندارد محاسباتی طول عمر ISO 281' : 'ISO 281 Life Calculation Tool'}</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          {language === 'fa' ? 'محاسبه طول عمر نامی و بار معادل بیرینگ' : 'Bearing Rating Life & Load Calculator'}
        </h2>
        
        <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
          {language === 'fa' 
            ? 'محاسبه دقیق ساعات کارکرد و دور بر مبنای بار دینامیکی معادل P، ظرفیت کاتالوگ سازنده و استاندارد بین‌المللی ISO 281' 
            : 'Determine operating hours and revolutions based on dynamic equivalent load P, catalog ratings and ISO 281 equations'}
        </p>
      </div>

      {content}
    </section>
  );
};
