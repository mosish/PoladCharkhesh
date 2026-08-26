import React from 'react';

interface LogoProps {
  variant?: 'emblem' | 'full' | 'horizontal' | 'vertical';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isDark?: boolean;
  language?: 'fa' | 'en';
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  isDark = false,
  language = 'fa',
}) => {
  // Dimension mapping
  const sizeMap = {
    xs: { icon: 28, text: 'text-sm', sub: 'text-[9px]' },
    sm: { icon: 36, text: 'text-base', sub: 'text-[10px]' },
    md: { icon: 44, text: 'text-lg', sub: 'text-[11px]' },
    lg: { icon: 56, text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 84, text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  // The primary brand color of the uploaded logo: Deep Royal Industrial Blue
  // In light mode: #232c86 / #1e2678
  // In dark mode: #3b82f6 / #60a5fa or crisp white with royal blue glow
  const primaryColor = isDark ? '#60a5fa' : '#232c86';
  const highlightColor = isDark ? '#93c5fd' : '#3b82f6';
  const whiteSlitColor = isDark ? '#0f172a' : '#ffffff';

  // Crisp Vector Emblem matching PooladCharkhesh.png
  const renderEmblemSvg = (dim: number) => (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        <linearGradient id={`pc-blue-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#60a5fa' : '#2b3699'} />
          <stop offset="50%" stopColor={isDark ? '#3b82f6' : '#232c86'} />
          <stop offset="100%" stopColor={isDark ? '#2563eb' : '#1a226b'} />
        </linearGradient>
        <filter id={`pc-glow-${size}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={isDark ? '#3b82f6' : '#1e2678'} floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter={`url(#pc-glow-${size})`}>
        {/* 1. TOP LUBRICATION DROPLET / CONE */}
        <path
          d="M 250 15 
             C 250 15, 205 120, 160 190 
             C 125 245, 95 270, 95 270 
             L 405 270 
             C 405 270, 375 245, 340 190 
             C 295 120, 250 15, 250 15 Z"
          fill={`url(#pc-blue-grad-${size})`}
        />

        {/* Droplet Highlight Slit (White Reflection) */}
        <path
          d="M 285 85 
             L 345 220 
             L 330 235 
             L 270 100 Z"
          fill={whiteSlitColor}
          opacity="0.95"
        />

        {/* 2. INDUSTRIAL GEAR COG (Middle & Lower Section) */}
        <path
          d="M 70 275 
             L 145 275 
             L 145 320 
             L 175 320 
             L 180 345 
             L 210 345 
             L 215 365 
             L 285 365 
             L 290 345 
             L 320 345 
             L 325 320 
             L 355 320 
             L 355 275 
             L 430 275 
             L 430 330 
             L 395 330 
             L 385 360 
             L 410 380 
             L 385 410 
             L 350 400 
             L 330 425 
             L 335 455 
             L 300 465 
             L 280 440 
             L 250 445 
             L 220 440 
             L 200 465 
             L 165 455 
             L 170 425 
             L 150 400 
             L 115 410 
             L 90 380 
             L 115 360 
             L 105 330 
             L 70 330 Z"
          fill={`url(#pc-blue-grad-${size})`}
        />

        {/* Central Inner Hollow Cutout */}
        <circle cx="250" cy="335" r="52" fill={isDark ? '#0b0f19' : '#ffffff'} />

        {/* Inner Hub Gear / Concentric Ring */}
        <circle cx="250" cy="335" r="32" fill={`url(#pc-blue-grad-${size})`} />
        <circle cx="250" cy="335" r="14" fill={isDark ? '#0b0f19' : '#ffffff'} />
      </g>
    </svg>
  );

  if (variant === 'emblem') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderEmblemSvg(currentSize.icon)}</div>;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        {renderEmblemSvg(currentSize.icon * 1.4)}
        <div className="flex flex-col items-center">
          <span className={`font-black tracking-tight leading-tight text-slate-900 dark:text-white ${currentSize.text}`}>
            {language === 'fa' ? 'پولاد چرخِش آرین تک' : 'PoladCharkhesh Arian Tak'}
          </span>
          <span className={`font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase ${currentSize.sub}`}>
            {language === 'fa' ? 'تأمین تخصصی بلبرینگ و کاسه نمد صنعتی' : 'Industrial Bearings & Sealing Solutions'}
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal brand presentation
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {renderEmblemSvg(currentSize.icon)}
      
      <div className="flex flex-col text-start justify-center">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight leading-tight text-slate-900 dark:text-white font-mono-spec ${currentSize.text}`}>
            {language === 'fa' ? 'پولاد چرخِش آرین تک' : 'PoladCharkhesh'}
          </span>
        </div>
        <span className={`font-bold tracking-wider text-[#232c86] dark:text-blue-400 block uppercase ${currentSize.sub}`}>
          {language === 'fa' ? 'بلبرینگ، رولبرینگ و کاسه نمد صنعتی' : 'Arian Tak Bearings & Seals'}
        </span>
      </div>
    </div>
  );
};
