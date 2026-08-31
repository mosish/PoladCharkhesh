import React, { useState, useMemo } from 'react';
import { 
  Thermometer, 
  Activity, 
  RotateCw, 
  AlertTriangle, 
  Info, 
  Sliders, 
  Wind, 
  Droplet, 
  Zap, 
  ShieldCheck, 
  BarChart3,
  Gauge
} from 'lucide-react';
import { Language, BearingProduct } from '../types';
import { bearingProducts } from '../data/products';

interface BearingThermalEstimatorProps {
  language: Language;
  embedded?: boolean;
}

type LubricationMode = 'grease' | 'oil';
type LoadLevel = 'light' | 'normal' | 'heavy';
type CoolingCondition = 'natural' | 'forced';

export const BearingThermalEstimator: React.FC<BearingThermalEstimatorProps> = ({ language, embedded = false }) => {
  // Filter out seals and lubricants to focus on rolling bearings and units
  const availableBearings = useMemo(() => {
    return bearingProducts.filter(p => p.category !== 'seal' && p.category !== 'lubricant' && p.speedGreaseRpm > 0);
  }, []);

  const [selectedBearingId, setSelectedBearingId] = useState<string>(
    availableBearings[0]?.id || 'pc-6204-2rs'
  );

  const currentBearing = useMemo(() => {
    return availableBearings.find(b => b.id === selectedBearingId) || availableBearings[0];
  }, [availableBearings, selectedBearingId]);

  // Operational Assumptions & Condition States
  const [lubrication, setLubrication] = useState<LubricationMode>('grease');
  const [ambientTemp, setAmbientTemp] = useState<number>(20); // °C
  const [loadLevel, setLoadLevel] = useState<LoadLevel>('normal');
  const [cooling, setCooling] = useState<CoolingCondition>('natural');

  // Maximum Speed Limit according to lubrication mode from authoritative catalog data
  const maxApplicableSpeed = useMemo(() => {
    if (lubrication === 'oil' && currentBearing.speedOilRpm > 0) {
      return currentBearing.speedOilRpm;
    }
    return currentBearing.speedGreaseRpm;
  }, [currentBearing, lubrication]);

  // Current Operating RPM state (default to 50% of limiting speed)
  const [currentRpm, setCurrentRpm] = useState<number>(() => {
    const base = currentBearing.speedGreaseRpm;
    return Math.round((base * 0.5) / 100) * 100 || 3000;
  });

  // Keep RPM within bounds when bearing changes
  const activeRpm = Math.min(currentRpm, Math.round(maxApplicableSpeed * 1.1));

  // Low Speed Reference point (e.g. 15% of limiting speed or 1000 RPM minimum)
  const lowSpeedRpm = useMemo(() => {
    return Math.max(500, Math.round((maxApplicableSpeed * 0.15) / 100) * 100);
  }, [maxApplicableSpeed]);

  // Indicative Thermal Model:
  // Friction power: Q_f ~ (speed/n_lim)^1.4 * loadFactor * lubFactor * sizeFactor
  // Dissipation: k_diss * coolingFactor
  // Delta T = Q_f / Dissipation
  // T_est = Ambient + Delta T
  const calculateTemperature = (rpm: number, amb: number, lub: LubricationMode, load: LoadLevel, cool: CoolingCondition, bearing: BearingProduct) => {
    const limit = (lub === 'oil' && bearing.speedOilRpm > 0) ? bearing.speedOilRpm : bearing.speedGreaseRpm;
    const speedRatio = Math.max(0, rpm) / Math.max(100, limit);

    // Factors
    const loadMultiplier = load === 'light' ? 0.75 : load === 'heavy' ? 1.45 : 1.0;
    const lubMultiplier = lub === 'oil' ? 0.85 : 1.0; // Oil circulation carries away heat better
    const coolMultiplier = cool === 'forced' ? 0.65 : 1.0; // Forced air cooling increases dissipation
    
    // Bearing size envelope factor: mean diameter dm = (d + D) / 2
    const dm = (bearing.d + bearing.D) / 2;
    const sizeFactor = Math.pow(dm / 50, 0.25);

    // Non-linear power loss curve
    const deltaT = (18 * Math.pow(speedRatio, 1.45) * loadMultiplier * lubMultiplier * coolMultiplier * sizeFactor) + 
                   (28 * Math.pow(speedRatio, 2.2) * loadMultiplier * coolMultiplier);

    return Math.round((amb + deltaT) * 10) / 10;
  };

  const estimatedTempAtActiveRpm = useMemo(() => {
    return calculateTemperature(activeRpm, ambientTemp, lubrication, loadLevel, cooling, currentBearing);
  }, [activeRpm, ambientTemp, lubrication, loadLevel, cooling, currentBearing]);

  const estimatedTempAtLowSpeed = useMemo(() => {
    return calculateTemperature(lowSpeedRpm, ambientTemp, lubrication, loadLevel, cooling, currentBearing);
  }, [lowSpeedRpm, ambientTemp, lubrication, loadLevel, cooling, currentBearing]);

  const estimatedTempAtMaxSpeed = useMemo(() => {
    return calculateTemperature(maxApplicableSpeed, ambientTemp, lubrication, loadLevel, cooling, currentBearing);
  }, [maxApplicableSpeed, ambientTemp, lubrication, loadLevel, cooling, currentBearing]);

  // Temperature Color Hierarchy
  const getTempColorStyle = (temp: number) => {
    if (temp < 45) {
      return {
        text: 'text-sky-600',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        bar: 'bg-sky-500',
        labelFa: 'دمای خنک و پایدار (Cool / Stable)',
        labelEn: 'Cool & Stable Region',
      };
    }
    if (temp < 65) {
      return {
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        bar: 'bg-emerald-500',
        labelFa: 'دمای کاری بهینه (Nominal)',
        labelEn: 'Optimal Operating Region',
      };
    }
    if (temp < 85) {
      return {
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        bar: 'bg-amber-500',
        labelFa: 'دمای گرم نرمال (Warm)',
        labelEn: 'Warm Operating Region',
      };
    }
    if (temp < 100) {
      return {
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        bar: 'bg-orange-500',
        labelFa: 'دمای بالا - نیازمند پایش (Elevated)',
        labelEn: 'Elevated Temperature Region',
      };
    }
    return {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      bar: 'bg-red-600',
      labelFa: 'دمای بحرانی روانکار (Critical Hot)',
      labelEn: 'Critical Lubricant Thermal Limit',
    };
  };

  const activeColor = getTempColorStyle(estimatedTempAtActiveRpm);

  // Generate Data Points for RPM vs. Temperature Graph
  const graphPoints = useMemo(() => {
    const pointsCount = 20;
    const maxGraphRpm = Math.round(maxApplicableSpeed * 1.05);
    const step = maxGraphRpm / pointsCount;
    const data: { rpm: number; temp: number }[] = [];

    for (let i = 0; i <= pointsCount; i++) {
      const rpmVal = Math.round(i * step);
      const tempVal = calculateTemperature(rpmVal, ambientTemp, lubrication, loadLevel, cooling, currentBearing);
      data.push({ rpm: rpmVal, temp: tempVal });
    }
    return data;
  }, [maxApplicableSpeed, ambientTemp, lubrication, loadLevel, cooling, currentBearing]);

  // Graph SVG coordinates mapping
  const graphWidth = 480;
  const graphHeight = 200;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const minTempGraph = Math.floor(ambientTemp / 10) * 10;
  const maxTempGraph = 120;
  const maxRpmGraph = Math.round(maxApplicableSpeed * 1.05);

  const getX = (rpm: number) => {
    return padding.left + (rpm / maxRpmGraph) * (graphWidth - padding.left - padding.right);
  };

  const getY = (temp: number) => {
    const clampedTemp = Math.min(Math.max(temp, minTempGraph), maxTempGraph);
    const ratio = (clampedTemp - minTempGraph) / (maxTempGraph - minTempGraph);
    return graphHeight - padding.bottom - ratio * (graphHeight - padding.top - padding.bottom);
  };

  const pathD = useMemo(() => {
    if (graphPoints.length === 0) return '';
    return graphPoints.reduce((acc, pt, index) => {
      const x = getX(pt.rpm);
      const y = getY(pt.temp);
      return index === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  }, [graphPoints]);

  const activePointX = getX(activeRpm);
  const activePointY = getY(estimatedTempAtActiveRpm);

  const content = (
    <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-white/80 shadow-[0_16px_40px_-10px_rgba(35,44,134,0.1)]">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Product Selector & Assumptions Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* 1. Bearing Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-[#232c86]" />
                  {language === 'fa' ? 'انتخاب مدل بیرینگ از کاتالوگ:' : 'Select Catalog Bearing Model:'}
                </span>
                <span className="text-[10px] font-mono-spec font-semibold text-slate-500">
                  {currentBearing.code}
                </span>
              </label>

              <select
                value={selectedBearingId}
                onChange={(e) => {
                  setSelectedBearingId(e.target.value);
                  const selected = availableBearings.find(b => b.id === e.target.value);
                  if (selected) {
                    setCurrentRpm(Math.round((selected.speedGreaseRpm * 0.5) / 100) * 100 || 3000);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#232c86] focus:border-transparent outline-none transition-all shadow-sm"
              >
                {availableBearings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {language === 'fa' ? b.nameFa : b.nameEn} (Ø{b.d}×Ø{b.D}×{b.B}mm)
                  </option>
                ))}
              </select>

              {/* Bearing Key Metrics Strip */}
              <div className="mt-2 grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-100/80 text-[11px] font-mono-spec text-slate-700 border border-slate-200/60">
                <div className="flex flex-col text-center">
                  <span className="text-[9.5px] text-slate-500">{language === 'fa' ? 'ابعاد (d×D×B)' : 'Dim (d×D×B)'}</span>
                  <span className="font-bold">{currentBearing.d}×{currentBearing.D}×{currentBearing.B} mm</span>
                </div>
                <div className="flex flex-col text-center border-x border-slate-200">
                  <span className="text-[9.5px] text-slate-500">{language === 'fa' ? 'بار دینامیک Cr' : 'Dyn Load Cr'}</span>
                  <span className="font-bold text-[#232c86]">{currentBearing.crKn} kN</span>
                </div>
                <div className="flex flex-col text-center">
                  <span className="text-[9.5px] text-slate-500">{language === 'fa' ? 'حد دور گریس' : 'Grease Limit'}</span>
                  <span className="font-bold text-emerald-700">{currentBearing.speedGreaseRpm.toLocaleString()} RPM</span>
                </div>
              </div>
            </div>

            {/* 2. RPM Slider Controller */}
            <div className="p-4 rounded-2xl bg-white/90 border border-blue-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <RotateCw className="w-4 h-4 text-[#232c86]" />
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'fa' ? 'سرعت دورانی جاری (RPM):' : 'Current Operating Speed:'}
                  </span>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200">
                  <input
                    type="number"
                    min={100}
                    max={Math.round(maxApplicableSpeed * 1.1)}
                    step={100}
                    value={activeRpm}
                    onChange={(e) => setCurrentRpm(Number(e.target.value))}
                    className="w-20 bg-transparent text-end text-sm font-black font-mono-spec text-[#232c86] outline-none"
                  />
                  <span className="text-[11px] font-mono-spec font-bold text-slate-500">RPM</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={200}
                max={maxApplicableSpeed}
                step={100}
                value={activeRpm}
                onChange={(e) => setCurrentRpm(Number(e.target.value))}
                className="w-full accent-[#232c86] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />

              <div className="flex items-center justify-between text-[10px] font-mono-spec text-slate-500">
                <span>Min: 200 RPM</span>
                <span className="font-bold text-amber-700">
                  {language === 'fa' ? 'حد مجاز کاتالوگ:' : 'Limiting:'} {maxApplicableSpeed.toLocaleString()} RPM
                </span>
              </div>
            </div>

            {/* 3. Operational Assumptions Grid */}
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sliders className="w-4 h-4 text-slate-600" />
                <span>{language === 'fa' ? 'شرایط و مفروضات کاری:' : 'Operational Assumptions:'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {/* Lubrication */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-blue-500" />
                    {language === 'fa' ? 'نوع روانکاری:' : 'Lubrication:'}
                  </span>
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200/60 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLubrication('grease')}
                      className={`py-1 rounded-md text-[10.5px] font-bold transition-all ${
                        lubrication === 'grease' ? 'bg-white text-[#232c86] shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      {language === 'fa' ? 'گریس' : 'Grease'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLubrication('oil')}
                      className={`py-1 rounded-md text-[10.5px] font-bold transition-all ${
                        lubrication === 'oil' ? 'bg-white text-[#232c86] shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      {language === 'fa' ? 'روغن' : 'Oil'}
                    </button>
                  </div>
                </div>

                {/* Ambient Temp */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-red-500" />
                    {language === 'fa' ? 'دمای محیط:' : 'Ambient Temp:'}
                  </span>
                  <div className="flex items-center justify-between p-1 bg-white rounded-lg border border-slate-200">
                    <input 
                      type="range" 
                      min={10} 
                      max={45} 
                      value={ambientTemp}
                      onChange={(e) => setAmbientTemp(Number(e.target.value))}
                      className="w-16 accent-[#232c86] h-1.5"
                    />
                    <span className="text-[11px] font-mono-spec font-bold text-slate-800">{ambientTemp}°C</span>
                  </div>
                </div>

                {/* Load Condition */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {language === 'fa' ? 'میزان بار شعاعی:' : 'Radial Load:'}
                  </span>
                  <select
                    value={loadLevel}
                    onChange={(e) => setLoadLevel(e.target.value as LoadLevel)}
                    className="w-full p-1.5 rounded-lg bg-white border border-slate-200 text-[10.5px] font-bold text-slate-700"
                  >
                    <option value="light">{language === 'fa' ? 'سبک (5% Cr)' : 'Light (5% Cr)'}</option>
                    <option value="normal">{language === 'fa' ? 'متوسط (10% Cr)' : 'Normal (10% Cr)'}</option>
                    <option value="heavy">{language === 'fa' ? 'سنگین (25% Cr)' : 'Heavy (25% Cr)'}</option>
                  </select>
                </div>

                {/* Heat Dissipation */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-teal-500" />
                    {language === 'fa' ? 'دفع حرارت:' : 'Heat Dissipation:'}
                  </span>
                  <select
                    value={cooling}
                    onChange={(e) => setCooling(e.target.value as CoolingCondition)}
                    className="w-full p-1.5 rounded-lg bg-white border border-slate-200 text-[10.5px] font-bold text-slate-700"
                  >
                    <option value="natural">{language === 'fa' ? 'طبیعی (Natural)' : 'Natural Free Air'}</option>
                    <option value="forced">{language === 'fa' ? 'خنک‌کاری اجباری (Forced)' : 'Forced Ventilation'}</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Thermal Readouts & RPM vs Temp Curve Graph (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 3 Reference Point Cards (Low Speed, Current Operating, Maximum Reference Speed) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Reference 1: Low Speed */}
              <div className="p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[10.5px] font-bold text-slate-500">
                  {language === 'fa' ? 'مرجع دور پایین (Low Speed):' : 'Low Speed Reference:'}
                </span>
                <div className="my-1">
                  <span className="text-xs font-mono-spec font-bold text-slate-700">{lowSpeedRpm.toLocaleString()} RPM</span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9.5px] text-slate-400">{language === 'fa' ? 'دمای تخمینی:' : 'Est. Temp:'}</span>
                  <span className="text-xs font-mono-spec font-black text-sky-600">{estimatedTempAtLowSpeed} °C</span>
                </div>
              </div>

              {/* Reference 2: Current Operating Point (Prominent) */}
              <div className={`p-3 rounded-2xl ${activeColor.bg} border-2 ${activeColor.border} shadow-sm flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black text-slate-800">
                    {language === 'fa' ? 'سرعت کاری انتخابی:' : 'Operating Speed:'}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${activeColor.bar} animate-pulse`} />
                </div>
                <div className="my-1 flex items-baseline gap-1">
                  <span className="text-lg font-mono-spec font-black text-slate-900">{activeRpm.toLocaleString()}</span>
                  <span className="text-[10px] font-mono-spec font-bold text-slate-500">RPM</span>
                </div>
                <div className="pt-1.5 border-t border-black/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600">{language === 'fa' ? 'دمای تخمینی بیرینگ:' : 'Est. Bearing Temp:'}</span>
                  <span className={`text-base font-mono-spec font-black ${activeColor.text}`}>
                    {estimatedTempAtActiveRpm} °C
                  </span>
                </div>
              </div>

              {/* Reference 3: Maximum Limiting Speed */}
              <div className="p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[10.5px] font-bold text-slate-500">
                  {language === 'fa' ? 'حداکثر سرعت مجاز سازنده:' : 'Max Catalog Limit:'}
                </span>
                <div className="my-1">
                  <span className="text-xs font-mono-spec font-bold text-amber-800">{maxApplicableSpeed.toLocaleString()} RPM</span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9.5px] text-slate-400">{language === 'fa' ? 'دمای تخمینی:' : 'Est. Temp:'}</span>
                  <span className="text-xs font-mono-spec font-black text-orange-600">{estimatedTempAtMaxSpeed} °C</span>
                </div>
              </div>

            </div>

            {/* Interactive RPM vs Estimated Temperature Graph */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#232c86]" />
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'fa' ? 'منحنی مشخصه سرعت (RPM) بر حسب دمای تخمینی (°C)' : 'RPM vs. Indicative Temperature Curve'}
                  </span>
                </div>
                <span className="text-[10px] font-mono-spec font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {activeColor.labelFa}
                </span>
              </div>

              {/* SVG Graph Viewport */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                  className="w-full h-44 sm:h-52 select-none"
                >
                  <defs>
                    {/* Temperature Area Fill Gradient */}
                    <linearGradient id="tempCurveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ea580c" stopOpacity="0.3" />
                      <stop offset="60%" stopColor="#0284c7" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines (Temperature °C) */}
                  {[30, 60, 90, 120].map((tempVal) => {
                    const y = getY(tempVal);
                    return (
                      <g key={tempVal}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={graphWidth - padding.right}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray={tempVal === 90 ? '4 2' : 'none'}
                        />
                        <text
                          x={padding.left - 6}
                          y={y + 3}
                          fontSize="9"
                          fontFamily="JetBrains Mono, monospace"
                          fill="#64748b"
                          textAnchor="end"
                        >
                          {tempVal}°C
                        </text>
                      </g>
                    );
                  })}

                  {/* Thermal Danger Threshold Shading (> 90°C) */}
                  <rect
                    x={padding.left}
                    y={getY(120)}
                    width={graphWidth - padding.left - padding.right}
                    height={getY(90) - getY(120)}
                    fill="#fee2e2"
                    fillOpacity="0.35"
                  />
                  <text
                    x={graphWidth - padding.right - 5}
                    y={getY(110)}
                    fontSize="8.5"
                    fontFamily="sans-serif"
                    fill="#b91c1c"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {language === 'fa' ? 'منطقه نیازمند گریس دما بالا (>90°C)' : 'High Thermal Zone (>90°C)'}
                  </text>

                  {/* Limiting Speed Vertical Reference Line */}
                  <line
                    x1={getX(maxApplicableSpeed)}
                    y1={padding.top}
                    x2={getX(maxApplicableSpeed)}
                    y2={graphHeight - padding.bottom}
                    stroke="#dc2626"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                  <text
                    x={getX(maxApplicableSpeed)}
                    y={padding.top + 10}
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                    fill="#dc2626"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Limit: {maxApplicableSpeed}
                  </text>

                  {/* Curve Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Active Operating Point Marker */}
                  <g>
                    {/* Vertical guideline */}
                    <line
                      x1={activePointX}
                      y1={activePointY}
                      x2={activePointX}
                      y2={graphHeight - padding.bottom}
                      stroke="#232c86"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle cx={activePointX} cy={activePointY} r="6" fill="#232c86" stroke="#ffffff" strokeWidth="2" />
                    <circle cx={activePointX} cy={activePointY} r="10" fill="#232c86" fillOpacity="0.2" className="animate-ping" />

                    {/* Active point text label */}
                    <rect
                      x={Math.min(activePointX + 8, graphWidth - 110)}
                      y={Math.max(activePointY - 26, 8)}
                      width="90"
                      height="20"
                      rx="4"
                      fill="#0f172a"
                    />
                    <text
                      x={Math.min(activePointX + 53, graphWidth - 65)}
                      y={Math.max(activePointY - 13, 21)}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fill="#ffffff"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {activeRpm} RPM | {estimatedTempAtActiveRpm}°C
                    </text>
                  </g>

                  {/* X-axis Labels */}
                  <line
                    x1={padding.left}
                    y1={graphHeight - padding.bottom}
                    x2={graphWidth - padding.right}
                    y2={graphHeight - padding.bottom}
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                  />
                  {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
                    const rpmVal = Math.round(maxApplicableSpeed * ratio);
                    const x = getX(rpmVal);
                    return (
                      <g key={ratio}>
                        <line x1={x} y1={graphHeight - padding.bottom} x2={x} y2={graphHeight - padding.bottom + 4} stroke="#94a3b8" />
                        <text
                          x={x}
                          y={graphHeight - padding.bottom + 14}
                          fontSize="8.5"
                          fontFamily="JetBrains Mono, monospace"
                          fill="#64748b"
                          textAnchor="middle"
                        >
                          {rpmVal.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Axis Titles */}
                  <text
                    x={graphWidth / 2}
                    y={graphHeight - 6}
                    fontSize="9.5"
                    fontWeight="bold"
                    fill="#475569"
                    textAnchor="middle"
                  >
                    {language === 'fa' ? 'سرعت دورانی (RPM)' : 'Rotational Speed (RPM)'}
                  </text>
                </svg>
              </div>

              {/* Thermal Scale Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                <span className="font-bold">{language === 'fa' ? 'طیف دمای کاری:' : 'Thermal Legend:'}</span>
                <div className="flex items-center gap-1 font-mono-spec">
                  <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">&lt;45°C</span>
                  <span>→</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">45-65°C</span>
                  <span>→</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">65-85°C</span>
                  <span>→</span>
                  <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">85-100°C</span>
                  <span>→</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold">&gt;100°C</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Safety & Engineering Technical Disclaimer (Mandated in Part 12) */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed">
            <p className="font-bold text-amber-950">
              {language === 'fa' ? 'سلب مسئولیت و یادداشت فنی مهندسی:' : 'Technical Engineering Disclaimer:'}
            </p>
            <p>
              {language === 'fa' 
                ? 'مقادیر نمایش‌داده‌شده تخمینی و جهت نمایش مهندسی هستند و به بار، روانکاری، دمای محیط، نحوه نصب، دفع حرارت و سایر شرایط کاری وابسته‏اند. برای کاربردهای حساس، انتخاب نهایی بیرینگ و حدود کاری باید بر اساس مستندات فنی سازنده بررسی شود.'
                : "Estimated values are indicative and depend on load, lubrication, ambient temperature, mounting, heat dissipation and other operating conditions. For critical applications, final bearing selection and operating limits must be verified against the manufacturer's technical documentation."}
            </p>
          </div>
        </div>

      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section id="thermal-estimator" className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#232c86] text-xs font-bold font-mono-spec mb-3 shadow-sm">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>{language === 'fa' ? 'ابزار محاسباتی و تحلیل مهندسی' : 'Engineering Calculation & Thermal Tool'}</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          {language === 'fa' ? 'برآورد سرعت و دمای کاری بیرینگ' : 'Bearing Speed & Thermal Estimator'}
        </h2>
        
        <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
          {language === 'fa' 
            ? 'بررسی رفتار حرارتی و حد مجاز دور بر دقیقه (RPM) بر اساس استاندارد ابعادی و مشخصات کاتالوگ سازندگان' 
            : 'Explore rotational velocity boundaries and indicative thermal trends based on verified manufacturer catalog parameters'}
        </p>
      </div>

      {content}
    </section>
  );
};
