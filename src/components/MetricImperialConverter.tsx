import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Ruler, 
  Copy, 
  Check, 
  Sparkles, 
  Info, 
  Calculator,
  Layers,
  CheckCircle2,
  Gauge
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface MetricImperialConverterProps {
  language: Language;
  onApplyBoreToCalculator?: (boreMm: number) => void;
}

// Function to calculate greatest common divisor for fraction simplification
function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a);
}

// Converts decimal inches to closest engineering fraction (1/2, 1/4, 1/8, 1/16, 1/32, 1/64)
export function getClosestFraction(decimalInches: number, maxDenominator: number = 64): {
  whole: number;
  numerator: number;
  denominator: number;
  display: string;
  exactValue: number;
  deviationThou: number; // in thousandths of an inch (mils)
} {
  if (isNaN(decimalInches) || decimalInches <= 0) {
    return {
      whole: 0,
      numerator: 0,
      denominator: 1,
      display: '0"',
      exactValue: 0,
      deviationThou: 0,
    };
  }

  const whole = Math.floor(decimalInches);
  const remainder = decimalInches - whole;

  if (remainder < 0.0005) {
    return {
      whole,
      numerator: 0,
      denominator: 1,
      display: `${whole}"`,
      exactValue: whole,
      deviationThou: 0,
    };
  }

  // Find best denominator from powers of 2 (2, 4, 8, 16, 32, 64)
  let bestNum = 0;
  let bestDen = 64;
  let minDiff = Infinity;

  const validDenominators = [2, 4, 8, 16, 32, 64];

  for (const den of validDenominators) {
    const num = Math.round(remainder * den);
    const approx = num / den;
    const diff = Math.abs(remainder - approx);

    if (diff < minDiff) {
      minDiff = diff;
      bestNum = num;
      bestDen = den;
    }
  }

  // If rounded up to 1
  let finalWhole = whole;
  if (bestNum === bestDen) {
    finalWhole += 1;
    bestNum = 0;
    bestDen = 1;
  } else if (bestNum > 0) {
    // Simplify fraction
    const divisor = gcd(bestNum, bestDen);
    bestNum = bestNum / divisor;
    bestDen = bestDen / divisor;
  }

  const approxDecimal = finalWhole + (bestNum > 0 ? bestNum / bestDen : 0);
  const deviationThou = (approxDecimal - decimalInches) * 1000;

  let display = '';
  if (finalWhole > 0 && bestNum > 0) {
    display = `${finalWhole} ${bestNum}/${bestDen}"`;
  } else if (finalWhole > 0) {
    display = `${finalWhole}"`;
  } else if (bestNum > 0) {
    display = `${bestNum}/${bestDen}"`;
  } else {
    display = '0"';
  }

  return {
    whole: finalWhole,
    numerator: bestNum,
    denominator: bestDen,
    display,
    exactValue: approxDecimal,
    deviationThou: Math.round(deviationThou * 10) / 10,
  };
}

