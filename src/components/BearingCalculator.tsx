import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { MetricImperialConverter } from './MetricImperialConverter';
import { BearingThermalEstimator } from './BearingThermalEstimator';
import { BearingLifeCalculator } from './BearingLifeCalculator';
import { 
  Wrench, 
  HelpCircle, 
  Sparkles,
  Gauge,
  Thermometer,
  Disc,
  Zap,
  CheckCircle2,
  Ruler,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  Settings2,
  Activity,
  Hourglass
} from 'lucide-react';
import {
  BearingFamily,
  getISO5753Clearance,
  SHAFT_TOLERANCES,
  calculateFitReduction,
  calculateThermalReduction
} from '../data/bearingStandards';

interface BearingCalculatorProps {
  language: Language;
}

export const BearingCalculator: React.FC<BearingCalculatorProps> = ({ language }) => {
  const [bearingFamily, setBearingFamily] = useState<BearingFamily>('deep-groove-ball');
  const [selectedBoreSize, setSelectedBoreSize] = useState<number>(45);
  const [operatingTemp, setOperatingTemp] = useState<number>(75);
  const [ambientTemp, setAmbientTemp] = useState<number>(25);
  const [shaftTolerance, setShaftTolerance] = useState<string>('k5');
  const [speedCategory, setSpeedCategory] = useState<'normal' | 'high' | 'very-high'>('normal');
  const [activeToolTab, setActiveToolTab] = useState<'clearance' | 'life' | 'thermal' | 'converter' | 'all'>('clearance');

  const t = translations[language];

  // Quick preset application handler
  const applyPreset = (type: 'motor' | 'kiln' | 'screen' | 'spindle') => {
    switch (type) {
      case 'motor':
        setBearingFamily('deep-groove-ball');
        setSelectedBoreSize(45);
        setOperatingTemp(80);
        setAmbientTemp(30);
        setShaftTolerance('k5');
        setSpeedCategory('high');
        break;
      case 'kiln':
        setBearingFamily('spherical-roller-cyl');
        setSelectedBoreSize(90);
        setOperatingTemp(145);
        setAmbientTemp(35);
        setShaftTolerance('m5');
        setSpeedCategory('normal');
        break;
      case 'screen':
        setBearingFamily('spherical-roller-taper');
        setSelectedBoreSize(70);
        setOperatingTemp(95);
        setAmbientTemp(30);
        setShaftTolerance('n6');
        setSpeedCategory('very-high');
        break;
      case 'spindle':
        setBearingFamily('deep-groove-ball');
        setSelectedBoreSize(30);
        setOperatingTemp(35);
        setAmbientTemp(25);
        setShaftTolerance('js6');
        setSpeedCategory('normal');
        break;
    }
  };

  // Sync bore diameter from Metric/Imperial converter into the clearance tool
  const handleApplyBoreFromConverter = (boreMm: number) => {
    const clamped = Math.min(200, Math.max(10, Math.round(boreMm)));
    setSelectedBoreSize(clamped);
  };

  // Get exact ISO 5753 standard clearance range for the current family and bore size
  const isoClearance = useMemo(() => {
    return getISO5753Clearance(bearingFamily, selectedBoreSize);
  }, [bearingFamily, selectedBoreSize]);

  // Differential temperature between inner and outer ring
  // Usually inner ring is 5°C to 15°C hotter than outer ring in normal conditions, up to 25-35°C in hot/high-speed applications
  const deltaTempInnerOuter = useMemo(() => {
    const rise = Math.max(0, operatingTemp - ambientTemp);
    if (speedCategory === 'very-high') return Math.max(10, Math.round(rise * 0.35));
    if (speedCategory === 'high') return Math.max(5, Math.round(rise * 0.25));
    return Math.max(3, Math.round(rise * 0.18));
  }, [operatingTemp, ambientTemp, speedCategory]);

  // Reductions
  const fitReductionUm = useMemo(() => {
    return calculateFitReduction(selectedBoreSize, shaftTolerance);
  }, [selectedBoreSize, shaftTolerance]);

  const thermalReductionUm = useMemo(() => {
    return calculateThermalReduction(selectedBoreSize, deltaTempInnerOuter);
  }, [selectedBoreSize, deltaTempInnerOuter]);

  const totalReductionUm = useMemo(() => {
    return Math.round((fitReductionUm + thermalReductionUm) * 10) / 10;
  }, [fitReductionUm, thermalReductionUm]);

  // Bearing families metadata
  const bearingFamilies = [
    { id: 'deep-groove-ball', labelFa: 'بلبرینگ شیار عمیق (Deep Groove)', labelEn: 'Deep Groove Ball', standard: 'ISO 5753-1 Tab 1' },
    { id: 'cylindrical-roller', labelFa: 'رولبرینگ استوانه‌ای (Cylindrical)', labelEn: 'Cylindrical Roller', standard: 'ISO 5753-1 Tab 2' },
    { id: 'spherical-roller-cyl', labelFa: 'رولبرینگ بشکه‌ای سوراخ استوانه‌ای', labelEn: 'Spherical Roller (Cylindrical)', standard: 'ISO 5753-1 Tab 3' },
    { id: 'spherical-roller-taper', labelFa: 'رولبرینگ بشکه‌ای سوراخ مخروطی (K)', labelEn: 'Spherical Roller (Tapered 1:12)', standard: 'ISO 5753-1 Tab 4' },
    { id: 'self-aligning-ball', labelFa: 'بلبرینگ خودتنظیم (Self-Aligning)', labelEn: 'Self-Aligning Ball', standard: 'ISO 5753-1 Tab 5' },
    { id: 'angular-contact-double', labelFa: 'بلبرینگ دو ردیفه تماس زاویه‌ای', labelEn: 'Double Row Angular Contact', standard: 'ISO 5753-1' },
  ];

  // Dynamic Clearance Recommendation Engine based on ISO 5753 & Total Reduction
  const recommendation = useMemo(() => {
    if (!isoClearance) {
      return {
        code: 'CN',
        nameFa: 'لقی استاندارد نرمال',
        nameEn: 'Normal Standard Clearance (CN)',
        range: '10 – 25 μm',
        reasonFa: 'مناسب برای شرایط استاندارد کاری.',
        reasonEn: 'Suitable for normal industrial operations.',
        badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        levelIndex: 1,
        color: '#059669',
        operatingClearance: 12,
      };
    }

    // Check operating clearance under each RIC class: Operating RIC = Initial Mid - Total Reduction
    const classes = [
      { code: 'C2', min: isoClearance.c2[0], max: isoClearance.c2[1], mid: (isoClearance.c2[0] + isoClearance.c2[1]) / 2, idx: 0 },
      { code: 'CN', min: isoClearance.cn[0], max: isoClearance.cn[1], mid: (isoClearance.cn[0] + isoClearance.cn[1]) / 2, idx: 1 },
      { code: 'C3', min: isoClearance.c3[0], max: isoClearance.c3[1], mid: (isoClearance.c3[0] + isoClearance.c3[1]) / 2, idx: 2 },
      { code: 'C4', min: isoClearance.c4[0], max: isoClearance.c4[1], mid: (isoClearance.c4[0] + isoClearance.c4[1]) / 2, idx: 3 },
      { code: 'C5', min: isoClearance.c5[0], max: isoClearance.c5[1], mid: (isoClearance.c5[0] + isoClearance.c5[1]) / 2, idx: 4 },
    ];

    // Target minimum residual operating clearance is >= 3-10 μm (to avoid pinching and catastrophic overheating)
    // and ideally 5-25 μm
    let chosen = classes[1]; // default CN

    if (totalReductionUm > 35 || operatingTemp > 130 || speedCategory === 'very-high') {
      chosen = classes[3]; // C4
    } else if (totalReductionUm > 18 || operatingTemp >= 75 || speedCategory === 'high' || shaftTolerance === 'm5' || shaftTolerance === 'n6') {
      chosen = classes[2]; // C3
    } else if (totalReductionUm < 6 && operatingTemp < 40 && speedCategory === 'normal' && shaftTolerance === 'js6') {
      chosen = classes[0]; // C2
    } else {
      chosen = classes[1]; // CN
    }

    // If remaining operating clearance is negative with chosen class, bump up
    const residualMin = chosen.min - totalReductionUm;
    if (residualMin < 0 && chosen.idx < 4) {
      chosen = classes[chosen.idx + 1];
    }

    const remainingClearanceRange = `${Math.round(chosen.min - totalReductionUm)} تا ${Math.round(chosen.max - totalReductionUm)} μm`;
    const initialRange = `${chosen.min} – ${chosen.max} μm`;

    let badgeBg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    let color = '#059669';
    if (chosen.code === 'C3') {
      badgeBg = 'bg-amber-50 border-amber-200 text-amber-800';
      color = '#d97706';
    } else if (chosen.code === 'C4' || chosen.code === 'C5') {
      badgeBg = 'bg-red-50 border-red-200 text-red-700';
      color = '#dc2626';
    } else if (chosen.code === 'C2') {
      badgeBg = 'bg-sky-50 border-sky-200 text-sky-800';
      color = '#0284c7';
    }

    let reasonFa = '';
    let reasonEn = '';
    if (chosen.code === 'C4' || chosen.code === 'C5') {
      reasonFa = `کلاس ${chosen.code} جهت خنثی‌سازی افت لقی کلی به میزان ${totalReductionUm} میکرون (انبساط حرارتی ${thermalReductionUm}μm و انطباق پرسی ${fitReductionUm}μm) و جلوگیری از قفل‌شدن ساچمه‌ها ضروری است.`;
      reasonEn = `Class ${chosen.code} is required to compensate for ${totalReductionUm} μm total clearance reduction (thermal ${thermalReductionUm}μm + fit ${fitReductionUm}μm) and prevent bearing seizure.`;
    } else if (chosen.code === 'C3') {
      reasonFa = `کلاس C3 پرکاربردترین گزینه برای الکتروموتورها و پمپ‌ها با انطباق شفت ${shaftTolerance}؛ پس از اعمال افت ${totalReductionUm} میکرون، لقی کاری مطلوب ${remainingClearanceRange} در حین چرخش برقرار می‌ماند.`;
      reasonEn = `Class C3 is the optimal industrial standard for shaft fit ${shaftTolerance}; retains ${remainingClearanceRange} positive operating clearance after ${totalReductionUm} μm reduction.`;
    } else if (chosen.code === 'C2') {
      reasonFa = `کلاس C2 برای کاهش لقی شعاعی به حداقل ممکن و افزایش صلبیت و دقت دور در اسپیندل‌ها با انطباق بسیار سبک.`;
      reasonEn = `Class C2 provides minimal radial play and enhanced rigidity for high-precision machine tool spindles with light shaft fits.`;
    } else {
      reasonFa = `کلاس CN استاندارد نرمال؛ افت مجموع ${totalReductionUm} میکرون بوده و لقی باقیمانده کارکرد ${remainingClearanceRange} را تضمین می‌کند.`;
      reasonEn = `Class CN standard clearance; total reduction is ${totalReductionUm} μm, maintaining safe operational clearance of ${remainingClearanceRange}.`;
    }

    return {
      code: chosen.code,
      nameFa: chosen.code === 'CN' ? 'لقی استاندارد نرمال (CN)' : `لقی کلاس ${chosen.code}`,
      nameEn: `Clearance Class ${chosen.code}`,
      initialRange,
      remainingClearanceRange,
      reasonFa,
      reasonEn,
      badgeBg,
      levelIndex: chosen.idx,
      color,
    };
  }, [isoClearance, totalReductionUm, operatingTemp, speedCategory, shaftTolerance, thermalReductionUm, fitReductionUm]);

  const clearanceLevels = useMemo(() => {
    if (!isoClearance) {
      return [
        { code: 'C2', label: 'C2', range: '5 – 12 μm' },
        { code: 'CN', label: 'CN', range: '12 – 25 μm' },
        { code: 'C3', label: 'C3', range: '25 – 45 μm' },
        { code: 'C4', label: 'C4', range: '45 – 65 μm' },
        { code: 'C5', label: 'C5', range: '65 – 90 μm' },
      ];
    }
    return [
      { code: 'C2', label: 'C2 (کمتر از نرمال)', range: `${isoClearance.c2[0]} – ${isoClearance.c2[1]} μm` },
      { code: 'CN', label: 'CN (استاندارد نرمال)', range: `${isoClearance.cn[0]} – ${isoClearance.cn[1]} μm` },
      { code: 'C3', label: 'C3 (لقی بیشتر - متداول)', range: `${isoClearance.c3[0]} – ${isoClearance.c3[1]} μm` },
      { code: 'C4', label: 'C4 (لقی بالا - دما/ویبره)', range: `${isoClearance.c4[0]} – ${isoClearance.c4[1]} μm` },
      { code: 'C5', label: 'C5 (فوق‌العاده بالا)', range: `${isoClearance.c5[0]} – ${isoClearance.c5[1]} μm` },
    ];
  }, [isoClearance]);

  return (
    <section id="tools" className="py-16 sm:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10 text-start">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-[#232c86] text-xs font-semibold mb-4 shadow-sm">
              <Wrench className="w-3.5 h-3.5 text-[#232c86]" />
              <span>{t.tools.tag}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t.tools.title}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-slate-600">
              {t.tools.subtitle}
            </p>
          </div>

          {/* Primary Tool Tab Switcher */}
          <div className="flex flex-wrap items-center p-1.5 bg-slate-200/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-xs self-start md:self-auto gap-1">
            <button
              id="tab-clearance-btn"
              type="button"
              onClick={() => setActiveToolTab('clearance')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeToolTab === 'clearance'
                  ? 'bg-[#232c86] text-white shadow-sm font-extrabold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>{language === 'fa' ? 'لقی شعاعی (ISO 5753)' : 'RIC Clearance'}</span>
            </button>

            <button
              id="tab-life-btn"
              type="button"
              onClick={() => setActiveToolTab('life')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeToolTab === 'life'
                  ? 'bg-[#232c86] text-white shadow-sm font-extrabold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Hourglass className="w-4 h-4" />
              <span>{language === 'fa' ? 'طول عمر نامی (ISO 281)' : 'Bearing Life'}</span>
            </button>

            <button
              id="tab-thermal-btn"
              type="button"
              onClick={() => setActiveToolTab('thermal')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeToolTab === 'thermal'
                  ? 'bg-[#232c86] text-white shadow-sm font-extrabold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{language === 'fa' ? 'سرعت و دما' : 'Speed & Thermal'}</span>
            </button>

            <button
              id="tab-converter-btn"
              type="button"
              onClick={() => setActiveToolTab('converter')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeToolTab === 'converter'
                  ? 'bg-[#232c86] text-white shadow-sm font-extrabold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>{language === 'fa' ? 'مبدل ابعاد (mm / Inch)' : 'Metric ⇄ Inch'}</span>
            </button>

            <button
              id="tab-all-tools-btn"
              type="button"
              onClick={() => setActiveToolTab('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all hidden sm:flex items-center gap-1.5 cursor-pointer ${
                activeToolTab === 'all'
                  ? 'bg-[#232c86] text-white shadow-sm font-extrabold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{language === 'fa' ? 'همه ابزارها' : 'All Tools'}</span>
            </button>
          </div>
        </div>

        {/* BEARING RATING LIFE CALCULATOR VIEW (When life tab is selected) */}
        {activeToolTab === 'life' && (
          <div className="animate-in fade-in duration-200">
            <BearingLifeCalculator language={language} embedded={true} />
          </div>
        )}

        {/* SPEED & THERMAL ESTIMATOR VIEW (When thermal tab is selected) */}
        {activeToolTab === 'thermal' && (
          <div className="animate-in fade-in duration-200">
            <BearingThermalEstimator language={language} embedded={true} />
          </div>
        )}

        {/* METRIC / IMPERIAL DIMENSION CONVERTER VIEW (When converter tab or all tools is selected) */}
        {(activeToolTab === 'converter' || activeToolTab === 'all') && (
          <div className={`mb-10 ${activeToolTab === 'all' ? 'border-b border-slate-200/60 pb-10' : ''}`}>
            <MetricImperialConverter 
              language={language}
              onApplyBoreToCalculator={(boreMm) => {
                handleApplyBoreFromConverter(boreMm);
                if (activeToolTab === 'converter') {
                  setActiveToolTab('clearance');
                }
              }}
            />
          </div>
        )}

        {/* CLEARANCE CALCULATOR & SUFFIX GLOSSARY (When clearance tab or all tools is selected) */}
        {(activeToolTab === 'clearance' || activeToolTab === 'all') && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Quick Preset Buttons for Responsive Engineering Setup (Apple Glass Pills) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 glass-pill px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-[#232c86]" />
                {t.tools.presetLabel}
              </span>
              <button
                onClick={() => applyPreset('motor')}
                className="px-3.5 py-1.5 rounded-full glass-pill text-xs font-semibold text-slate-700 hover:text-[#232c86] hover:bg-white/80 transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                ⚡ {t.tools.presets.motor}
              </button>
              <button
                onClick={() => applyPreset('kiln')}
                className="px-3.5 py-1.5 rounded-full glass-pill text-xs font-semibold text-slate-700 hover:text-[#232c86] hover:bg-white/80 transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                🔥 {t.tools.presets.kiln}
              </button>
              <button
                onClick={() => applyPreset('screen')}
                className="px-3.5 py-1.5 rounded-full glass-pill text-xs font-semibold text-slate-700 hover:text-[#232c86] hover:bg-white/80 transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                📈 {t.tools.presets.screen}
              </button>
              <button
                onClick={() => applyPreset('spindle')}
                className="px-3.5 py-1.5 rounded-full glass-pill text-xs font-semibold text-slate-700 hover:text-[#232c86] hover:bg-white/80 transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                🎯 {t.tools.presets.spindle}
              </button>
            </div>

            {/* 2-Column Responsive Grid: Clearance Calculator + Suffix Glossary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Interactive Calculator Card (Apple Liquid Glass) */}
              <div className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl space-y-6">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-[#232c86] border border-blue-500/10 flex-shrink-0">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {language === 'fa' ? 'محاسبه‌گر تخصصی لقی داخلی بر اساس استاندارد ISO 5753' : 'ISO 5753 Radial Internal Clearance (RIC) Engine'}
                      </h3>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {language === 'fa' ? 'محاسبه انقباض حرارتی شفت و انطباق پرسی بر لقی کاری برینگ' : 'Precision ISO radial clearance with thermal expansion & fit reduction math'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 1: Bearing Family Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>{language === 'fa' ? '۱. خانواده و تیپ برینگ (ISO 5753-1):' : '1. Bearing Family Type (ISO 5753-1):'}</span>
                    <span className="text-[11px] font-mono text-[#232c86] font-semibold">
                      {bearingFamilies.find(f => f.id === bearingFamily)?.standard}
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {bearingFamilies.map((fam) => (
                      <button
                        key={fam.id}
                        type="button"
                        onClick={() => setBearingFamily(fam.id as BearingFamily)}
                        className={`p-2.5 rounded-2xl text-xs text-start transition-all border cursor-pointer active:scale-95 flex items-center justify-between ${
                          bearingFamily === fam.id
                            ? 'bg-[#232c86] text-white border-[#232c86] shadow-sm font-bold'
                            : 'glass-card bg-white/60 text-slate-700 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        <span>{language === 'fa' ? fam.labelFa : fam.labelEn}</span>
                        {bearingFamily === fam.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Bore Diameter (d) */}
                <div className="space-y-3 bg-slate-100/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Disc className="w-4 h-4 text-[#232c86]" />
                      {t.tools.boreLabel} (d):
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-white/90 border border-white font-mono-spec font-black text-[#232c86] text-sm shadow-sm">
                        {selectedBoreSize} mm
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={selectedBoreSize}
                    onChange={(e) => setSelectedBoreSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-300/80 rounded-lg appearance-none cursor-pointer accent-[#232c86]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono-spec">
                    <span>10 mm</span>
                    <span>50 mm</span>
                    <span>100 mm</span>
                    <span>180 mm</span>
                  </div>
                </div>

                {/* Step 3: ISO Shaft Tolerance Class & Operating Temperatures Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shaft Tolerance Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>{language === 'fa' ? 'تلرانس انطباق شفت:' : 'Shaft Tolerance Fit:'}</span>
                      <span className="text-[11px] font-mono text-amber-700 font-bold">
                        Δd_fit: -{fitReductionUm} μm
                      </span>
                    </label>
                    <select
                      value={shaftTolerance}
                      onChange={(e) => setShaftTolerance(e.target.value)}
                      className="w-full px-3 py-2.5 glass-input rounded-2xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      {SHAFT_TOLERANCES.map((st) => (
                        <option key={st.code} value={st.code}>
                          {st.code.toUpperCase()} — {language === 'fa' ? st.nameFa : st.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speed Category */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      {t.tools.speedLabel}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'normal', label: t.tools.speedNormal, icon: '🟢' },
                        { id: 'high', label: t.tools.speedHigh, icon: '🟡' },
                        { id: 'very-high', label: t.tools.speedVeryHigh, icon: '🔴' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSpeedCategory(s.id as any)}
                          className={`py-2 px-1 text-[11px] font-semibold rounded-xl border transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                            speedCategory === s.id
                              ? 'bg-[#232c86] text-white border-[#232c86] shadow-xs font-bold'
                              : 'glass-btn-secondary text-slate-700'
                          }`}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Operating Temperature Slider */}
                <div className="space-y-3 bg-slate-100/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-amber-600" />
                      {t.tools.tempLabel}:
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-mono">
                        (ΔT حلقه داخلی-خارجی: ~{deltaTempInnerOuter}°C | افت حرارتی: -{thermalReductionUm}μm)
                      </span>
                      <span className={`px-3 py-1 rounded-xl bg-white/90 border border-white font-mono-spec font-black text-sm shadow-sm ${
                        operatingTemp > 100 ? 'text-red-600' : operatingTemp > 60 ? 'text-amber-600' : 'text-blue-600'
                      }`}>
                        {operatingTemp} °C
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="180"
                    step="5"
                    value={operatingTemp}
                    onChange={(e) => setOperatingTemp(Number(e.target.value))}
                    className="w-full h-2 bg-slate-300/80 rounded-lg appearance-none cursor-pointer accent-[#232c86]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono-spec">
                    <span>{t.tools.tempCold} (20°C)</span>
                    <span>{t.tools.tempNormal} (80°C)</span>
                    <span>{t.tools.tempHot} (180°C)</span>
                  </div>
                </div>

                {/* Clearance Hierarchy Guide for This Exact Bore Size (from ISO Tables) */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>{language === 'fa' ? `جدول حدود لقی اولیه ISO 5753 برای شفت ${selectedBoreSize}mm:` : `ISO 5753 Initial Radial Clearance Range for ${selectedBoreSize}mm:`}</span>
                    <span className="text-[11px] font-mono text-slate-500 font-normal">
                      (کاهش کل برینگ: <strong className="text-red-600 font-black">-{totalReductionUm} μm</strong>)
                    </span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {clearanceLevels.map((lvl, idx) => {
                      const isSelected = recommendation.levelIndex === idx;
                      return (
                        <div
                          key={lvl.code}
                          className={`p-2.5 rounded-2xl text-center border transition-all ${
                            isSelected
                              ? 'bg-[#232c86] text-white border-[#232c86] shadow-md scale-105 ring-2 ring-blue-300'
                              : 'glass-card bg-white/40 text-slate-700 border-white/60'
                          }`}
                        >
                          <div className={`font-black font-mono-spec text-sm ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {lvl.code}
                          </div>
                          <div className={`text-[10px] font-mono-spec mt-1 font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {lvl.range}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calculated Result Box (Frosted Accent Glass) */}
                <div className="p-5 rounded-3xl bg-blue-500/10 backdrop-blur-md border border-blue-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      {t.tools.recTitle}
                    </span>
                    <span className={`px-3.5 py-1.5 text-xs font-black font-mono-spec rounded-full border shadow-sm backdrop-blur-md ${recommendation.badgeBg}`}>
                      {recommendation.code}
                    </span>
                  </div>
                  
                  <div className="text-sm font-black text-[#1a226b]">
                    {language === 'fa' ? recommendation.nameFa : recommendation.nameEn}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {language === 'fa' ? recommendation.reasonFa : recommendation.reasonEn}
                  </p>

                  <div className="pt-3 border-t border-blue-500/20 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px] mb-0.5">
                        {language === 'fa' ? 'لقی اولیه پیش از نصب (ISO):' : 'Initial Clearance (ISO):'}
                      </span>
                      <span className="font-mono-spec font-bold text-[#232c86]">
                        {recommendation.initialRange}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] mb-0.5">
                        {language === 'fa' ? 'لقی باقیمانده کارکرد (Operating):' : 'Effective Operating RIC:'}
                      </span>
                      <span className="font-mono-spec font-black text-emerald-700">
                        {recommendation.remainingClearanceRange}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Suffix & Nomenclature Guide Card (Apple Liquid Glass) */}
              <div className="lg:col-span-5 glass-card p-6 sm:p-8 rounded-3xl space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-[#232c86] border border-blue-500/10 flex-shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {t.tools.interchangeTitle}
                    </h3>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      {t.tools.interchangeSub}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-200/40 text-xs">
                  {t.tools.interchangeTips.map((tip, idx) => (
                    <div key={idx} className="py-3.5 flex items-start gap-3 first:pt-0 last:pb-0">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-[#232c86] font-mono-spec font-bold text-xs whitespace-nowrap border border-blue-500/20">
                        {tip.code}
                      </span>
                      <p className="text-slate-700 leading-relaxed pt-0.5">
                        {tip.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick Suffix Legend */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/60 backdrop-blur-sm border border-white/80 text-xs space-y-3">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {language === 'fa' ? 'راهنمای کدهای فنی پسوند برندهای اصلی:' : 'Key Technical Suffix Reference:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="p-2.5 rounded-xl bg-white/80 border border-white/90 shadow-sm">
                      <strong className="text-[#232c86]">2RS / DDU / LLU:</strong> {language === 'fa' ? 'کاسه نمد تماسی دوطرفه' : 'Dual Contact Seals'}
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 border border-white/90 shadow-sm">
                      <strong className="text-[#232c86]">ZZ / 2Z / 2NSE:</strong> {language === 'fa' ? 'شیلد فلزی محافظ گردوغبار' : 'Dual Steel Shields'}
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 border border-white/90 shadow-sm">
                      <strong className="text-[#232c86]">EM / M / M1A:</strong> {language === 'fa' ? 'قفسه برنجی ماشین‌کاری' : 'Solid Machined Brass Cage'}
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 border border-white/90 shadow-sm">
                      <strong className="text-[#232c86]">K / K30 / W33:</strong> {language === 'fa' ? 'کونیک با شیار روغن' : 'Tapered Bore & Lube Groove'}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* BEARING LIFE & SPEED/THERMAL ESTIMATOR IN ALL TOOLS TAB */}
        {activeToolTab === 'all' && (
          <>
            <div className="mt-12 pt-12 border-t border-slate-200/60 animate-in fade-in duration-200">
              <BearingLifeCalculator language={language} embedded={true} />
            </div>
            <div className="mt-12 pt-12 border-t border-slate-200/60 animate-in fade-in duration-200">
              <BearingThermalEstimator language={language} embedded={true} />
            </div>
          </>
        )}

      </div>
    </section>
  );
};

