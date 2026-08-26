import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCw, 
  Ruler, 
  Flame,
  Gauge,
  Thermometer,
  Disc,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Language } from '../types';

interface RealisticBearingViewerProps {
  language: Language;
}

export type SelectedBearingType = 
  | 'deep-groove'
  | 'tapered'
  | 'self-aligning'
  | 'spherical'
  | 'cylindrical'
  | 'needle'
  | 'angular-contact'
  | 'thrust'
  | 'housing'
  | 'seal';

export type PartCategory = 'all' | 'radial' | 'roller' | 'thrust-housing';

interface PartMeta {
  id: SelectedBearingType;
  category: 'radial' | 'roller' | 'thrust-housing';
  nameFa: string;
  nameEn: string;
  code: string;
  brand: string;
  standard: string;
  d: number; // inner bore (mm)
  D: number; // outer dia (mm)
  B: number; // width (mm)
  dm: number; // pitch circle dia (mm)
  rMin: number; // chamfer radius (mm)
  elementCount: number;
  contactAngle?: string;
  clearance?: string;
  loadTypeFa: string;
  loadTypeEn: string;
  tagFa: string;
  tagEn: string;
}

export const RealisticBearingViewer: React.FC<RealisticBearingViewerProps> = ({ language }) => {
  const [selectedType, setSelectedType] = useState<SelectedBearingType>('deep-groove');
  const [selectedCategory, setSelectedCategory] = useState<PartCategory>('all');
  const [viewMode, setViewMode] = useState<'3d' | 'dimensions' | 'thermal'>('3d');
  
  // Speed & Temperature Controls
  const [speedLevel, setSpeedLevel] = useState<number>(100); // 100 RPM default
  const [manualTempC, setManualTempC] = useState<number | null>(null);
  const [sealType, setSealType] = useState<'open' | '2rs' | '2z'>('open');
  
  // Kinematics Angles
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [elementSpinAngle, setElementSpinAngle] = useState<number>(0);
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Comprehensive Parts Registry with 10 Industrial Mechanical Power Transmission Components
  const allParts: PartMeta[] = [
    {
      id: 'deep-groove',
      category: 'radial',
      nameFa: 'بلبرینگ شیار عمیق',
      nameEn: 'Deep Groove Ball Bearing',
      code: '6208-2RS1/C3',
      brand: 'SKF EXPLORER',
      standard: 'DIN 625 / ISO 15',
      d: 40,
      D: 80,
      B: 18,
      dm: 60,
      rMin: 1.1,
      elementCount: 8,
      clearance: 'C3 (15-33 µm)',
      loadTypeFa: 'بار شعاعی + محوری دوطرفه',
      loadTypeEn: 'Radial + Dual Axial',
      tagFa: 'دور بالا و پرکاربرد',
      tagEn: 'High Speed Standard',
    },
    {
      id: 'tapered',
      category: 'roller',
      nameFa: 'رولبرینگ مخروطی',
      nameEn: 'Tapered Roller Bearing',
      code: '30208 J2/Q',
      brand: 'TIMKEN USA',
      standard: 'DIN 720 / ISO 355',
      d: 40,
      D: 80,
      B: 19.75,
      dm: 59.5,
      rMin: 1.5,
      elementCount: 10,
      contactAngle: '16°',
      clearance: 'Adjustable Preload',
      loadTypeFa: 'بار سنگین ترکیبی شعاعی/محوری یکطرفه',
      loadTypeEn: 'Heavy Combined Radial/Axial',
      tagFa: 'گیربکس و چرخ خودرو',
      tagEn: 'Gearbox & Axle',
    },
    {
      id: 'spherical',
      category: 'roller',
      nameFa: 'رولبرینگ بشکه‌ای (کروی)',
      nameEn: 'Spherical Roller Bearing',
      code: '22208 E/W33',
      brand: 'FAG GERMANY',
      standard: 'DIN 635-2 / ISO 15',
      d: 40,
      D: 80,
      B: 23,
      dm: 60,
      rMin: 1.1,
      elementCount: 12,
      contactAngle: '10.5°',
      clearance: 'CN Normal (30-45 µm)',
      loadTypeFa: 'فوق سنگین ضربه‌ای + خودتنظیم',
      loadTypeEn: 'Extreme Shock + Self-Aligning',
      tagFa: 'صنایع فولاد و معدن',
      tagEn: 'Steel & Mining',
    },
    {
      id: 'cylindrical',
      category: 'roller',
      nameFa: 'رولبرینگ استوانه‌ای',
      nameEn: 'Cylindrical Roller Bearing',
      code: 'NU 208 ECP',
      brand: 'SKF EXPLORER',
      standard: 'DIN 5412-1 / ISO 15',
      d: 40,
      D: 80,
      B: 18,
      dm: 60,
      rMin: 1.1,
      elementCount: 12,
      clearance: 'C3 (25-45 µm)',
      loadTypeFa: 'بار شعاعی بسیار بالا در سرعت زیاد',
      loadTypeEn: 'High-Speed Pure Radial',
      tagFa: 'الکتروموتورهای سنگین',
      tagEn: 'Heavy Motors',
    },
    {
      id: 'self-aligning',
      category: 'radial',
      nameFa: 'بلبرینگ خودتنظیم',
      nameEn: 'Self-Aligning Ball Bearing',
      code: '1208 EKTN9',
      brand: 'NSK JAPAN',
      standard: 'DIN 630 / ISO 15',
      d: 40,
      D: 80,
      B: 18,
      dm: 59,
      rMin: 1.1,
      elementCount: 14,
      clearance: 'CN (13-28 µm)',
      loadTypeFa: 'جبران انحراف زاویه‌ای شفت',
      loadTypeEn: 'Shaft Angular Deflection',
      tagFa: 'شفت‌های بلند و منعطف',
      tagEn: 'Long Deflecting Shafts',
    },
    {
      id: 'angular-contact',
      category: 'radial',
      nameFa: 'بلبرینگ تماس زاویه‌ای',
      nameEn: 'Angular Contact Ball Bearing',
      code: '7208 BECBP',
      brand: 'SKF GERMANY',
      standard: 'DIN 628-1 / ISO 15',
      d: 40,
      D: 80,
      B: 18,
      dm: 60,
      rMin: 1.1,
      elementCount: 10,
      contactAngle: '40°',
      clearance: 'CB Preload Set',
      loadTypeFa: 'بار محوری دقیق یکطرفه + سرعت بالا',
      loadTypeEn: 'Precision Axial + High RPM',
      tagFa: 'اسپیندل و پمپ سانتریفیوژ',
      tagEn: 'Spindle & Pumps',
    },
    {
      id: 'needle',
      category: 'roller',
      nameFa: 'رولبرینگ سوزنی',
      nameEn: 'Needle Roller Bearing',
      code: 'HK 4020 / RNA',
      brand: 'INA GERMANY',
      standard: 'DIN 618 / ISO 3245',
      d: 40,
      D: 47,
      B: 20,
      dm: 43.5,
      rMin: 0.8,
      elementCount: 18,
      clearance: 'CN (10-25 µm)',
      loadTypeFa: 'بار شعاعی فوق‌العاده در فضای باریک',
      loadTypeEn: 'High Radial / Minimal Radial Space',
      tagFa: 'فضای فشرده و گیربکس',
      tagEn: 'Compact Gearbox',
    },
    {
      id: 'thrust',
      category: 'thrust-housing',
      nameFa: 'بلبرینگ کف‌گرد (محوری)',
      nameEn: 'Thrust Ball Bearing',
      code: '51208',
      brand: 'FAG GERMANY',
      standard: 'DIN 711 / ISO 104',
      d: 40,
      D: 68,
      B: 19,
      dm: 54,
      rMin: 1.0,
      elementCount: 10,
      contactAngle: '90° (Axial)',
      loadTypeFa: 'بار خالص محوری تک‌جهته',
      loadTypeEn: 'Pure Axial Thrust',
      tagFa: 'جک هیدرولیک و کلاچ',
      tagEn: 'Jacks & Clutches',
    },
    {
      id: 'housing',
      category: 'thrust-housing',
      nameFa: 'یاتاقان و هوزینگ صنعتی',
      nameEn: 'Plummer Block Housing Unit',
      code: 'SNL 508 / UC 208',
      brand: 'SKF SWEDEN',
      standard: 'ISO 113 / DIN 736',
      d: 40,
      D: 125,
      B: 49.2,
      dm: 78,
      rMin: 2.0,
      elementCount: 8,
      loadTypeFa: 'نشیمنگاه بلبرینگ در خطوط انتقال',
      loadTypeEn: 'Heavy Duty Pillow Block Unit',
      tagFa: 'نوار نقاله و فن صنعتی',
      tagEn: 'Conveyor & Blowers',
    },
    {
      id: 'seal',
      category: 'thrust-housing',
      nameFa: 'کاسه‌نمد فنردار وایتون',
      nameEn: 'Rotary Shaft Oil Seal (FKM)',
      code: 'TC 40×68×10 FKM',
      brand: 'CORTECO ITALY',
      standard: 'DIN 3760 / ISO 6194',
      d: 40,
      D: 68,
      B: 10,
      dm: 54,
      rMin: 0.5,
      elementCount: 1,
      loadTypeFa: 'آب‌بندی روغن هیدرولیک و گریس',
      loadTypeEn: 'Rotary Fluid & Contaminant Sealing',
      tagFa: 'ضدحرارت تا ۲۰۰ درجه',
      tagEn: 'High Heat Viton',
    },
  ];

  // Filtered parts based on active level / category
  const filteredParts = allParts.filter(p => selectedCategory === 'all' || p.category === selectedCategory);
  const currentPart = allParts.find(b => b.id === selectedType) || allParts[0];

  // Dynamic Temperature Calculation based on speed or manual override
  const autoCalculatedTempC = Math.round(22 + (speedLevel / 6000) * 118);
  const currentTempC = manualTempC !== null ? manualTempC : autoCalculatedTempC;

  // Physical Thermal Heat-Tint & Blackbody Spectrum Modeling
  // 20°C-50°C: Steel room temp | 60°C-100°C: Straw Yellow | 110°C-160°C: Bronze/Purple | 170°C-240°C: Blue Temper | 250°C-350°C+: Incandescent Cherry/Fiery Orange
  const getThermalProfile = (temp: number) => {
    if (temp <= 45) {
      return {
        labelFa: 'دمای ایده‌آل (خنک)',
        labelEn: 'Optimal Cool Range',
        statusColor: 'emerald',
        heatRatio: 0,
        outerGlow: 'rgba(56, 189, 248, 0)',
        racewayColor: '#64748b',
        ballGlow: 'none',
        thermalGradient: ['#ffffff', '#f1f5f9', '#cbd5e1', '#64748b', '#0f172a']
      };
    } else if (temp <= 85) {
      const r = (temp - 45) / 40;
      return {
        labelFa: 'دمای کاری استاندارد',
        labelEn: 'Nominal Operating Temp',
        statusColor: 'sky',
        heatRatio: r * 0.25,
        outerGlow: `rgba(250, 204, 21, ${r * 0.2})`,
        racewayColor: '#ca8a04',
        ballGlow: 'rgba(253, 224, 71, 0.3)',
        thermalGradient: ['#fef9c3', '#fef08a', '#facc15', '#ca8a04', '#713f12']
      };
    } else if (temp <= 140) {
      const r = (temp - 85) / 55;
      return {
        labelFa: 'گرمایش اصطکاکی متوسط (زرد/برنز)',
        labelEn: 'Moderate Friction Heat (Bronze)',
        statusColor: 'amber',
        heatRatio: 0.25 + r * 0.25,
        outerGlow: `rgba(249, 115, 22, ${0.2 + r * 0.3})`,
        racewayColor: '#c2410c',
        ballGlow: 'rgba(251, 146, 60, 0.6)',
        thermalGradient: ['#ffedd5', '#fed7aa', '#fb923c', '#ea580c', '#7c2d12']
      };
    } else if (temp <= 220) {
      const r = (temp - 140) / 80;
      return {
        labelFa: 'تنش حرارتی شدید (اکسیداسیون بنفش/قرمز)',
        labelEn: 'Severe Thermal Stress (Heat-Tint)',
        statusColor: 'orange',
        heatRatio: 0.5 + r * 0.25,
        outerGlow: `rgba(239, 68, 68, ${0.4 + r * 0.3})`,
        racewayColor: '#b91c1c',
        ballGlow: 'rgba(239, 68, 68, 0.8)',
        thermalGradient: ['#fee2e2', '#fca5a5', '#ef4444', '#b91c1c', '#450a0a']
      };
    } else {
      const r = Math.min(1, (temp - 220) / 180);
      return {
        labelFa: 'بحران حرارتی / ریسک گریپاژ بیرینگ!',
        labelEn: 'Extreme Thermal Runaway / Seizure Risk!',
        statusColor: 'red',
        heatRatio: 0.75 + r * 0.25,
        outerGlow: `rgba(255, 70, 0, ${0.6 + r * 0.35})`,
        racewayColor: '#ff2200',
        ballGlow: 'rgba(255, 255, 255, 0.95)',
        thermalGradient: ['#ffffff', '#fef08a', '#ff6b00', '#dc2626', '#450a0a']
      };
    }
  };

  const thermalProfile = getThermalProfile(currentTempC);
  const isThermalActive = viewMode === 'thermal' || currentTempC > 70;

  // 60 FPS Kinematics Precision Animation Loop
  useEffect(() => {
    const animate = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // Kinematic Planetary Motion:
      // Inner ring rotates at speedLevel
      // Cage orbits at orbital speed approx (0.40 * speed)
      // Rolling elements spin around own axis approx (2.45 * speed)
      const orbitalSpeedDeg = (speedLevel * 360 / 60) * 0.40;
      const elementSpinSpeedDeg = (speedLevel * 360 / 60) * 2.45;

      setRotationAngle((prev) => (prev + orbitalSpeedDeg * delta) % 360);
      setElementSpinAngle((prev) => (prev + elementSpinSpeedDeg * delta) % 360);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [speedLevel]);

  // Horizontal Scroll navigation helpers
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -160, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 160, behavior: 'smooth' });
    }
  };

  // Speed Presets
  const speedPresets = [
    { label: '50', val: 50, descFa: 'بسیار آهسته', descEn: 'Ultra Low' },
    { label: '100', val: 100, descFa: 'آهسته (دقیق)', descEn: 'Inspection' },
    { label: '1500', val: 1500, descFa: 'استاندارد', descEn: 'Standard' },
    { label: '3000', val: 3000, descFa: 'دور بالا', descEn: 'High Speed' },
    { label: '6000', val: 6000, descFa: 'تنش حرارتی', descEn: 'Thermal Max' },
  ];

  return (
    <div 
      className="relative w-full max-w-sm sm:max-w-md glass-panel rounded-3xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden select-none transition-all shadow-[0_20px_50px_-10px_rgba(35,44,134,0.14),inset_0_1px_1px_rgba(255,255,255,1)] border border-white/80"
    >
      {/* Background Precision Engineering Coordinates */}
      <div className="absolute inset-0 engineering-grid-light opacity-35 pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Part Code, ISO Standard, Brand & Live Real-Time Telemetry */}
      <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-white/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              currentTempC > 180 ? 'bg-red-500' : currentTempC > 90 ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              currentTempC > 180 ? 'bg-red-600' : currentTempC > 90 ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
          </span>
          <div className="flex flex-col text-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-black font-mono-spec text-slate-900 tracking-wider">
                {currentPart.code}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono-spec font-bold bg-blue-50 text-[#232c86] border border-blue-200">
                {currentPart.brand}
              </span>
            </div>
            <span className="text-[9.5px] font-mono-spec text-slate-500 font-semibold">
              {currentPart.standard}
            </span>
          </div>
        </div>

        {/* Real Heat & Speed Telemetry Badges */}
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono-spec font-bold transition-all border ${
            currentTempC > 200
              ? 'bg-red-500/15 text-red-700 border-red-300 animate-pulse backdrop-blur-md' 
              : currentTempC > 90
              ? 'bg-amber-500/15 text-amber-800 border-amber-300 backdrop-blur-md' 
              : 'glass-pill text-slate-700'
          }`}>
            <Thermometer className={`w-3 h-3 ${currentTempC > 90 ? 'text-red-500' : 'text-slate-500'}`} />
            <span>{currentTempC}°C</span>
            {currentTempC > 90 && <Flame className="w-2.5 h-2.5 text-amber-500 ml-0.5 animate-bounce" />}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-full glass-pill text-[10px] font-mono-spec font-bold text-[#232c86]">
            <span>{speedLevel} RPM</span>
          </div>
        </div>
      </div>

      {/* Part Category Level Selector */}
      <div className="relative z-10 my-2 space-y-1.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 w-full">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex-shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'glass-pill-active text-[#232c86] font-extrabold shadow-sm'
                : 'glass-pill text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'fa' ? 'همه قطعات' : 'All Parts'} ({allParts.length})
          </button>
          <button
            onClick={() => setSelectedCategory('radial')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex-shrink-0 cursor-pointer ${
              selectedCategory === 'radial'
                ? 'glass-pill-active text-[#232c86] font-extrabold shadow-sm'
                : 'glass-pill text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'fa' ? 'بلبرینگ‌ها' : 'Ball Bearings'}
          </button>
          <button
            onClick={() => setSelectedCategory('roller')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex-shrink-0 cursor-pointer ${
              selectedCategory === 'roller'
                ? 'glass-pill-active text-[#232c86] font-extrabold shadow-sm'
                : 'glass-pill text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'fa' ? 'رولبرینگ‌ها' : 'Roller Bearings'}
          </button>
          <button
            onClick={() => setSelectedCategory('thrust-housing')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex-shrink-0 cursor-pointer ${
              selectedCategory === 'thrust-housing'
                ? 'glass-pill-active text-[#232c86] font-extrabold shadow-sm'
                : 'glass-pill text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'fa' ? 'یاتاقان و آب‌بند' : 'Housings & Seals'}
          </button>
        </div>

        {/* Dedicated Horizontal Scrollbar Container */}
        <div className="relative group">
          <button
            type="button"
            onClick={handleScrollLeft}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:text-[#232c86] hover:bg-white flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleScrollRight}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:text-[#232c86] hover:bg-white flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 active:scale-95"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-1.5 overflow-x-auto px-7 py-1 pb-2 scroll-smooth custom-horizontal-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#232c86 #e2e8f0',
            }}
          >
            {filteredParts.map((part) => {
              const isActive = selectedType === part.id;
              return (
                <button
                  key={part.id}
                  onClick={() => setSelectedType(part.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] transition-all flex items-center gap-1.5 flex-shrink-0 border cursor-pointer ${
                    isActive
                      ? 'bg-[#232c86] text-white border-[#232c86] shadow-sm font-bold scale-[1.02]'
                      : 'bg-white/75 backdrop-blur-md text-slate-700 hover:bg-white/95 hover:text-slate-900 border-white/90 font-medium'
                  }`}
                  title={`${part.code} - ${language === 'fa' ? part.nameFa : part.nameEn}`}
                >
                  <Disc className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '6s' }} />
                  <div className="flex flex-col text-start">
                    <span className="leading-none">{language === 'fa' ? part.nameFa : part.nameEn}</span>
                    <span className={`text-[8.5px] font-mono-spec mt-0.5 leading-none ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                      {part.code}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Interactive CAD & Mechanical 3D Canvas */}
      <div className="relative z-10 my-auto flex items-center justify-center h-52 sm:h-60 overflow-visible">
        
        {/* Dynamic Incandescent Blackbody Radiant Heat Glow at Higher Temperatures */}
        {currentTempC > 60 && viewMode !== 'dimensions' && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
            style={{ opacity: Math.min(1, (currentTempC - 50) / 200) }}
          >
            <div 
              className={`w-48 h-48 rounded-full filter blur-2xl transition-all ${
                currentTempC > 220 ? 'animate-pulse' : ''
              }`}
              style={{
                backgroundColor: thermalProfile.outerGlow,
                boxShadow: `0 0 60px 20px ${thermalProfile.outerGlow}`
              }}
            />
          </div>
        )}

        {/* High-Fidelity Ultra-Realistic SVG CAD Model */}
        <svg
          viewBox="0 0 460 400"
          className="w-full h-full max-h-[230px] sm:max-h-[265px] drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* 1. Superfinished Polished Chrome Steel Outer Ring (100Cr6 Anisotropic Radial Reflection) */}
            <radialGradient id="outerRingSteel" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="12%" stopColor="#f1f5f9" />
              <stop offset="30%" stopColor="#cbd5e1" />
              <stop offset="55%" stopColor="#94a3b8" />
              <stop offset="78%" stopColor="#475569" />
              <stop offset="92%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* 2. Superfinished Polished Inner Ring */}
            <radialGradient id="innerRingSteel" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="15%" stopColor="#e2e8f0" />
              <stop offset="40%" stopColor="#94a3b8" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="90%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0a0f1d" />
            </radialGradient>

            {/* 3. Precision CNC Raceway Chamfer Highlight */}
            <linearGradient id="chamferShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#94a3b8" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#334155" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            {/* 4. Solid Machined Brass Retainer Cage (DIN EN 12164) */}
            <linearGradient id="brassCageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="20%" stopColor="#facc15" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#ca8a04" />
              <stop offset="90%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>

            {/* 5. Chrome Mirror Ball Specular Highlight (Standard Cool Steel) */}
            <radialGradient id="chromeBallSteel" cx="28%" cy="22%" r="72%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="15%" stopColor="#f8fafc" />
              <stop offset="35%" stopColor="#cbd5e1" />
              <stop offset="60%" stopColor="#64748b" />
              <stop offset="85%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* 6. Physical Thermal Heat Blackbody Ball Shading at Any Temperature */}
            <radialGradient id="dynamicThermalBall" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor={thermalProfile.thermalGradient[0]} />
              <stop offset="20%" stopColor={thermalProfile.thermalGradient[1]} />
              <stop offset="45%" stopColor={thermalProfile.thermalGradient[2]} />
              <stop offset="75%" stopColor={thermalProfile.thermalGradient[3]} />
              <stop offset="100%" stopColor={thermalProfile.thermalGradient[4]} />
            </radialGradient>

            {/* 7. Cylindrical Roller Specular Linear Shading */}
            <linearGradient id="cylindricalRollerSteel" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="20%" stopColor="#cbd5e1" />
              <stop offset="40%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="90%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* 8. Tapered Roller Conical Shading */}
            <linearGradient id="taperRollerSteel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#e2e8f0" />
              <stop offset="55%" stopColor="#94a3b8" />
              <stop offset="80%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* 9. Heavy Cast Iron Housing Body Texture */}
            <radialGradient id="castIronHousingGrad" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="35%" stopColor="#64748b" />
              <stop offset="70%" stopColor="#334155" />
              <stop offset="95%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* 10. Viton / FKM Fluorocarbon Elastomer Seal Gradient */}
            <radialGradient id="vitonElastomerGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="35%" stopColor="#7f1d1d" />
              <stop offset="70%" stopColor="#450a0a" />
              <stop offset="95%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>

            {/* 11. Synthetic Grease Lubrication Film Sheen */}
            <linearGradient id="greaseFilmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ca8a04" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#713f12" stopOpacity="0.3" />
            </linearGradient>

            {/* 12. FLIR Thermal Infrared Multi-Spectral Isotherm Map */}
            <radialGradient id="flirThermalMap" cx="45%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={currentTempC > 200 ? 0.9 : 0.4} />
              <stop offset="25%" stopColor="#facc15" stopOpacity="0.75" />
              <stop offset="55%" stopColor="#ea580c" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#dc2626" stopOpacity="0.85" />
              <stop offset="90%" stopColor="#7c3aed" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.2" />
            </radialGradient>

            {/* Laser Marking Text Arc Path on Outer Ring */}
            <path
              id="outerRingLaserTextPath"
              d="M 52,200 A 148,148 0 1,1 348,200"
              fill="none"
            />
          </defs>

          {/* BACKGROUND CAST IRON PILLOW BLOCK HOUSING (When Housing is selected) */}
          {selectedType === 'housing' && (
            <g>
              <path
                d="M 20,345 L 380,345 L 370,305 L 30,305 Z"
                fill="url(#castIronHousingGrad)"
                stroke="#0f172a"
                strokeWidth="2.5"
              />
              <rect x="25" y="325" width="350" height="25" rx="6" fill="#1e293b" opacity="0.3" />
              <ellipse cx="65" cy="325" rx="14" ry="7" fill="#020617" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="335" cy="325" rx="14" ry="7" fill="#020617" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="65" cy="325" rx="8" ry="4" fill="#334155" />
              <ellipse cx="335" cy="325" rx="8" ry="4" fill="#334155" />

              <path
                d="M 45,305 C 45,140 95,45 200,45 C 305,45 355,140 355,305 Z"
                fill="url(#castIronHousingGrad)"
                stroke="#0f172a"
                strokeWidth="3"
              />
              <path
                d="M 65,295 C 65,160 110,75 200,75 C 290,75 335,160 335,295 Z"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                opacity="0.4"
              />

              <rect x="193" y="24" width="14" height="22" rx="3" fill="#ca8a04" stroke="#854d0e" strokeWidth="1.5" />
              <polygon points="191,32 209,32 206,38 194,38" fill="#eab308" />
              <circle cx="200" cy="22" r="5" fill="#fef08a" stroke="#854d0e" strokeWidth="1" />
              <circle cx="200" cy="22" r="2" fill="#020617" />
            </g>
          )}

          {/* 1. OUTER RING (Superfinished 100Cr6 Ground Chrome Steel with Laser Etchings) */}
          {selectedType !== 'seal' ? (
            <g>
              {/* Outer Chamfer Edge */}
              <circle cx="200" cy="200" r="186" fill="url(#outerRingSteel)" stroke="#0f172a" strokeWidth="3" />
              <circle cx="200" cy="200" r="183" fill="none" stroke="url(#chamferShine)" strokeWidth="2.5" opacity="0.9" />
              
              {/* Laser Engraved Manufacturer & Standard Ring Markings */}
              <circle cx="200" cy="200" r="172" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="6 4" opacity="0.6" />
              
              {/* Crisp Laser Marking Text along Outer Ring */}
              <text fontSize="7.5" fontFamily="SF Mono, JetBrains Mono, monospace" fontWeight="bold" fill="#334155" opacity="0.85" letterSpacing="2">
                <textPath href="#outerRingLaserTextPath" startOffset="10%">
                  {currentPart.brand} • {currentPart.code} • {currentPart.standard} • 100Cr6
                </textPath>
              </text>

              {/* Outer Ring Raceway Shoulder Bore */}
              <circle cx="200" cy="200" r="150" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
              <circle cx="200" cy="200" r="148" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.8" />
              
              {/* Synthetic Grease Film Coating in Raceway */}
              <circle cx="200" cy="200" r="136" fill="none" stroke="url(#greaseFilmGrad)" strokeWidth="18" opacity="0.85" />
            </g>
          ) : (
            /* Rotary Oil Seal Elastomeric Outer Body */
            <g>
              <circle cx="200" cy="200" r="185" fill="url(#vitonElastomerGrad)" stroke="#09090b" strokeWidth="3.5" />
              <circle cx="200" cy="200" r="178" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
              <circle cx="200" cy="200" r="145" fill="#18181b" stroke="#7f1d1d" strokeWidth="2.5" />
              <circle cx="200" cy="200" r="168" fill="none" stroke="#94a3b8" strokeWidth="4" strokeDasharray="14 6" opacity="0.75" />
            </g>
          )}

          {/* Spherical W33 Lubrication Oil Holes & Groove */}
          {selectedType === 'spherical' && (
            <g>
              <circle cx="200" cy="200" r="184" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="12 12" />
              <circle cx="200" cy="26" r="4.5" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.2" />
              <circle cx="26" cy="200" r="4.5" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.2" />
              <circle cx="374" cy="200" r="4.5" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.2" />
            </g>
          )}

          {/* 2. ROLLING ELEMENTS & CAGE ASSEMBLY WITH HIGH-FIDELITY SHADING */}
          
          {/* TYPE A: DEEP GROOVE BALL BEARING & HOUSING INSERT */}
          {(selectedType === 'deep-groove' || selectedType === 'housing') && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              {/* Machined Brass Retainer Pocket Ring */}
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="url(#brassCageGrad)"
                strokeWidth="22"
                strokeDasharray="28 18"
                opacity="0.95"
              />
              {/* 8 Mirror-Polished Chrome Ball Bearings */}
              {Array.from({ length: 8 }).map((_, index) => {
                const angle = (index * 360) / 8;
                const rad = (angle * Math.PI) / 180;
                const radius = 118;
                const cx = 200 + radius * Math.cos(rad);
                const cy = 200 + radius * Math.sin(rad);

                return (
                  <g key={index} transform={`rotate(${elementSpinAngle}, ${cx}, ${cy})`}>
                    {/* Ball Sphere with Dynamic Thermal or Steel Shading */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="23"
                      fill={currentTempC > 60 ? "url(#dynamicThermalBall)" : "url(#chromeBallSteel)"}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    {/* Specular Highlight Arc */}
                    <circle cx={cx - 7} cy={cy - 7} r="6" fill="#ffffff" opacity="0.95" />
                    <ellipse 
                      cx={cx + 6} 
                      cy={cy + 6} 
                      rx="4" 
                      ry="2.5" 
                      fill={currentTempC > 100 ? "#fef08a" : "#38bdf8"} 
                      opacity={currentTempC > 100 ? 0.8 : 0.45} 
                    />
                    {/* Brass Retainer Rivet Fastener Detail */}
                    <circle cx={cx} cy={cy} r="3" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" opacity="0.75" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE B: TAPERED ROLLER BEARING */}
          {selectedType === 'tapered' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="120"
                fill="none"
                stroke="#64748b"
                strokeWidth="18"
                strokeDasharray="20 14"
                opacity="0.9"
              />
              {Array.from({ length: 10 }).map((_, index) => {
                const angle = (index * 360) / 10;
                const rad = (angle * Math.PI) / 180;
                const radius = 118;
                const cx = 200 + radius * Math.cos(rad);
                const cy = 200 + radius * Math.sin(rad);

                return (
                  <g key={index} transform={`rotate(${angle + 90}, ${cx}, ${cy})`}>
                    <polygon
                      points={`${cx - 10},${cy - 20} ${cx + 10},${cy - 20} ${cx + 13},${cy + 20} ${cx - 13},${cy + 20}`}
                      fill={currentTempC > 60 ? "url(#dynamicThermalBall)" : "url(#taperRollerSteel)"}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <line x1={cx - 5} y1={cy - 18} x2={cx - 7} y2={cy + 18} stroke="#ffffff" strokeWidth="2" opacity="0.8" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE C: SPHERICAL ROLLER BEARING (Double Row Barrel Rollers) */}
          {selectedType === 'spherical' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="120"
                fill="none"
                stroke="url(#brassCageGrad)"
                strokeWidth="24"
                strokeDasharray="18 12"
                opacity="0.9"
              />
              <circle cx="200" cy="200" r="120" fill="none" stroke="#1e293b" strokeWidth="3" />
              {Array.from({ length: 12 }).map((_, index) => {
                const angle = (index * 360) / 12;
                const rad = (angle * Math.PI) / 180;
                const radius = 119;
                const cx = 200 + radius * Math.cos(rad);
                const cy = 200 + radius * Math.sin(rad);

                return (
                  <g key={index} transform={`rotate(${angle + 90}, ${cx}, ${cy})`}>
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx="12"
                      ry="18"
                      fill={currentTempC > 60 ? "url(#dynamicThermalBall)" : "url(#taperRollerSteel)"}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <ellipse cx={cx - 3} cy={cy} rx="4" ry="12" fill="#ffffff" opacity="0.75" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE D: CYLINDRICAL ROLLER BEARING */}
          {selectedType === 'cylindrical' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="url(#brassCageGrad)"
                strokeWidth="18"
                strokeDasharray="20 12"
                opacity="0.9"
              />
              {Array.from({ length: 12 }).map((_, index) => {
                const angle = (index * 360) / 12;
                const rad = (angle * Math.PI) / 180;
                const radius = 118;
                const cx = 200 + radius * Math.cos(rad);
                const cy = 200 + radius * Math.sin(rad);

                return (
                  <g key={index} transform={`rotate(${angle + 90}, ${cx}, ${cy})`}>
                    <rect
                      x={cx - 10}
                      y={cy - 16}
                      width="20"
                      height="32"
                      rx="3"
                      fill={currentTempC > 60 ? "url(#dynamicThermalBall)" : "url(#cylindricalRollerSteel)"}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <line x1={cx - 4} y1={cy - 14} x2={cx - 4} y2={cy + 14} stroke="#ffffff" strokeWidth="2" opacity="0.8" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE E: SELF-ALIGNING BALL BEARING (Dual Staggered Ball Rows) */}
          {selectedType === 'self-aligning' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="url(#brassCageGrad)"
                strokeWidth="20"
                strokeDasharray="14 10"
                opacity="0.9"
              />
              {Array.from({ length: 14 }).map((_, index) => {
                const angle = (index * 360) / 14;
                const rad = (angle * Math.PI) / 180;
                const radius = index % 2 === 0 ? 112 : 124;
                const cx = 200 + radius * Math.cos(rad);
                const cy = 200 + radius * Math.sin(rad);

                return (
                  <g key={index}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="14"
                      fill={currentTempC > 60 ? "url(#dynamicThermalBall)" : "url(#chromeBallSteel)"}
                      stroke="#0f172a"
                      strokeWidth="1.2"
                    />
                    <circle cx={cx - 4} cy={cy - 4} r="3.5" fill="#ffffff" opacity="0.9" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE F: ANGULAR CONTACT BALL BEARING (40° Contact Vector Marker) */}
          {selectedType === 'angular-contact' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="url(#brassCageGrad)"
                strokeWidth="22"
                strokeDasharray="22 14"
                opacity="0.95"
              />
              {Array.from({ length: 10 }).map((_, index) => {
                const angle = (index * 360) / 10;
                const rad = (angle * Math.PI) / 180;
                const radius = 118;
                const cx = 200 + radius * Math.cos(rad);
                const cy = 200 + radius * Math.sin(rad);

                return (
                  <g key={index}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="20"
                      fill={currentTempC > 60 ? "url(#dynamicThermalBall)" : "url(#chromeBallSteel)"}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <circle cx={cx - 6} cy={cy - 6} r="5" fill="#ffffff" opacity="0.9" />
                    <line x1={cx - 10} y1={cy + 10} x2={cx + 10} y2={cy - 10} stroke="#f59e0b" strokeWidth="1.2" opacity="0.6" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE G: NEEDLE ROLLER BEARING */}
          {selectedType === 'needle' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="#64748b"
                strokeWidth="14"
                strokeDasharray="12 8"
                opacity="0.85"
              />
              {Array.from({ length: 18 }).map((_, index) => {
                const angle = (index * 360) / 18;
                const rad = (angle * Math.PI) / 180;
                const radius = 118;
                const cx = 200 + radius * Math.cos(rad);
                const cy = 200 + radius * Math.sin(rad);

                return (
                  <g key={index} transform={`rotate(${angle + 90}, ${cx}, ${cy})`}>
                    <rect
                      x={cx - 4}
                      y={cy - 16}
                      width="8"
                      height="32"
                      rx="2"
                      fill={currentTempC > 60 ? "url(#dynamicThermalBall)" : "url(#cylindricalRollerSteel)"}
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                    <line x1={cx - 1.5} y1={cy - 14} x2={cx - 1.5} y2={cy + 14} stroke="#ffffff" strokeWidth="1" opacity="0.9" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE H: THRUST BALL BEARING */}
          {selectedType === 'thrust' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="url(#brassCageGrad)"
                strokeWidth="26"
                strokeDasharray="24 16"
                opacity="0.95"
              />
              {Array.from({ length: 10 }).map((_, index) => {
                const angle = (index * 360) / 10;
                const rad = (angle * Math.PI) / 180;
                const radius = 118;
                const cx = 200 + radius * Math.cos(rad);
                const cy = 200 + radius * Math.sin(rad);

                return (
                  <g key={index}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="19"
                      fill={currentTempC > 60 ? "url(#dynamicThermalBall)" : "url(#chromeBallSteel)"}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <circle cx={cx - 5} cy={cy - 5} r="4.5" fill="#ffffff" opacity="0.95" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE I: ROTARY SHAFT OIL SEAL (Garter Spring & Elastomer Lips) */}
          {selectedType === 'seal' && (
            <g>
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="7"
                strokeDasharray="3 3"
                opacity="0.95"
              />
              <circle
                cx="200"
                cy="200"
                r="92"
                fill="none"
                stroke="#991b1b"
                strokeWidth="12"
                opacity="0.9"
              />
            </g>
          )}

          {/* 3. INNER RING & SHAFT BORE ASSEMBLY (Ground Steel Finish, Chamfers & Keyway) */}
          <g transform={`rotate(${rotationAngle * 2.5}, 200, 200)`}>
            <circle cx="200" cy="200" r="86" fill="url(#innerRingSteel)" stroke="#0f172a" strokeWidth="2.5" />
            <circle cx="200" cy="200" r="83" fill="none" stroke="url(#chamferShine)" strokeWidth="2" opacity="0.9" />
            <circle cx="200" cy="200" r="68" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.6" />
            
            {/* Shaft Bore Center Hole (d = 40 mm) */}
            <circle cx="200" cy="200" r="48" fill="#020617" stroke="#1e293b" strokeWidth="3" />
            <circle cx="200" cy="200" r="46" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="6 3" />

            {/* Shaft Keyway Notch & Machined Core */}
            <rect x="194" y="146" width="12" height="12" rx="2" fill="#334155" />
            <circle cx="200" cy="200" r="16" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="6" fill="#38bdf8" />
          </g>

          {/* 4. HIGH-CONTRAST USABLE GEOMETRIC DIMENSIONS WITH RIGHT-SIDE LEADER LINES & BIGGER FONTS */}
          {viewMode === 'dimensions' && (
            <g className="animate-in fade-in duration-200">
              {/* Pitch Circle Diameter (PCD dm) Dot-Dash Centerline */}
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="#0284c7"
                strokeWidth="1.8"
                strokeDasharray="8 4 2 4"
                opacity="0.9"
              />
              
              {/* Precision Center Crosshairs */}
              <line x1="200" y1="8" x2="200" y2="392" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="10 5" opacity="0.7" />
              <line x1="8" y1="200" x2="392" y2="200" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="10 5" opacity="0.7" />

              {/* ------------------------------------------------------------- */}
              {/* RIGHT SIDE CALLOUT 1: OUTER DIAMETER (Ø D) */}
              {/* Pointing directly to the outer surface with leader extending to the right */}
              {/* ------------------------------------------------------------- */}
              <g>
                {/* Pointer Arrow touching outer ring surface at (386, 200) */}
                <line x1="386" y1="200" x2="435" y2="200" stroke="#1d4ed8" strokeWidth="2.5" />
                <line x1="435" y1="200" x2="435" y2="95" stroke="#1d4ed8" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="435" y1="95" x2="340" y2="95" stroke="#1d4ed8" strokeWidth="2" />
                <circle cx="386" cy="200" r="3.5" fill="#1d4ed8" />
                <polygon points="386,200 376,195 376,205" fill="#1d4ed8" />

                {/* Big High-Contrast Badge for Ø D */}
                <rect 
                  x="285" 
                  y="66" 
                  width="165" 
                  height="34" 
                  rx="10" 
                  fill="#ffffff" 
                  stroke="#1d4ed8" 
                  strokeWidth="2.2" 
                  filter="drop-shadow(0 4px 10px rgba(29,78,216,0.22))" 
                />
                <text x="367" y="88" fill="#1e3a8a" fontSize="14.5" fontWeight="900" fontFamily="SF Mono, JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.8">
                  Ø D = {currentPart.D} mm
                </text>
              </g>

              {/* ------------------------------------------------------------- */}
              {/* RIGHT SIDE CALLOUT 2: PITCH CIRCLE DIAMETER (P.C.D dm) */}
              {/* Pointing directly to the ball center PCD line at (318, 200) */}
              {/* ------------------------------------------------------------- */}
              <g>
                <circle cx="318" cy="200" r="3.5" fill="#0284c7" />
                <line x1="318" y1="200" x2="425" y2="200" stroke="#0284c7" strokeWidth="2" />
                <line x1="425" y1="200" x2="425" y2="155" stroke="#0284c7" strokeWidth="2" strokeDasharray="3 2" />
                <line x1="425" y1="155" x2="320" y2="155" stroke="#0284c7" strokeWidth="2" />

                {/* Big Badge for P.C.D */}
                <rect 
                  x="270" 
                  y="126" 
                  width="180" 
                  height="34" 
                  rx="10" 
                  fill="#ffffff" 
                  stroke="#0284c7" 
                  strokeWidth="2.2" 
                  filter="drop-shadow(0 4px 10px rgba(2,132,199,0.22))" 
                />
                <text x="360" y="148" fill="#0369a1" fontSize="14" fontWeight="900" fontFamily="SF Mono, JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.6">
                  P.C.D dm = {currentPart.dm} mm
                </text>
              </g>

              {/* ------------------------------------------------------------- */}
              {/* RIGHT SIDE CALLOUT 3: INNER BORE DIAMETER (Ø d) */}
              {/* Pointing directly to the inner bore hole surface at (248, 200) */}
              {/* ------------------------------------------------------------- */}
              <g>
                <circle cx="248" cy="200" r="3.5" fill="#059669" />
                <line x1="248" y1="200" x2="415" y2="200" stroke="#059669" strokeWidth="2" />
                <line x1="415" y1="200" x2="415" y2="265" stroke="#059669" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="415" y1="265" x2="310" y2="265" stroke="#059669" strokeWidth="2" />
                <polygon points="248,200 238,196 238,204" fill="#059669" />

                {/* Big Badge for Ø d */}
                <rect 
                  x="285" 
                  y="236" 
                  width="165" 
                  height="34" 
                  rx="10" 
                  fill="#ffffff" 
                  stroke="#059669" 
                  strokeWidth="2.2" 
                  filter="drop-shadow(0 4px 10px rgba(5,150,105,0.22))" 
                />
                <text x="367" y="258" fill="#065f46" fontSize="14.5" fontWeight="900" fontFamily="SF Mono, JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.8">
                  Ø d = {currentPart.d} mm
                </text>
              </g>

              {/* ------------------------------------------------------------- */}
              {/* RIGHT SIDE CALLOUT 4: WIDTH / THICKNESS (Width B) */}
              {/* ------------------------------------------------------------- */}
              <g>
                <rect 
                  x="285" 
                  y="296" 
                  width="165" 
                  height="34" 
                  rx="10" 
                  fill="#ffffff" 
                  stroke="#d97706" 
                  strokeWidth="2.2" 
                  filter="drop-shadow(0 4px 10px rgba(217,119,6,0.22))" 
                />
                <text x="367" y="318" fill="#92400e" fontSize="14" fontWeight="900" fontFamily="SF Mono, JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.6">
                  Width B = {currentPart.B} mm
                </text>
              </g>

              {/* Top Left Badge: Chamfer & Clearance */}
              <g>
                <rect 
                  x="12" 
                  y="16" 
                  width="165" 
                  height="32" 
                  rx="9" 
                  fill="#ffffff" 
                  stroke="#7c3aed" 
                  strokeWidth="1.8" 
                  filter="drop-shadow(0 3px 6px rgba(124,58,237,0.15))" 
                />
                <text x="94" y="36" fill="#5b21b6" fontSize="12" fontWeight="900" fontFamily="SF Mono, JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.4">
                  r min = {currentPart.rMin} mm {currentPart.contactAngle ? `| α=${currentPart.contactAngle}` : ''}
                </text>
              </g>

            </g>
          )}

          {/* 5. THERMAL STRESS ANALYSIS ISOTHERM MAP WITH REAL HEAT COLOR SPECTRUM */}
          {viewMode === 'thermal' && (
            <g className="animate-in fade-in duration-200">
              {/* Full Multi-Spectral Heat Distribution Isotherm */}
              <circle
                cx="200"
                cy="200"
                r="158"
                fill="url(#flirThermalMap)"
                className={currentTempC > 180 ? 'animate-pulse' : ''}
              />
              
              {/* Hertzian Contact Pressure Heat Rings */}
              <circle cx="200" cy="200" r="148" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.9" />
              <circle cx="200" cy="200" r="118" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" opacity="0.9" />
              <circle cx="200" cy="200" r="86" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" opacity="0.8" />

              {/* Point Contact High-Stress Thermal Spots */}
              {Array.from({ length: 8 }).map((_, index) => {
                const angle = (index * 360) / 8;
                const rad = (angle * Math.PI) / 180;
                const cx = 200 + 118 * Math.cos(rad);
                const cy = 200 + 118 * Math.sin(rad);

                return (
                  <g key={index}>
                    <circle cx={cx} cy={cy} r="18" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3 2" />
                    <circle cx={cx} cy={cy} r="6" fill="#ffffff" opacity={currentTempC > 150 ? 0.9 : 0.4} />
                  </g>
                );
              })}
            </g>
          )}

        </svg>

      </div>

      {/* Dynamic Thermal Health Status Banner when in Thermal mode or High temp */}
      {isThermalActive && (
        <div className={`relative z-10 my-1.5 p-2 rounded-xl border flex items-center justify-between text-[11px] transition-all backdrop-blur-md ${
          currentTempC > 220 
            ? 'bg-red-500/15 border-red-300 text-red-950 shadow-sm' 
            : currentTempC > 140
            ? 'bg-orange-500/15 border-orange-300 text-orange-950 shadow-sm'
            : currentTempC > 85
            ? 'bg-amber-500/15 border-amber-300 text-amber-950 shadow-sm'
            : 'bg-emerald-500/15 border-emerald-300 text-emerald-950 shadow-sm'
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            {currentTempC > 180 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 animate-bounce" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            )}
            <span>{language === 'fa' ? thermalProfile.labelFa : thermalProfile.labelEn}</span>
          </div>
          <span className="font-mono-spec font-black text-xs">
            {currentTempC}°C
          </span>
        </div>
      )}

      {/* Bottom Controls: Speed Presets & Meaningful View Modes */}
      <div className="relative z-10 pt-2 border-t border-white/60 flex flex-col gap-2">
        
        {/* Speed Adjustment Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <Gauge className="w-3.5 h-3.5 text-[#232c86]" />
            <span>{language === 'fa' ? 'دور چرخش (RPM):' : 'Rotational Speed (RPM):'}</span>
          </div>

          <div className="flex items-center gap-1 p-0.5 glass-pill rounded-full">
            {speedPresets.map((p) => {
              const isSelected = speedLevel === p.val;
              const isHigh = p.val >= 3000;
              return (
                <button
                  key={p.val}
                  onClick={() => {
                    setSpeedLevel(p.val);
                    setManualTempC(null); // Return to synchronized speed-temp physics
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono-spec font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? isHigh 
                        ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-400' 
                        : 'bg-[#232c86] text-white shadow-sm ring-1 ring-blue-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title={`${p.label} RPM - ${language === 'fa' ? p.descFa : p.descEn}`}
                >
                  {isHigh && isSelected && <Flame className="w-2.5 h-2.5 text-amber-200" />}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Distinct Engineering View Modes (Apple Glass Segmented Switch) */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-white/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setViewMode('3d')}
            className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === '3d'
                ? 'bg-white text-[#232c86] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'مدل سه‌بعدی واقعی' : 'Realistic 3D'}</span>
          </button>

          <button
            onClick={() => setViewMode('dimensions')}
            className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'dimensions'
                ? 'bg-white text-[#232c86] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'ابعاد هندسی (ISO)' : 'Geometric Dims'}</span>
          </button>

          <button
            onClick={() => setViewMode('thermal')}
            className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'thermal'
                ? 'bg-white text-red-600 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'طیف تنش حرارتی' : 'Thermal Stress'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