export const MetricImperialConverter: React.FC<MetricImperialConverterProps> = ({ 
  language,
  onApplyBoreToCalculator 
}) => {
  const t = translations[language];
  const u = t.tools.unitConverter;

  // Active conversion mode
  const [activeMode, setActiveMode] = useState<'mmToInch' | 'inchToMm'>('mmToInch');

  // Input states
  const [mmValue, setMmValue] = useState<string>('25.4');
  const [inchValue, setInchValue] = useState<string>('1.0');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  // Parse numerical values
  const currentMm = parseFloat(mmValue) || 0;
  const currentInch = parseFloat(inchValue) || 0;

  // Real-time calculated values
  const calculatedInchFromMm = currentMm / 25.4;
  const calculatedMmFromInch = currentInch * 25.4;

  const activeCalculatedInch = activeMode === 'mmToInch' ? calculatedInchFromMm : currentInch;
  const activeCalculatedMm = activeMode === 'mmToInch' ? currentMm : calculatedMmFromInch;

  const fractionInfo = getClosestFraction(activeCalculatedInch);
  const microns = Math.round(activeCalculatedMm * 1000);
  const thouMil = Math.round(activeCalculatedInch * 10000) / 10; // in mils with 1 decimal

  // Standard imperial presets for bearing shafts
  const imperialPresets = [
    { label: '1/4"', inch: 0.25, mm: 6.35 },
    { label: '3/8"', inch: 0.375, mm: 9.525 },
    { label: '1/2"', inch: 0.5, mm: 12.7 },
    { label: '5/8"', inch: 0.625, mm: 15.875 },
    { label: '3/4"', inch: 0.75, mm: 19.05 },
    { label: '1"', inch: 1.0, mm: 25.4 },
    { label: '1-1/4"', inch: 1.25, mm: 31.75 },
    { label: '1-1/2"', inch: 1.5, mm: 38.1 },
    { label: '1-3/4"', inch: 1.75, mm: 44.45 },
    { label: '2"', inch: 2.0, mm: 50.8 },
    { label: '2-1/2"', inch: 2.5, mm: 63.5 },
    { label: '3"', inch: 3.0, mm: 76.2 },
  ];

  // Standard metric bearing bore presets
  const metricPresets = [
    { label: 'Ø 12 mm', mm: 12, code: '01' },
    { label: 'Ø 15 mm', mm: 15, code: '02' },
    { label: 'Ø 17 mm', mm: 17, code: '03' },
    { label: 'Ø 20 mm', mm: 20, code: '04' },
    { label: 'Ø 25 mm', mm: 25, code: '05' },
    { label: 'Ø 30 mm', mm: 30, code: '06' },
    { label: 'Ø 35 mm', mm: 35, code: '07' },
    { label: 'Ø 40 mm', mm: 40, code: '08' },
    { label: 'Ø 45 mm', mm: 45, code: '09' },
    { label: 'Ø 50 mm', mm: 50, code: '10' },
    { label: 'Ø 60 mm', mm: 60, code: '12' },
    { label: 'Ø 75 mm', mm: 75, code: '15' },
  ];

  // Handlers for synchronizing inputs
  const handleMmChange = (val: string) => {
    setMmValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setInchValue((num / 25.4).toFixed(4).replace(/\.?0+$/, ''));
    }
  };

  const handleInchChange = (val: string) => {
    setInchValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMmValue((num * 25.4).toFixed(3).replace(/\.?0+$/, ''));
    }
  };

  const selectImperialPreset = (preset: { inch: number; mm: number }) => {
    setInchValue(preset.inch.toString());
    setMmValue(preset.mm.toString());
    setActiveMode('inchToMm');
  };

  const selectMetricPreset = (preset: { mm: number }) => {
    setMmValue(preset.mm.toString());
    setInchValue((preset.mm / 25.4).toFixed(4).replace(/\.?0+$/, ''));
    setActiveMode('mmToInch');
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplyBore = () => {
    if (onApplyBoreToCalculator && activeCalculatedMm > 0) {
      onApplyBoreToCalculator(Math.round(activeCalculatedMm));
      setAppliedNotification(true);
      setTimeout(() => setAppliedNotification(false), 2500);
    }
  };

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-[0_20px_50px_-10px_rgba(35,44,134,0.08),inset_0_1px_1px_rgba(255,255,255,1)]">
      
      {/* Card Header with Icon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-[#232c86] border border-blue-500/10 flex-shrink-0">
            <Ruler className="w-5 h-5 text-[#232c86]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {u.toolTitle}
            </h3>
            <span className="text-xs text-slate-500 block mt-0.5">
              {u.toolSubtitle}
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-2xl border border-white/80 backdrop-blur-md self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode('mmToInch')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'mmToInch'
                ? 'bg-[#232c86] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>mm ➔ Inch</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('inchToMm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'inchToMm'
                ? 'bg-[#232c86] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Inch ➔ mm</span>
          </button>
        </div>
      </div>

      {/* Main Dual Conversion Input Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        
        {/* Metric Input / Output Box */}
        <div className={`p-4 sm:p-5 rounded-2xl transition-all border ${
          activeMode === 'mmToInch'
            ? 'bg-blue-50/70 border-blue-200/80 ring-2 ring-[#232c86]/20'
            : 'bg-slate-100/60 border-white/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#232c86]" />
              {u.mmInputLabel}
            </label>
            <span className="text-[10px] font-mono-spec font-semibold px-2 py-0.5 rounded-md bg-white text-[#232c86] border border-blue-100 shadow-xs">
              ISO Metric
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="number"
              step="0.01"
              min="0"
              value={activeMode === 'mmToInch' ? mmValue : activeCalculatedMm.toFixed(3).replace(/\.?0+$/, '')}
              onChange={(e) => {
                if (activeMode !== 'mmToInch') setActiveMode('mmToInch');
                handleMmChange(e.target.value);
              }}
              onFocus={() => setActiveMode('mmToInch')}
              className="w-full text-xl sm:text-2xl font-black font-mono-spec text-slate-900 bg-white/90 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#232c86] focus:border-transparent transition-all shadow-xs"
              placeholder="e.g. 25.4"
            />
            <span className="absolute left-3.5 sm:left-4 rtl:left-auto rtl:right-auto rtl:left-3.5 font-bold font-mono-spec text-slate-400 text-sm pointer-events-none">
              mm
            </span>
          </div>

          {/* Stepped +/- helper buttons */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <button
              type="button"
              onClick={() => {
                const n = Math.max(0, currentMm - 1);
                handleMmChange(n.toString());
              }}
              className="px-2.5 py-1 text-[11px] font-mono-spec font-bold rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              -1 mm
            </button>
            <button
              type="button"
              onClick={() => {
                const n = currentMm + 1;
                handleMmChange(n.toString());
              }}
              className="px-2.5 py-1 text-[11px] font-mono-spec font-bold rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              +1 mm
            </button>
            <button
              type="button"
              onClick={() => {
                const n = currentMm + 5;
                handleMmChange(n.toString());
              }}
              className="px-2.5 py-1 text-[11px] font-mono-spec font-bold rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              +5 mm
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(`${activeCalculatedMm.toFixed(3)} mm`, 'mm')}
              className="ml-auto p-1.5 text-slate-400 hover:text-[#232c86] rounded-lg hover:bg-white transition-all cursor-pointer"
              title="Copy mm"
            >
              {copiedField === 'mm' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Imperial Input / Output Box */}
        <div className={`p-4 sm:p-5 rounded-2xl transition-all border ${
          activeMode === 'inchToMm'
            ? 'bg-amber-50/70 border-amber-200/80 ring-2 ring-amber-500/20'
            : 'bg-slate-100/60 border-white/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              {u.inchInputLabel}
            </label>
            <span className="text-[10px] font-mono-spec font-semibold px-2 py-0.5 rounded-md bg-white text-amber-800 border border-amber-100 shadow-xs">
              ANSI / Imperial
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="number"
              step="0.0001"
              min="0"
              value={activeMode === 'inchToMm' ? inchValue : activeCalculatedInch.toFixed(4).replace(/\.?0+$/, '')}
              onChange={(e) => {
                if (activeMode !== 'inchToMm') setActiveMode('inchToMm');
                handleInchChange(e.target.value);
              }}
              onFocus={() => setActiveMode('inchToMm')}
              className="w-full text-xl sm:text-2xl font-black font-mono-spec text-slate-900 bg-white/90 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-xs"
              placeholder="e.g. 1.0"
            />
            <span className="absolute left-3.5 sm:left-4 rtl:left-auto rtl:right-auto rtl:left-3.5 font-bold font-mono-spec text-slate-400 text-sm pointer-events-none">
              inch (in)
            </span>
          </div>

          {/* Stepped +/- helper buttons */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <button
              type="button"
              onClick={() => {
                const n = Math.max(0, currentInch - 0.125);
                handleInchChange(n.toFixed(4).replace(/\.?0+$/, ''));
              }}
              className="px-2.5 py-1 text-[11px] font-mono-spec font-bold rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              -1/8"
            </button>
            <button
              type="button"
              onClick={() => {
                const n = currentInch + 0.125;
                handleInchChange(n.toFixed(4).replace(/\.?0+$/, ''));
              }}
              className="px-2.5 py-1 text-[11px] font-mono-spec font-bold rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              +1/8"
            </button>
            <button
              type="button"
              onClick={() => {
                const n = currentInch + 0.25;
                handleInchChange(n.toFixed(4).replace(/\.?0+$/, ''));
              }}
              className="px-2.5 py-1 text-[11px] font-mono-spec font-bold rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              +1/4"
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(`${activeCalculatedInch.toFixed(4)}"`, 'inch')}
              className="ml-auto p-1.5 text-slate-400 hover:text-amber-700 rounded-lg hover:bg-white transition-all cursor-pointer"
              title="Copy Inch"
            >
              {copiedField === 'inch' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

      </div>

      {/* Engineering Fractional Output & Telemetry Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Box 1: Nearest Standard Fraction */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>{u.fractionLabel}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(fractionInfo.display, 'fraction')}
              className="text-slate-400 hover:text-[#232c86]"
              title="Copy Fraction"
            >
              {copiedField === 'fraction' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-2xl font-black font-mono-spec text-[#232c86] tracking-tight py-1">
            {fractionInfo.display}
          </div>
          <div className="text-[11px] font-mono-spec text-slate-500 flex items-center gap-1">
            <span>{u.deviation}</span>
            <span className={`font-bold ${Math.abs(fractionInfo.deviationThou) > 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {fractionInfo.deviationThou >= 0 ? `+${fractionInfo.deviationThou}` : fractionInfo.deviationThou} mil
            </span>
          </div>
        </div>

        {/* Box 2: Decimal Inches */}
        <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-md flex flex-col justify-between shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            {u.exactInches}
          </div>
          <div className="text-xl font-black font-mono-spec text-slate-900 tracking-tight py-1">
            {activeCalculatedInch.toFixed(4)} in
          </div>
          <div className="text-[11px] font-mono-spec text-slate-500">
            {thouMil.toLocaleString()} {language === 'fa' ? 'هزارم اینچ (thou)' : 'thou / mil'}
          </div>
        </div>

        {/* Box 3: Exact Millimeters & Microns */}
        <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 backdrop-blur-md flex flex-col justify-between shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            {u.exactMm}
          </div>
          <div className="text-xl font-black font-mono-spec text-slate-900 tracking-tight py-1">
            {activeCalculatedMm.toFixed(3)} mm
          </div>
          <div className="text-[11px] font-mono-spec text-slate-500">
            {microns.toLocaleString()} μm (microns)
          </div>
        </div>

        {/* Box 4: Action / Apply to Clearance Calculator */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mb-1">
            <Gauge className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'fa' ? 'انتقال به محاسبه‌گر' : 'Clearance Calculator'}</span>
          </div>
          
          <button
            type="button"
            onClick={handleApplyBore}
            disabled={!onApplyBoreToCalculator || activeCalculatedMm <= 0}
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {appliedNotification ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>{language === 'fa' ? 'اعمال شد!' : 'Applied!'}</span>
              </>
            ) : (
              <>
                <Calculator className="w-3.5 h-3.5" />
                <span>{language === 'fa' ? `انتخاب Ø ${Math.round(activeCalculatedMm)}mm در لقی` : `Set Ø ${Math.round(activeCalculatedMm)}mm`}</span>
              </>
            )}
          </button>

          <div className="text-[10px] text-emerald-700/80 font-medium text-center mt-1">
            {language === 'fa' ? 'تنظیم فوری قطر شفت در محاسبه‌گر لقی' : 'Sync shaft bore with ISO 5753 tool'}
          </div>
        </div>

      </div>

      {/* Quick Standard Bearing & Shaft Presets */}
      <div className="space-y-3 pt-2">
        
        {/* Imperial Presets Row */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{u.quickSizesTitle}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {imperialPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => selectImperialPreset(preset)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-mono-spec font-bold bg-white/80 hover:bg-[#232c86] hover:text-white border border-slate-200 hover:border-[#232c86] text-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title={`${preset.label} = ${preset.mm} mm`}
              >
                <span>{preset.label}</span>
                <span className="text-[9.5px] opacity-75 ml-1 rtl:mr-1">({preset.mm}mm)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Metric Presets Row */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
            <Layers className="w-3.5 h-3.5 text-[#232c86]" />
            <span>{language === 'fa' ? 'سایزهای استاندارد سوراخ بلبرینگ‌های متریک (Bore Codes):' : 'Standard Metric Bearing Bore Sizes (ISO):'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {metricPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => selectMetricPreset(preset)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-mono-spec font-bold bg-white/80 hover:bg-[#232c86] hover:text-white border border-slate-200 hover:border-[#232c86] text-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title={`${preset.label} (Code ${preset.code})`}
              >
                <span>{preset.label}</span>
                <span className="text-[9px] opacity-75 ml-1 rtl:mr-1">/ کد {preset.code}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Engineering Formula & Standards Footer */}
      <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-white text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#232c86] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 block">
            {u.formulaTitle}
          </span>
          <p className="text-[11px] text-slate-600 font-mono-spec leading-relaxed">
            {u.formulaText}
          </p>
        </div>
      </div>

    </div>
  );
};
