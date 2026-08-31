import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCw, 
  Layers, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight,
  Cpu,
  Compass,
  Thermometer,
  Eye,
  Info
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
  material: string;
  d: number; // inner bore (mm)
  D: number; // outer dia (mm)
  B: number; // width (mm)
  dm: number; // pitch circle dia (mm)
  rMin: number; // chamfer radius (mm)
  elementCount: number;
  contactAngle?: string;
  clearance?: string;
  cageTypeFa: string;
  cageTypeEn: string;
  loadTypeFa: string;
  loadTypeEn: string;
  tagFa: string;
  tagEn: string;
}

export const RealisticBearingViewer: React.FC<RealisticBearingViewerProps> = ({ language }) => {
  const [selectedType, setSelectedType] = useState<SelectedBearingType>('deep-groove');
  // Unified view modes: '3d' for 3D Kinematic Motion, 'engineering-cutaway' for Integrated CAD Cutaway + ISO Dimensions
  const [viewMode, setViewMode] = useState<'3d' | 'engineering-cutaway'>('3d');
  const [showThermalOverlay, setShowThermalOverlay] = useState<boolean>(false);
  
  // Kinematics & Motion state
  const [speedRpm, setSpeedRpm] = useState<number>(30); // Gentle 30 RPM inspection speed
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [elementSpinAngle, setElementSpinAngle] = useState<number>(0);
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Detect user prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsPaused(true);
    }
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsPaused(true);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 10 Industrial Mechanical Power Transmission Components with accurate engineering parameters
  const allParts: PartMeta[] = [
    {
      id: 'deep-groove',
      category: 'radial',
      nameFa: 'بلبرینگ شیار عمیق',
      nameEn: 'Deep Groove Ball Bearing',
      code: '6208-2RS1 / C3',
      brand: 'SKF EXPLORER',
      standard: 'DIN 625 / ISO 15',
      material: '100Cr6 (AISI 52100)',
      d: 40,
      D: 80,
      B: 18,
      dm: 60,
      rMin: 1.1,
      elementCount: 8,
      clearance: 'C3 (15-33 µm)',
      cageTypeFa: 'قفسه برنجی ماشین‌کاری شده',
      cageTypeEn: 'Machined Brass Cage (CuZn40Pb2)',
      loadTypeFa: 'بار شعاعی + بار محوری دوطرفه',
      loadTypeEn: 'Radial + Dual Direction Axial',
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
      material: 'Case-Hardened Alloy Steel',
      d: 40,
      D: 80,
      B: 19.75,
      dm: 59.5,
      rMin: 1.5,
      elementCount: 10,
      contactAngle: '16°',
      clearance: 'Preload Adjustable',
      cageTypeFa: 'قفسه فولادی پرسی پنجره‌ای',
      cageTypeEn: 'Pressed Steel Window Cage',
      loadTypeFa: 'بار سنگین ترکیبی شعاعی/محوری یکطرفه',
      loadTypeEn: 'Heavy Combined Radial/Axial',
      tagFa: 'گیربکس و چرخ خودرو',
      tagEn: 'Gearbox & Axle Drive',
    },
    {
      id: 'spherical',
      category: 'roller',
      nameFa: 'رولبرینگ بشکه‌ای (دو ردیفه)',
      nameEn: 'Spherical Roller Bearing',
      code: '22208 E/W33',
      brand: 'FAG GERMANY',
      standard: 'DIN 635-2 / ISO 15',
      material: '100Cr6 Through-Hardened',
      d: 40,
      D: 80,
      B: 23,
      dm: 60,
      rMin: 1.1,
      elementCount: 12,
      contactAngle: '10.5°',
      clearance: 'CN Normal (30-45 µm)',
      cageTypeFa: 'قفسه برنجی دو تکه صلب',
      cageTypeEn: 'Two-piece Machined Brass',
      loadTypeFa: 'فوق سنگین ضربه‌ای + خودتنظیم',
      loadTypeEn: 'Extreme Dynamic Shock + Self-Aligning',
      tagFa: 'صنایع فولاد و معدن',
      tagEn: 'Steel & Heavy Mining',
    },
    {
      id: 'cylindrical',
      category: 'roller',
      nameFa: 'رولبرینگ استوانه‌ای',
      nameEn: 'Cylindrical Roller Bearing',
      code: 'NU 208 ECP',
      brand: 'SKF EXPLORER',
      standard: 'DIN 5412-1 / ISO 15',
      material: '100Cr6 Vacuum-Degassed',
      d: 40,
      D: 80,
      B: 18,
      dm: 60,
      rMin: 1.1,
      elementCount: 12,
      clearance: 'C3 (25-45 µm)',
      cageTypeFa: 'قفسه پلی‌آمید تقویت‌شده با فیبر',
      cageTypeEn: 'Glass Fiber Reinforced PA66',
      loadTypeFa: 'بار شعاعی بسیار سنگین در دور بالا',
      loadTypeEn: 'High-Speed Pure Radial Load',
      tagFa: 'الکتروموتورهای سنگین',
      tagEn: 'Heavy Industrial Motors',
    },
    {
      id: 'self-aligning',
      category: 'radial',
      nameFa: 'بلبرینگ خودتنظیم',
      nameEn: 'Self-Aligning Ball Bearing',
      code: '1208 EKTN9',
      brand: 'NSK JAPAN',
      standard: 'DIN 630 / ISO 15',
      material: 'SUJ2 High Carbon Chrome',
      d: 40,
      D: 80,
      B: 18,
      dm: 59,
      rMin: 1.1,
      elementCount: 14,
      clearance: 'CN (13-28 µm)',
      cageTypeFa: 'قفسه پلیمری مهندسی',
      cageTypeEn: 'Moulded Polyamide Cage',
      loadTypeFa: 'جبران انحراف زاویه‌ای شفت',
      loadTypeEn: 'Shaft Misalignment Compensation',
      tagFa: 'شفت‌های بلند و انعطاف‌پذیر',
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
      material: '100Cr6 Precision Ground',
      d: 40,
      D: 80,
      B: 18,
      dm: 60,
      rMin: 1.1,
      elementCount: 10,
      contactAngle: '40°',
      clearance: 'CB Normal Preload',
      cageTypeFa: 'قفسه برنجی ماشین‌کاری شده',
      cageTypeEn: 'Machined Brass Cage',
      loadTypeFa: 'بار محوری دقیق یکطرفه + سرعت زیاد',
      loadTypeEn: 'Precision Axial + High Speeds',
      tagFa: 'اسپیندل و پمپ سانتریفیوژ',
      tagEn: 'Spindles & Centrifugal Pumps',
    },
    {
      id: 'needle',
      category: 'roller',
      nameFa: 'رولبرینگ سوزنی',
      nameEn: 'Needle Roller Bearing',
      code: 'HK 4020 / RNA',
      brand: 'INA GERMANY',
      standard: 'DIN 618 / ISO 3245',
      material: '100Cr6 Hardened Needles',
      d: 40,
      D: 47,
      B: 20,
      dm: 43.5,
      rMin: 0.8,
      elementCount: 18,
      clearance: 'CN (10-25 µm)',
      cageTypeFa: 'قفسه فولادی راهنمای سوزن',
      cageTypeEn: 'Pressed Sheet Steel Guide',
      loadTypeFa: 'بار شعاعی فوق‌العاده در فضای کم',
      loadTypeEn: 'Compact High Radial Capacity',
      tagFa: 'فضای فشرده و گیربکس',
      tagEn: 'Compact Space Envelope',
    },
    {
      id: 'thrust',
      category: 'thrust-housing',
      nameFa: 'بلبرینگ کف‌گرد (محوری)',
      nameEn: 'Thrust Ball Bearing',
      code: '51208',
      brand: 'FAG GERMANY',
      standard: 'DIN 711 / ISO 104',
      material: '100Cr6 Lapped Raceways',
      d: 40,
      D: 68,
      B: 19,
      dm: 54,
      rMin: 1.0,
      elementCount: 10,
      contactAngle: '90° (Pure Thrust)',
      cageTypeFa: 'قفسه برنجی تراشکاری شده',
      cageTypeEn: 'Machined Brass Ring',
      loadTypeFa: 'بار خالص محوری تک‌جهته',
      loadTypeEn: 'Unidirectional Pure Thrust Load',
      tagFa: 'جک هیدرولیک و کلاچ',
      tagEn: 'Hydraulic Jacks & Turnables',
    },
    {
      id: 'housing',
      category: 'thrust-housing',
      nameFa: 'یاتاقان و هوزینگ صنعتی',
      nameEn: 'Plummer Block Housing Unit',
      code: 'SNL 508 / UC 208',
      brand: 'SKF SWEDEN',
      standard: 'ISO 113 / DIN 736',
      material: 'Grey Cast Iron EN-GJL-200',
      d: 40,
      D: 125,
      B: 49.2,
      dm: 78,
      rMin: 2.0,
      elementCount: 8,
      cageTypeFa: 'بلبرینگ خودتنظیم داخلی',
      cageTypeEn: 'Internal Spherical Insert',
      loadTypeFa: 'نشیمنگاه بلبرینگ در خطوط انتقال',
      loadTypeEn: 'Heavy Duty Pillow Block Unit',
      tagFa: 'نوار نقاله و فن صنعتی',
      tagEn: 'Conveyors & Heavy Blowers',
    },
    {
      id: 'seal',
      category: 'thrust-housing',
      nameFa: 'کاسه‌نمد فنردار وایتون',
      nameEn: 'Rotary Shaft Oil Seal (FKM)',
      code: 'TC 40×68×10 FKM',
      brand: 'CORTECO ITALY',
      standard: 'DIN 3760 / ISO 6194',
      material: 'Fluoroelastomer (FKM/Viton)',
      d: 40,
      D: 68,
      B: 10,
      dm: 54,
      rMin: 0.5,
      elementCount: 1,
      cageTypeFa: 'فنر فشاری فولاد زنگ‌نزن',
      cageTypeEn: 'Stainless Steel Garter Spring',
      loadTypeFa: 'آب‌بندی روغن هیدرولیک و گریس',
      loadTypeEn: 'Rotary Fluid & Contaminant Sealing',
      tagFa: 'ضدحرارت تا ۲۰۰ درجه',
      tagEn: 'High Thermal & Chemical Stability',
    },
  ];

  const currentPart = allParts.find(b => b.id === selectedType) || allParts[0];

  // Precision 60 FPS Kinematics Animation Loop (Planetary Motion)
  useEffect(() => {
    if (isPaused) return;

    const animate = (time: number) => {
      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      // Realistic Planetary Kinematic Ratios:
      // Inner ring rotates at speedRpm
      // Cage orbits at ~0.40 * speed
      // Rolling elements spin on their own axes at ~2.45 * speed
      const orbitalSpeedDeg = (speedRpm * 360 / 60) * 0.40;
      const elementSpinSpeedDeg = (speedRpm * 360 / 60) * 2.45;

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
  }, [speedRpm, isPaused]);

  // Horizontal Scroll helpers for Part Selector
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

  const speedPresets = [
    { label: '15', val: 15, descFa: 'بسیار آهسته (بررسی دقیق)', descEn: 'Slow Inspection' },
    { label: '30', val: 30, descFa: 'استاندارد بازبینی', descEn: 'Nominal Inspection' },
    { label: '60', val: 60, descFa: 'چرخش پیوسته', descEn: 'Continuous Motion' },
  ];

  return (
    <div 
      className="relative w-full max-w-sm sm:max-w-md glass-panel rounded-3xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden select-none transition-all shadow-[0_20px_50px_-10px_rgba(35,44,134,0.14),inset_0_1px_1px_rgba(255,255,255,1)] border border-white/80"
    >
      {/* Background Precision Engineering CAD Grid */}
      <div className="absolute inset-0 engineering-grid-light opacity-30 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-slate-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Part Code, ISO Standard, Brand & Engineering Badges */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#232c86]">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-black font-mono-spec text-slate-900 tracking-wider">
                {currentPart.code}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-spec font-bold bg-blue-50 text-[#232c86] border border-blue-200">
                {currentPart.brand}
              </span>
            </div>
            <span className="text-[10px] font-mono-spec text-slate-500 font-semibold">
              {currentPart.standard} • {currentPart.material}
            </span>
          </div>
        </div>

        {/* Play/Pause Motion & Thermal Overlay Control */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowThermalOverlay(prev => !prev)}
            aria-label={showThermalOverlay ? 'Hide thermal gradient' : 'Show thermal gradient'}
            className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
              showThermalOverlay 
                ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
                : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200'
            }`}
            title={language === 'fa' ? 'نمایش گرادیان دمایی فرضی' : 'Toggle Indicative Thermal Gradient'}
          >
            <Thermometer className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsPaused(prev => !prev)}
            aria-label={isPaused ? 'Play animation' : 'Pause animation'}
            className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
            title={isPaused ? (language === 'fa' ? 'شروع چرخش' : 'Play') : (language === 'fa' ? 'توقف چرخش' : 'Pause')}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-slate-700" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Interactive Horizontal Part Selector Bar */}
      <div className="relative z-10 my-2">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#232c86]" />
            {language === 'fa' ? 'انتخاب تیپ بیرینگ صنعتی:' : 'Select Industrial Component:'}
          </span>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleScrollLeft}
              className="p-1 rounded-lg hover:bg-white/80 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleScrollRight}
              className="p-1 rounded-lg hover:bg-white/80 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth"
        >
          {allParts.map((part) => {
            const isSelected = selectedType === part.id;
            return (
              <button
                key={part.id}
                onClick={() => setSelectedType(part.id)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#232c86] text-white border-[#232c86] shadow-sm'
                    : 'bg-white/60 text-slate-700 hover:bg-white/90 border-slate-200/60'
                }`}
              >
                <span>{language === 'fa' ? part.nameFa : part.nameEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main CAD Interactive Canvas Area */}
      <div className="relative z-10 w-full aspect-square max-h-[300px] sm:max-h-[320px] flex items-center justify-center my-1">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-[0_12px_28px_rgba(35,44,134,0.12)] overflow-visible"
        >
          <defs>
            {/* 1. Realistic Polished High-Carbon Chrome Steel 100Cr6 Radial Shading */}
            <radialGradient id="cadOuterRingSteel" cx="35%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="12%" stopColor="#f1f5f9" />
              <stop offset="35%" stopColor="#cbd5e1" />
              <stop offset="65%" stopColor="#64748b" />
              <stop offset="88%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* 2. Inner Ring Precision Ground Finish */}
            <radialGradient id="cadInnerRingSteel" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="15%" stopColor="#e2e8f0" />
              <stop offset="42%" stopColor="#94a3b8" />
              <stop offset="72%" stopColor="#475569" />
              <stop offset="92%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* 3. High Precision Specular Chamfer Highlight */}
            <linearGradient id="cadChamferShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#94a3b8" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#334155" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            {/* 4. Solid Machined Brass Retainer Cage (DIN EN 12164 CuZn40Pb2) */}
            <linearGradient id="cadBrassCageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="20%" stopColor="#facc15" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#ca8a04" />
              <stop offset="90%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>

            {/* 5. Chrome Mirror Ball Specular Highlight */}
            <radialGradient id="cadChromeBall" cx="28%" cy="22%" r="72%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="16%" stopColor="#f8fafc" />
              <stop offset="38%" stopColor="#cbd5e1" />
              <stop offset="62%" stopColor="#64748b" />
              <stop offset="85%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* 6. Cylindrical Roller Specular Linear Shading */}
            <linearGradient id="cadCylindricalRoller" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="20%" stopColor="#cbd5e1" />
              <stop offset="45%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="90%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* 7. Cast Iron Housing Shading */}
            <radialGradient id="cadCastIronGrad" cx="30%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="35%" stopColor="#64748b" />
              <stop offset="70%" stopColor="#334155" />
              <stop offset="95%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* 8. Viton / FKM Fluorocarbon Elastomer Seal Gradient */}
            <radialGradient id="cadVitonSealGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="35%" stopColor="#7f1d1d" />
              <stop offset="70%" stopColor="#450a0a" />
              <stop offset="95%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>

            {/* 9. Synthetic Grease Lubrication Film Sheen */}
            <linearGradient id="cadGreaseFilm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ca8a04" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#713f12" stopOpacity="0.2" />
            </linearGradient>

            {/* 10. Indicative Thermal Gradient Overlay */}
            <radialGradient id="cadThermalGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#ea580c" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#eab308" stopOpacity="0.45" />
              <stop offset="85%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </radialGradient>

            {/* 11. 45-degree ISO Section Cross-Hatch Pattern for Cutaway */}
            <pattern id="isoSectionHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#0284c7" strokeWidth="1.2" opacity="0.65" />
            </pattern>

            {/* Laser Marking Text Arc Path on Outer Ring */}
            <path
              id="cadLaserTextPath"
              d="M 52,200 A 148,148 0 1,1 348,200"
              fill="none"
            />
          </defs>

          {/* BACKGROUND CAST IRON PILLOW BLOCK HOUSING (When Housing is selected) */}
          {selectedType === 'housing' && (
            <g>
              <path
                d="M 20,345 L 380,345 L 370,305 L 30,305 Z"
                fill="url(#cadCastIronGrad)"
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
                fill="url(#cadCastIronGrad)"
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
              <circle cx="200" cy="200" r="186" fill="url(#cadOuterRingSteel)" stroke="#0f172a" strokeWidth="3" />
              <circle cx="200" cy="200" r="183" fill="none" stroke="url(#cadChamferShine)" strokeWidth="2.5" opacity="0.9" />
              
              {/* Laser Engraved Manufacturer & Standard Ring Markings */}
              <circle cx="200" cy="200" r="172" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="6 4" opacity="0.6" />
              
              {/* Laser Marking Text along Outer Ring */}
              <text fontSize="7.5" fontFamily="JetBrains Mono, SF Mono, monospace" fontWeight="bold" fill="#334155" opacity="0.85" letterSpacing="2">
                <textPath href="#cadLaserTextPath" startOffset="10%">
                  {currentPart.brand} • {currentPart.code} • {currentPart.standard} • 100Cr6
                </textPath>
              </text>

              {/* Outer Ring Raceway Shoulder Bore */}
              <circle cx="200" cy="200" r="150" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
              <circle cx="200" cy="200" r="148" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.8" />
              
              {/* Synthetic Grease Film Coating in Raceway */}
              <circle cx="200" cy="200" r="136" fill="none" stroke="url(#cadGreaseFilm)" strokeWidth="18" opacity="0.8" />
            </g>
          ) : (
            /* Rotary Oil Seal Elastomeric Outer Body */
            <g>
              <circle cx="200" cy="200" r="185" fill="url(#cadVitonSealGrad)" stroke="#09090b" strokeWidth="3.5" />
              <circle cx="200" cy="200" r="178" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
              <circle cx="200" cy="200" r="145" fill="#18181b" stroke="#7f1d1d" strokeWidth="2.5" />
              <circle cx="200" cy="200" r="168" fill="none" stroke="#94a3b8" strokeWidth="4" strokeDasharray="14 6" opacity="0.75" />
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
                stroke="url(#cadBrassCageGrad)"
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
                    <circle
                      cx={cx}
                      cy={cy}
                      r="23"
                      fill="url(#cadChromeBall)"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <circle cx={cx - 7} cy={cy - 7} r="6" fill="#ffffff" opacity="0.95" />
                    <ellipse cx={cx + 6} cy={cy + 6} rx="4" ry="2.5" fill="#38bdf8" opacity="0.4" />
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
                r="118"
                fill="none"
                stroke="url(#cadBrassCageGrad)"
                strokeWidth="26"
                strokeDasharray="26 14"
                opacity="0.9"
              />
              {Array.from({ length: 10 }).map((_, index) => {
                const angle = (index * 360) / 10;
                const rad = (angle * Math.PI) / 180;
                const cx = 200 + 118 * Math.cos(rad);
                const cy = 200 + 118 * Math.sin(rad);

                return (
                  <g key={index} transform={`rotate(${angle + 90}, ${cx}, ${cy})`}>
                    <polygon
                      points={`${cx - 10},${cy - 16} ${cx + 10},${cy - 16} ${cx + 14},${cy + 16} ${cx - 14},${cy + 16}`}
                      fill="url(#cadCylindricalRoller)"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <line x1={cx - 5} y1={cy - 14} x2={cx - 8} y2={cy + 14} stroke="#ffffff" strokeWidth="2.5" opacity="0.85" />
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
                r="118"
                fill="none"
                stroke="url(#cadBrassCageGrad)"
                strokeWidth="28"
                strokeDasharray="22 10"
                opacity="0.95"
              />
              {Array.from({ length: 12 }).map((_, index) => {
                const angle = (index * 360) / 12;
                const rad = (angle * Math.PI) / 180;
                const cx = 200 + 118 * Math.cos(rad);
                const cy = 200 + 118 * Math.sin(rad);

                return (
                  <g key={index} transform={`rotate(${angle + 90}, ${cx}, ${cy})`}>
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx="14"
                      ry="18"
                      fill="url(#cadChromeBall)"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <ellipse cx={cx - 4} cy={cy - 4} rx="5" ry="7" fill="#ffffff" opacity="0.8" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE D: CYLINDRICAL ROLLER BEARING (NU / NJ Series) */}
          {selectedType === 'cylindrical' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="url(#cadBrassCageGrad)"
                strokeWidth="24"
                strokeDasharray="20 12"
                opacity="0.9"
              />
              {Array.from({ length: 12 }).map((_, index) => {
                const angle = (index * 360) / 12;
                const rad = (angle * Math.PI) / 180;
                const cx = 200 + 118 * Math.cos(rad);
                const cy = 200 + 118 * Math.sin(rad);

                return (
                  <g key={index} transform={`rotate(${angle + 90}, ${cx}, ${cy})`}>
                    <rect
                      x={cx - 10}
                      y={cy - 16}
                      width="20"
                      height="32"
                      rx="3"
                      fill="url(#cadCylindricalRoller)"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <line x1={cx - 4} y1={cy - 14} x2={cx - 4} y2={cy + 14} stroke="#ffffff" strokeWidth="2.5" opacity="0.85" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE E: SELF-ALIGNING BALL BEARING (Double Row Balls) */}
          {selectedType === 'self-aligning' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="url(#cadBrassCageGrad)"
                strokeWidth="22"
                strokeDasharray="18 10"
                opacity="0.9"
              />
              {Array.from({ length: 14 }).map((_, index) => {
                const angle = (index * 360) / 14;
                const rad = (angle * Math.PI) / 180;
                const cx1 = 200 + 108 * Math.cos(rad);
                const cy1 = 200 + 108 * Math.sin(rad);
                const cx2 = 200 + 128 * Math.cos(rad);
                const cy2 = 200 + 128 * Math.sin(rad);

                return (
                  <g key={index}>
                    <circle cx={cx1} cy={cy1} r="9" fill="url(#cadChromeBall)" stroke="#0f172a" strokeWidth="1.2" />
                    <circle cx={cx2} cy={cy2} r="9" fill="url(#cadChromeBall)" stroke="#0f172a" strokeWidth="1.2" />
                    <circle cx={cx1 - 2.5} cy={cy1 - 2.5} r="2.5" fill="#ffffff" opacity="0.9" />
                    <circle cx={cx2 - 2.5} cy={cy2 - 2.5} r="2.5" fill="#ffffff" opacity="0.9" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE F: ANGULAR CONTACT BALL BEARING (40° Contact Angle Profile) */}
          {selectedType === 'angular-contact' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              <circle
                cx="200"
                cy="200"
                r="118"
                fill="none"
                stroke="url(#cadBrassCageGrad)"
                strokeWidth="24"
                strokeDasharray="28 14"
                opacity="0.95"
              />
              {Array.from({ length: 10 }).map((_, index) => {
                const angle = (index * 360) / 10;
                const rad = (angle * Math.PI) / 180;
                const cx = 200 + 118 * Math.cos(rad);
                const cy = 200 + 118 * Math.sin(rad);

                return (
                  <g key={index}>
                    <circle cx={cx} cy={cy} r="21" fill="url(#cadChromeBall)" stroke="#0f172a" strokeWidth="1.5" />
                    <circle cx={cx - 6} cy={cy - 6} r="5" fill="#ffffff" opacity="0.95" />
                    <line x1={cx - 16} y1={cy + 16} x2={cx + 16} y2={cy - 16} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.85" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE G: NEEDLE ROLLER BEARING */}
          {selectedType === 'needle' && (
            <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              {Array.from({ length: 18 }).map((_, index) => {
                const angle = (index * 360) / 18;
                const rad = (angle * Math.PI) / 180;
                const cx = 200 + 118 * Math.cos(rad);
                const cy = 200 + 118 * Math.sin(rad);

                return (
                  <g key={index} transform={`rotate(${angle + 90}, ${cx}, ${cy})`}>
                    <rect
                      x={cx - 4}
                      y={cy - 18}
                      width="8"
                      height="36"
                      rx="3"
                      fill="url(#cadCylindricalRoller)"
                      stroke="#0f172a"
                      strokeWidth="1.2"
                    />
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
                stroke="url(#cadBrassCageGrad)"
                strokeWidth="24"
                opacity="0.9"
              />
              {Array.from({ length: 10 }).map((_, index) => {
                const angle = (index * 360) / 10;
                const rad = (angle * Math.PI) / 180;
                const cx = 200 + 118 * Math.cos(rad);
                const cy = 200 + 118 * Math.sin(rad);

                return (
                  <g key={index}>
                    <circle cx={cx} cy={cy} r="18" fill="url(#cadChromeBall)" stroke="#0f172a" strokeWidth="1.5" />
                    <circle cx={cx - 5} cy={cy - 5} r="4.5" fill="#ffffff" opacity="0.95" />
                  </g>
                );
              })}
            </g>
          )}

          {/* TYPE I: ROTARY SHAFT OIL SEAL */}
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

          {/* 3. INNER RING & SHAFT BORE ASSEMBLY (Ground Steel Finish & Chamfers) */}
          <g transform={`rotate(${rotationAngle * 2.5}, 200, 200)`}>
            <circle cx="200" cy="200" r="86" fill="url(#cadInnerRingSteel)" stroke="#0f172a" strokeWidth="2.5" />
            <circle cx="200" cy="200" r="83" fill="none" stroke="url(#cadChamferShine)" strokeWidth="2" opacity="0.9" />
            <circle cx="200" cy="200" r="68" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.6" />
            
            {/* Shaft Bore Center Hole (d = 40 mm) */}
            <circle cx="200" cy="200" r="48" fill="#020617" stroke="#1e293b" strokeWidth="3" />
            <circle cx="200" cy="200" r="46" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="6 3" />

            {/* Shaft Center Keyway Notch */}
            <rect x="194" y="146" width="12" height="12" rx="2" fill="#334155" />
            <circle cx="200" cy="200" r="16" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="6" fill="#38bdf8" />
          </g>

          {/* 4. OPTIONAL INDICATIVE THERMAL OVERLAY GRADIENT */}
          {showThermalOverlay && (
            <g className="animate-in fade-in duration-300 pointer-events-none">
              <circle cx="200" cy="200" r="186" fill="url(#cadThermalGrad)" style={{ mixBlendMode: 'multiply' }} />
            </g>
          )}

          {/* 5. INTEGRATED CAD HALF-SECTION CUTAWAY (1/2 Longitudinal Section) + DIRECT ISO DIMENSIONS */}
          {viewMode === 'engineering-cutaway' && (
            <g className="animate-in fade-in duration-200">
              {/* Semi-transparent 1/2 Longitudinal Semicircle Background Plane (Right Half: x >= 200) */}
              <path
                d="M 200,14 A 186,186 0 0,1 200,386 Z"
                fill="#ffffff"
                fillOpacity="0.92"
                stroke="#0284c7"
                strokeWidth="2"
              />
              
              {/* Outer Ring Top Section with 45° ISO Section Hatch */}
              <path
                d="M 200,14 A 186,186 0 0,1 386,200 L 350,200 A 150,150 0 0,0 200,50 Z"
                fill="url(#isoSectionHatch)"
                stroke="#0369a1"
                strokeWidth="2"
              />

              {/* Outer Ring Bottom Section with 45° ISO Section Hatch */}
              <path
                d="M 350,200 L 386,200 A 186,186 0 0,1 200,386 L 200,350 A 150,150 0 0,0 350,200 Z"
                fill="url(#isoSectionHatch)"
                stroke="#0369a1"
                strokeWidth="2"
              />
              
              {/* Inner Ring Top Section with 45° ISO Section Hatch */}
              <path
                d="M 200,114 A 86,86 0 0,1 286,200 L 248,200 A 48,48 0 0,0 200,152 Z"
                fill="url(#isoSectionHatch)"
                stroke="#0369a1"
                strokeWidth="2"
              />

              {/* Inner Ring Bottom Section with 45° ISO Section Hatch */}
              <path
                d="M 286,200 A 86,86 0 0,1 200,286 L 200,248 A 48,48 0 0,0 248,200 Z"
                fill="url(#isoSectionHatch)"
                stroke="#0369a1"
                strokeWidth="2"
              />
              
              {/* Top Rolling Element Longitudinal Cut */}
              <circle cx="283" cy="117" r="23" fill="#f8fafc" stroke="#0284c7" strokeWidth="2.5" />
              <line x1="267" y1="133" x2="299" y2="101" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1="283" y1="94" x2="283" y2="140" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 2" />

              {/* Bottom Rolling Element Longitudinal Cut */}
              <circle cx="283" cy="283" r="23" fill="#f8fafc" stroke="#0284c7" strokeWidth="2.5" />
              <line x1="267" y1="267" x2="299" y2="299" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1="283" y1="260" x2="283" y2="306" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 2" />

              {/* Contact Angle Vector Line (Top & Bottom) */}
              <line x1="248" y1="152" x2="318" y2="82" stroke="#ea580c" strokeWidth="2" strokeDasharray="4 2" />
              <circle cx="318" cy="82" r="3" fill="#ea580c" />
              <line x1="248" y1="248" x2="318" y2="318" stroke="#ea580c" strokeWidth="2" strokeDasharray="4 2" />
              <circle cx="318" cy="318" r="3" fill="#ea580c" />

              {/* Pitch Circle Diameter (PCD dm) Dot-Dash Centerline */}
              <path
                d="M 200,82 A 118,118 0 0,1 200,318"
                fill="none"
                stroke="#0284c7"
                strokeWidth="1.8"
                strokeDasharray="8 4 2 4"
                opacity="0.9"
              />
              
              {/* Longitudinal Section Plane Dividing Centerline */}
              <line x1="200" y1="4" x2="200" y2="396" stroke="#0369a1" strokeWidth="2" strokeDasharray="14 4 3 4" opacity="0.9" />
              <line x1="8" y1="200" x2="392" y2="200" stroke="#0284c7" strokeWidth="1" strokeDasharray="10 5" opacity="0.45" />

              {/* SECTION LABELS A-A */}
              <g>
                <polygon points="200,10 193,2 207,2" fill="#0369a1" />
                <text x="214" y="14" fill="#0369a1" fontSize="12" fontWeight="900" fontFamily="JetBrains Mono, monospace">A</text>
                <polygon points="200,390 193,398 207,398" fill="#0369a1" />
                <text x="214" y="394" fill="#0369a1" fontSize="12" fontWeight="900" fontFamily="JetBrains Mono, monospace">A</text>
              </g>

              {/* DIRECT FEATURE DIMENSION 1: OUTER DIAMETER (Ø D) */}
              <g>
                <line x1="386" y1="200" x2="430" y2="200" stroke="#1d4ed8" strokeWidth="2" />
                <line x1="430" y1="200" x2="430" y2="80" stroke="#1d4ed8" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1="430" y1="80" x2="350" y2="80" stroke="#1d4ed8" strokeWidth="1.5" />
                <polygon points="386,200 376,196 376,204" fill="#1d4ed8" />

                <rect 
                  x="290" 
                  y="52" 
                  width="160" 
                  height="30" 
                  rx="8" 
                  fill="#ffffff" 
                  stroke="#1d4ed8" 
                  strokeWidth="2" 
                  filter="drop-shadow(0 3px 8px rgba(29,78,216,0.18))" 
                />
                <text x="370" y="72" fill="#1e3a8a" fontSize="13.5" fontWeight="900" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                  Ø D = {currentPart.D} mm
                </text>
              </g>

              {/* DIRECT FEATURE DIMENSION 2: PITCH CIRCLE DIAMETER (P.C.D dm) */}
              <g>
                <circle cx="318" cy="200" r="3" fill="#0284c7" />
                <line x1="318" y1="200" x2="420" y2="200" stroke="#0284c7" strokeWidth="1.8" />
                <line x1="420" y1="200" x2="420" y2="135" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1="420" y1="135" x2="330" y2="135" stroke="#0284c7" strokeWidth="1.5" />

                <rect 
                  x="280" 
                  y="110" 
                  width="170" 
                  height="28" 
                  rx="8" 
                  fill="#ffffff" 
                  stroke="#0284c7" 
                  strokeWidth="1.8" 
                  filter="drop-shadow(0 3px 6px rgba(2,132,199,0.18))" 
                />
                <text x="365" y="129" fill="#0369a1" fontSize="13" fontWeight="900" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                  P.C.D dm = {currentPart.dm} mm
                </text>
              </g>

              {/* DIRECT FEATURE DIMENSION 3: INNER BORE DIAMETER (Ø d) */}
              <g>
                <circle cx="248" cy="200" r="3" fill="#059669" />
                <line x1="248" y1="200" x2="410" y2="200" stroke="#059669" strokeWidth="1.8" />
                <line x1="410" y1="200" x2="410" y2="255" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1="410" y1="255" x2="320" y2="255" stroke="#059669" strokeWidth="1.5" />
                <polygon points="248,200 238,197 238,203" fill="#059669" />

                <rect 
                  x="290" 
                  y="235" 
                  width="160" 
                  height="30" 
                  rx="8" 
                  fill="#ffffff" 
                  stroke="#059669" 
                  strokeWidth="2" 
                  filter="drop-shadow(0 3px 8px rgba(5,150,105,0.18))" 
                />
                <text x="370" y="255" fill="#065f46" fontSize="13.5" fontWeight="900" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                  Ø d = {currentPart.d} mm
                </text>
              </g>

              {/* DIRECT FEATURE DIMENSION 4: BOUNDARY WIDTH (Width B) */}
              <g>
                <rect 
                  x="290" 
                  y="295" 
                  width="160" 
                  height="30" 
                  rx="8" 
                  fill="#ffffff" 
                  stroke="#d97706" 
                  strokeWidth="2" 
                  filter="drop-shadow(0 3px 8px rgba(217,119,6,0.18))" 
                />
                <text x="370" y="315" fill="#92400e" fontSize="13.5" fontWeight="900" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                  Width B = {currentPart.B} mm
                </text>
              </g>

              {/* Top Left Badge: ISO Standard & Chamfer Dimension */}
              <g>
                <rect 
                  x="14" 
                  y="16" 
                  width="175" 
                  height="30" 
                  rx="8" 
                  fill="#ffffff" 
                  stroke="#7c3aed" 
                  strokeWidth="1.8" 
                  filter="drop-shadow(0 2px 6px rgba(124,58,237,0.15))" 
                />
                <text x="101" y="35" fill="#5b21b6" fontSize="11" fontWeight="900" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                  r min = {currentPart.rMin} mm {currentPart.contactAngle ? `| α=${currentPart.contactAngle}` : ''}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Indicative Thermal Color Scale Bar (Shown when Thermal Overlay is Active) */}
      {showThermalOverlay && (
        <div className="relative z-10 my-1 p-2 rounded-xl bg-slate-900/90 text-white text-[10px] flex items-center justify-between shadow-sm border border-slate-700 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'fa' ? 'طیف دمایی فرضی:' : 'Indicative Thermal Scale:'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-[9px] font-mono">20°C</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-mono">65°C</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-red-600 text-[9px] font-mono">105°C</span>
          </div>
        </div>
      )}

      {/* Engineering Meta Parameters Footer Card */}
      <div className="relative z-10 my-2 p-2.5 rounded-2xl bg-white/75 border border-white/90 shadow-sm flex items-center justify-between text-[11px] text-slate-700">
        <div className="flex flex-col text-start">
          <span className="text-[10px] text-slate-400 font-bold">
            {language === 'fa' ? 'جنس قفسه نگهدارنده:' : 'Cage Retainer:'}
          </span>
          <span className="font-bold text-slate-800">
            {language === 'fa' ? currentPart.cageTypeFa : currentPart.cageTypeEn}
          </span>
        </div>
        
        <div className="flex flex-col text-end">
          <span className="text-[10px] text-slate-400 font-bold">
            {language === 'fa' ? 'کاربری و رفتار بارگذاری:' : 'Load Envelope:'}
          </span>
          <span className="font-bold text-[#232c86]">
            {language === 'fa' ? currentPart.loadTypeFa : currentPart.loadTypeEn}
          </span>
        </div>
      </div>

      {/* Bottom Controls: Speed Inspection & 2 Unified Technical View Modes */}
      <div className="relative z-10 pt-2 border-t border-white/60 flex flex-col gap-2">
        
        {/* Speed Adjustment Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <RotateCw className="w-3.5 h-3.5 text-[#232c86]" />
            <span>{language === 'fa' ? 'سرعت بازبینی (RPM):' : 'Inspection Speed (RPM):'}</span>
          </div>

          <div className="flex items-center gap-1 p-0.5 glass-pill rounded-full">
            {speedPresets.map((p) => {
              const isSelected = speedRpm === p.val && !isPaused;
              return (
                <button
                  key={p.val}
                  onClick={() => {
                    setSpeedRpm(p.val);
                    setIsPaused(false);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono-spec font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#232c86] text-white shadow-sm ring-1 ring-blue-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title={`${p.label} RPM - ${language === 'fa' ? p.descFa : p.descEn}`}
                >
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2 Unified Engineering View Modes: Kinematic 3D vs Integrated CAD Cutaway & ISO Dimensions */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-white/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setViewMode('3d')}
            className={`py-2 px-3 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === '3d'
                ? 'bg-white text-[#232c86] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'چرخش سه‌بعدی مکانیکی' : 'Kinematic 3D Assembly'}</span>
          </button>

          <button
            onClick={() => setViewMode('engineering-cutaway')}
            className={`py-2 px-3 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'engineering-cutaway'
                ? 'bg-white text-[#232c86] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'مقطع فنی و ابعاد هندسی (ISO)' : 'Integrated CAD & ISO Dims'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
