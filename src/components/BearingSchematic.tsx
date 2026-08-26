import React from 'react';
import { BearingProduct } from '../types';

interface BearingSchematicProps {
  product: BearingProduct;
  className?: string;
  showLabels?: boolean;
}

export const BearingSchematic: React.FC<BearingSchematicProps> = ({
  product,
  className = 'w-full h-48',
  showLabels = true,
}) => {
  const { schematicType, d, D, B, code } = product;

  return (
    <div className={`relative flex items-center justify-center p-2.5 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800/80 select-none overflow-hidden ${className}`}>
      {/* Precision Engineering Coordinates Grid */}
      <div className="absolute inset-0 engineering-grid-light opacity-15 pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <svg
        viewBox="0 0 420 210"
        className="w-full h-full max-w-[390px] drop-shadow-md select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Engineering Ground Steel Cross-Section Gradient */}
          <linearGradient id="schematicSteelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="25%" stopColor="#cbd5e1" />
            <stop offset="55%" stopColor="#64748b" />
            <stop offset="85%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Precision Machined Brass / Gold Element Gradient */}
          <radialGradient id="schematicBallGrad" cx="30%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>

          {/* Chrome Steel Roller Gradient */}
          <linearGradient id="schematicRollerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="25%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="75%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Hatch Pattern for Sectional Cuts */}
          <pattern id="hatchPattern" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.75" opacity="0.35" />
          </pattern>

          {/* Marker Arrows for Engineering Dimensions */}
          <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,1 L6,3 L0,5 Z" fill="#2563eb" />
          </marker>
          <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,1 L6,3 L0,5 Z" fill="#059669" />
          </marker>
          <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,1 L6,3 L0,5 Z" fill="#d97706" />
          </marker>
        </defs>

        {/* Center Line Axis (ISO 128 Engineering Centerline) */}
        <line x1="15" y1="105" x2="235" y2="105" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="10 4 2 4" opacity="0.85" />
        
        {/* --- DEEP GROOVE BALL BEARING CROSS-SECTION --- */}
        {schematicType === 'deep-groove' && (
          <g transform="translate(10, 15)">
            {/* Outer Ring Top */}
            <rect x="50" y="10" width="85" height="26" rx="2" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <rect x="50" y="10" width="85" height="26" fill="url(#hatchPattern)" />
            {/* Outer Ring Bottom */}
            <rect x="50" y="144" width="85" height="26" rx="2" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <rect x="50" y="144" width="85" height="26" fill="url(#hatchPattern)" />

            {/* Inner Ring Top */}
            <rect x="50" y="58" width="85" height="24" rx="2" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <rect x="50" y="58" width="85" height="24" fill="url(#hatchPattern)" />
            {/* Inner Ring Bottom */}
            <rect x="50" y="98" width="85" height="24" rx="2" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <rect x="50" y="98" width="85" height="24" fill="url(#hatchPattern)" />

            {/* Spherical Balls */}
            <circle cx="92.5" cy="46" r="13" fill="url(#schematicBallGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="89" cy="42" r="3.5" fill="#ffffff" opacity="0.9" />
            <circle cx="92.5" cy="134" r="13" fill="url(#schematicBallGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="89" cy="130" r="3.5" fill="#ffffff" opacity="0.9" />

            {/* Rubber Seals 2RS */}
            <line x1="58" y1="36" x2="58" y2="58" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="127" y1="36" x2="127" y2="58" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="58" y1="122" x2="58" y2="144" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="127" y1="122" x2="127" y2="144" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* --- TAPERED ROLLER BEARING CROSS-SECTION --- */}
        {schematicType === 'tapered' && (
          <g transform="translate(10, 15)">
            <polygon points="50,10 135,18 135,36 50,26" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <polygon points="50,10 135,18 135,36 50,26" fill="url(#hatchPattern)" />
            <polygon points="50,170 135,162 135,144 50,154" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <polygon points="50,170 135,162 135,144 50,154" fill="url(#hatchPattern)" />

            <polygon points="58,32 128,42 120,64 50,51" fill="url(#schematicRollerGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <polygon points="58,148 128,138 120,116 50,129" fill="url(#schematicRollerGrad)" stroke="#0f172a" strokeWidth="1.2" />

            <polygon points="45,56 122,69 122,82 45,82" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <polygon points="45,56 122,69 122,82 45,82" fill="url(#hatchPattern)" />
            <polygon points="45,124 122,111 122,98 45,98" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <polygon points="45,124 122,111 122,98 45,98" fill="url(#hatchPattern)" />
          </g>
        )}

        {/* --- SPHERICAL ROLLER BEARING CROSS-SECTION --- */}
        {schematicType === 'spherical' && (
          <g transform="translate(10, 15)">
            <path d="M 45 10 Q 92 22 140 10 L 140 32 Q 92 42 45 32 Z" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <path d="M 45 10 Q 92 22 140 10 L 140 32 Q 92 42 45 32 Z" fill="url(#hatchPattern)" />
            <circle cx="92.5" cy="16" r="2.5" fill="#38bdf8" />

            <ellipse cx="70" cy="46" rx="12" ry="9" transform="rotate(-15 70 46)" fill="url(#schematicRollerGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <ellipse cx="115" cy="46" rx="12" ry="9" transform="rotate(15 115 46)" fill="url(#schematicRollerGrad)" stroke="#0f172a" strokeWidth="1.2" />
            
            <ellipse cx="70" cy="134" rx="12" ry="9" transform="rotate(15 70 134)" fill="url(#schematicRollerGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <ellipse cx="115" cy="134" rx="12" ry="9" transform="rotate(-15 115 134)" fill="url(#schematicRollerGrad)" stroke="#0f172a" strokeWidth="1.2" />

            <polygon points="45,62 140,62 140,82 45,78" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <polygon points="45,62 140,62 140,82 45,78" fill="url(#hatchPattern)" />
            <polygon points="45,118 140,118 140,98 45,102" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <polygon points="45,118 140,118 140,98 45,102" fill="url(#hatchPattern)" />
          </g>
        )}

        {/* --- CYLINDRICAL ROLLER BEARING CROSS-SECTION --- */}
        {schematicType === 'cylindrical' && (
          <g transform="translate(10, 15)">
            <path d="M 48 10 L 138 10 L 138 34 L 128 34 L 128 26 L 58 26 L 58 34 L 48 34 Z" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <rect x="60" y="32" width="65" height="22" rx="2" fill="url(#schematicRollerGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <rect x="48" y="60" width="90" height="20" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />

            <path d="M 48 170 L 138 170 L 138 146 L 128 146 L 128 154 L 58 154 L 58 146 L 48 146 Z" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <rect x="60" y="126" width="65" height="22" rx="2" fill="url(#schematicRollerGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <rect x="48" y="100" width="90" height="20" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
          </g>
        )}

        {/* --- THRUST BALL BEARING CROSS-SECTION --- */}
        {schematicType === 'thrust' && (
          <g transform="translate(10, 15)">
            <rect x="50" y="15" width="85" height="20" rx="2" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <circle cx="70" cy="52" r="11" fill="url(#schematicBallGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="115" cy="52" r="11" fill="url(#schematicBallGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <rect x="50" y="70" width="85" height="20" rx="2" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />

            <rect x="50" y="110" width="85" height="20" rx="2" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <circle cx="70" cy="147" r="11" fill="url(#schematicBallGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="115" cy="147" r="11" fill="url(#schematicBallGrad)" stroke="#0f172a" strokeWidth="1.2" />
            <rect x="50" y="165" width="85" height="20" rx="2" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
          </g>
        )}

        {/* --- PILLOW BLOCK HOUSING UNIT CROSS-SECTION --- */}
        {schematicType === 'pillow-block' && (
          <g transform="translate(5, 10)">
            <path d="M 30 160 L 30 135 C 30 100 60 55 110 55 C 160 55 190 100 190 135 L 190 160 L 165 160 L 165 135 C 165 110 140 85 110 85 C 80 85 55 110 55 135 L 55 160 Z" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="110" cy="105" r="30" fill="url(#schematicSteelGrad)" stroke="#475569" strokeWidth="1.5" />
            <circle cx="110" cy="105" r="16" fill="#020617" stroke="#334155" strokeWidth="1.5" />
            <rect x="107" y="42" width="6" height="12" fill="#eab308" stroke="#854d0e" strokeWidth="1" />
          </g>
        )}

        {/* --- ROTARY SHAFT OIL SEAL CROSS-SECTION --- */}
        {schematicType === 'oil-seal' && (
          <g transform="translate(15, 15)">
            <path d="M 50 15 L 130 15 L 130 35 L 115 35 L 115 26 L 65 26 L 65 70 L 50 70 Z" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
            <path d="M 65 26 L 115 26 L 115 38 L 98 48 L 90 74 L 80 74 L 78 54 L 65 54 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
            <circle cx="102" cy="58" r="5" fill="#facc15" stroke="#854d0e" strokeWidth="1" />

            <path d="M 50 165 L 130 165 L 130 145 L 115 145 L 115 154 L 65 154 L 65 110 L 50 110 Z" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
            <path d="M 65 154 L 115 154 L 115 142 L 98 132 L 90 106 L 80 106 L 78 126 L 65 126 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
            <circle cx="102" cy="122" r="5" fill="#facc15" stroke="#854d0e" strokeWidth="1" />
          </g>
        )}

        {/* ========================================================================= */}
        {/* USABLE GEOMETRIC DIMENSIONS POINTING TO EXACT PART WITH RIGHT-SIDE BADGES */}
        {/* ========================================================================= */}
        {showLabels && d > 0 && D > 0 && B > 0 && (
          <g className="animate-in fade-in duration-200">
            {/* ----------------------------------------------------------------- */}
            {/* 1. OUTER DIAMETER (Ø D): Pointing directly to top outer surface */}
            {/* ----------------------------------------------------------------- */}
            <g>
              {/* Pointer dot & arrow on Outer Ring top edge at (145, 25) */}
              <circle cx="145" cy="25" r="3.5" fill="#2563eb" />
              {/* Leader line extending horizontally right, dogleg step, to badge */}
              <line x1="145" y1="25" x2="235" y2="25" stroke="#2563eb" strokeWidth="2" />
              <line x1="235" y1="25" x2="250" y2="35" stroke="#2563eb" strokeWidth="2" />
              <line x1="250" y1="35" x2="270" y2="35" stroke="#2563eb" strokeWidth="2" />

              {/* Big High-Contrast Badge for Ø D */}
              <rect 
                x="270" 
                y="18" 
                width="142" 
                height="34" 
                rx="10" 
                fill="#ffffff" 
                stroke="#2563eb" 
                strokeWidth="2.5" 
                filter="drop-shadow(0 4px 10px rgba(37,99,235,0.3))" 
              />
              <rect x="272" y="20" width="138" height="30" rx="8" fill="#eff6ff" opacity="0.6" />
              <text x="341" y="40" fill="#1e3a8a" fontSize="14" fontWeight="900" fontFamily="SF Mono, JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.6">
                Ø D = {D} mm
              </text>
            </g>

            {/* ----------------------------------------------------------------- */}
            {/* 2. INNER BORE DIAMETER (Ø d): Pointing directly to inner bore edge */}
            {/* ----------------------------------------------------------------- */}
            <g>
              {/* Pointer dot on Inner Ring bore edge at (145, 73) */}
              <circle cx="145" cy="73" r="3.5" fill="#059669" />
              {/* Leader line extending horizontally right, dogleg step, to badge */}
              <line x1="145" y1="73" x2="230" y2="73" stroke="#059669" strokeWidth="2" />
              <line x1="230" y1="73" x2="248" y2="87" stroke="#059669" strokeWidth="2" />
              <line x1="248" y1="87" x2="270" y2="87" stroke="#059669" strokeWidth="2" />

              {/* Big High-Contrast Badge for Ø d */}
              <rect 
                x="270" 
                y="70" 
                width="142" 
                height="34" 
                rx="10" 
                fill="#ffffff" 
                stroke="#059669" 
                strokeWidth="2.5" 
                filter="drop-shadow(0 4px 10px rgba(5,150,105,0.3))" 
              />
              <rect x="272" y="72" width="138" height="30" rx="8" fill="#ecfdf5" opacity="0.6" />
              <text x="341" y="92" fill="#065f46" fontSize="14" fontWeight="900" fontFamily="SF Mono, JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.6">
                Ø d = {d} mm
              </text>
            </g>

            {/* ----------------------------------------------------------------- */}
            {/* 3. WIDTH / THICKNESS (B): Pointing to ring thickness width */}
            {/* ----------------------------------------------------------------- */}
            <g>
              {/* Dimension projection lines and bracket on the bearing width */}
              <line x1="60" y1="12" x2="145" y2="12" stroke="#d97706" strokeWidth="2" />
              <line x1="60" y1="7" x2="60" y2="17" stroke="#d97706" strokeWidth="2" />
              <line x1="145" y1="7" x2="145" y2="17" stroke="#d97706" strokeWidth="2" />
              
              {/* Pointer dot on ring side wall at (145, 122) */}
              <circle cx="145" cy="122" r="3.5" fill="#d97706" />
              {/* Leader line extending horizontally right to badge */}
              <line x1="145" y1="122" x2="225" y2="122" stroke="#d97706" strokeWidth="2" />
              <line x1="225" y1="122" x2="245" y2="139" stroke="#d97706" strokeWidth="2" />
              <line x1="245" y1="139" x2="270" y2="139" stroke="#d97706" strokeWidth="2" />

              {/* Big High-Contrast Badge for B */}
              <rect 
                x="270" 
                y="122" 
                width="142" 
                height="34" 
                rx="10" 
                fill="#ffffff" 
                stroke="#d97706" 
                strokeWidth="2.5" 
                filter="drop-shadow(0 4px 10px rgba(217,119,6,0.3))" 
              />
              <rect x="272" y="124" width="138" height="30" rx="8" fill="#fffbeb" opacity="0.6" />
              <text x="341" y="144" fill="#92400e" fontSize="14" fontWeight="900" fontFamily="SF Mono, JetBrains Mono, monospace" textAnchor="middle" letterSpacing="0.6">
                B = {B} mm
              </text>
            </g>

            {/* Quick Geometric Ratio Badge at Bottom Right */}
            <g>
              <rect 
                x="270" 
                y="166" 
                width="142" 
                height="26" 
                rx="8" 
                fill="#1e293b" 
                stroke="#475569" 
                strokeWidth="1.5" 
              />
              <text x="341" y="183" fill="#93c5fd" fontSize="11" fontWeight="700" fontFamily="SF Mono, JetBrains Mono, monospace" textAnchor="middle">
                ISO 15:2017 CAD
              </text>
            </g>
          </g>
        )}
      </svg>
      
      {/* Top Left Engineering Part Code Pill */}
      <div className="absolute top-2.5 start-2.5 px-2.5 py-1 text-[10.5px] font-mono-spec font-extrabold rounded-lg bg-slate-900/90 text-blue-200 border border-blue-500/30 backdrop-blur-md shadow-sm">
        CAD: {code}
      </div>
    </div>
  );
};
