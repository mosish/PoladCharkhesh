// ISO 5753-1 Radial Internal Clearance (RIC) Standard Tables & ISO Shaft/Housing Tolerances

export type BearingFamily = 
  | 'deep-groove-ball'
  | 'cylindrical-roller'
  | 'spherical-roller-cyl'
  | 'spherical-roller-taper'
  | 'self-aligning-ball'
  | 'angular-contact-double';

export interface ClearanceRange {
  minBore: number; // > minBore (mm)
  maxBore: number; // <= maxBore (mm)
  c2: [number, number]; // [min, max] in μm
  cn: [number, number];
  c3: [number, number];
  c4: [number, number];
  c5: [number, number];
}

// ISO 5753-1:2009 Standard Tables
export const ISO_5753_TABLES: Record<BearingFamily, ClearanceRange[]> = {
  // Table 1: Deep Groove Ball Bearings (Cylindrical Bore)
  'deep-groove-ball': [
    { minBore: 2.5, maxBore: 6, c2: [0, 7], cn: [2, 13], c3: [8, 23], c4: [14, 29], c5: [20, 37] },
    { minBore: 6, maxBore: 10, c2: [0, 7], cn: [2, 13], c3: [8, 23], c4: [14, 29], c5: [20, 37] },
    { minBore: 10, maxBore: 18, c2: [0, 9], cn: [3, 18], c3: [11, 25], c4: [18, 33], c5: [25, 45] },
    { minBore: 18, maxBore: 24, c2: [0, 10], cn: [5, 20], c3: [13, 28], c4: [20, 36], c5: [28, 48] },
    { minBore: 24, maxBore: 30, c2: [1, 11], cn: [5, 20], c3: [13, 28], c4: [23, 41], c5: [30, 53] },
    { minBore: 30, maxBore: 40, c2: [1, 11], cn: [6, 20], c3: [15, 33], c4: [28, 46], c5: [40, 64] },
    { minBore: 40, maxBore: 50, c2: [1, 11], cn: [6, 23], c3: [18, 36], c4: [30, 51], c5: [45, 73] },
    { minBore: 50, maxBore: 65, c2: [1, 15], cn: [8, 28], c3: [23, 43], c4: [38, 61], c5: [55, 90] },
    { minBore: 65, maxBore: 80, c2: [1, 15], cn: [10, 30], c3: [25, 51], c4: [46, 71], c5: [65, 105] },
    { minBore: 80, maxBore: 100, c2: [1, 18], cn: [12, 36], c3: [30, 58], c4: [53, 84], c5: [75, 120] },
    { minBore: 100, maxBore: 120, c2: [2, 20], cn: [15, 41], c3: [36, 66], c4: [61, 97], c5: [90, 140] },
    { minBore: 120, maxBore: 140, c2: [2, 23], cn: [18, 48], c3: [41, 81], c4: [71, 114], c5: [105, 160] },
    { minBore: 140, maxBore: 160, c2: [2, 23], cn: [18, 53], c3: [46, 91], c4: [81, 130], c5: [120, 180] },
    { minBore: 160, maxBore: 180, c2: [2, 25], cn: [20, 61], c3: [53, 102], c4: [91, 147], c5: [135, 200] },
    { minBore: 180, maxBore: 200, c2: [2, 30], cn: [25, 71], c3: [63, 117], c4: [107, 163], c5: [150, 230] },
    { minBore: 200, maxBore: 225, c2: [2, 35], cn: [25, 85], c3: [75, 140], c4: [125, 195], c5: [175, 265] },
    { minBore: 225, maxBore: 250, c2: [2, 40], cn: [30, 95], c3: [85, 160], c4: [145, 225], c5: [205, 300] },
    { minBore: 250, maxBore: 280, c2: [2, 45], cn: [35, 105], c3: [90, 170], c4: [155, 245], c5: [225, 340] },
    { minBore: 280, maxBore: 315, c2: [2, 50], cn: [40, 115], c3: [100, 190], c4: [175, 270], c5: [245, 370] },
    { minBore: 315, maxBore: 355, c2: [3, 55], cn: [45, 125], c3: [110, 210], c4: [195, 300], c5: [275, 410] },
    { minBore: 355, maxBore: 400, c2: [3, 60], cn: [55, 145], c3: [130, 240], c4: [225, 340], c5: [315, 460] },
    { minBore: 400, maxBore: 450, c2: [3, 70], cn: [60, 165], c3: [150, 270], c4: [255, 380], c5: [355, 510] },
    { minBore: 450, maxBore: 500, c2: [3, 80], cn: [70, 190], c3: [170, 300], c4: [285, 420], c5: [395, 560] },
  ],

  // Table 2: Cylindrical Roller Bearings (Cylindrical Bore, Matched Rings)
  'cylindrical-roller': [
    { minBore: 10, maxBore: 20, c2: [0, 20], cn: [10, 30], c3: [25, 45], c4: [35, 55], c5: [45, 65] },
    { minBore: 20, maxBore: 24, c2: [0, 20], cn: [10, 30], c3: [25, 45], c4: [35, 55], c5: [45, 65] },
    { minBore: 24, maxBore: 30, c2: [0, 25], cn: [10, 35], c3: [30, 55], c4: [40, 65], c5: [50, 75] },
    { minBore: 30, maxBore: 40, c2: [5, 30], cn: [15, 40], c3: [35, 60], c4: [45, 75], c5: [65, 95] },
    { minBore: 40, maxBore: 50, c2: [5, 35], cn: [20, 45], c3: [40, 70], c4: [55, 85], c5: [75, 110] },
    { minBore: 50, maxBore: 65, c2: [5, 40], cn: [25, 55], c3: [45, 80], c4: [65, 100], c5: [90, 130] },
    { minBore: 65, maxBore: 80, c2: [10, 45], cn: [30, 65], c3: [55, 95], c4: [75, 120], c5: [105, 150] },
    { minBore: 80, maxBore: 100, c2: [10, 55], cn: [35, 80], c3: [65, 110], c4: [90, 140], c5: [130, 180] },
    { minBore: 100, maxBore: 120, c2: [10, 60], cn: [40, 90], c3: [80, 130], c4: [105, 165], c5: [155, 215] },
    { minBore: 120, maxBore: 140, c2: [15, 70], cn: [50, 105], c3: [95, 150], c4: [125, 190], c5: [180, 245] },
    { minBore: 140, maxBore: 160, c2: [15, 75], cn: [55, 115], c3: [100, 165], c4: [135, 210], c5: [200, 275] },
    { minBore: 160, maxBore: 180, c2: [15, 80], cn: [60, 125], c3: [110, 180], c4: [150, 230], c5: [220, 300] },
    { minBore: 180, maxBore: 200, c2: [20, 90], cn: [65, 135], c3: [120, 200], c4: [165, 255], c5: [240, 330] },
    { minBore: 200, maxBore: 225, c2: [20, 95], cn: [75, 150], c3: [135, 220], c4: [185, 280], c5: [265, 370] },
    { minBore: 225, maxBore: 250, c2: [25, 105], cn: [85, 165], c3: [150, 240], c4: [205, 310], c5: [295, 410] },
    { minBore: 250, maxBore: 280, c2: [25, 115], cn: [90, 180], c3: [165, 265], c4: [225, 340], c5: [320, 450] },
    { minBore: 280, maxBore: 315, c2: [30, 125], cn: [100, 195], c3: [180, 290], c4: [245, 370], c5: [350, 490] },
    { minBore: 315, maxBore: 355, c2: [30, 135], cn: [110, 215], c3: [200, 320], c4: [275, 410], c5: [390, 540] },
    { minBore: 355, maxBore: 400, c2: [35, 150], cn: [120, 240], c3: [225, 360], c4: [310, 460], c5: [440, 600] },
    { minBore: 400, maxBore: 450, c2: [35, 160], cn: [130, 260], c3: [245, 395], c4: [340, 510], c5: [490, 670] },
    { minBore: 450, maxBore: 500, c2: [40, 180], cn: [145, 290], c3: [275, 440], c4: [385, 570], c5: [540, 750] },
  ],

  // Table 3: Spherical Roller Bearings (Cylindrical Bore)
  'spherical-roller-cyl': [
    { minBore: 18, maxBore: 24, c2: [10, 20], cn: [20, 35], c3: [35, 45], c4: [45, 60], c5: [60, 75] },
    { minBore: 24, maxBore: 30, c2: [15, 25], cn: [25, 40], c3: [40, 55], c4: [55, 75], c5: [75, 95] },
    { minBore: 30, maxBore: 40, c2: [15, 30], cn: [30, 45], c3: [45, 60], c4: [60, 80], c5: [80, 100] },
    { minBore: 40, maxBore: 50, c2: [20, 35], cn: [35, 55], c3: [55, 75], c4: [75, 100], c5: [100, 125] },
    { minBore: 50, maxBore: 65, c2: [20, 40], cn: [40, 65], c3: [65, 90], c4: [90, 120], c5: [120, 150] },
    { minBore: 65, maxBore: 80, c2: [30, 50], cn: [50, 80], c3: [80, 110], c4: [110, 145], c5: [145, 180] },
    { minBore: 80, maxBore: 100, c2: [35, 60], cn: [60, 100], c3: [100, 135], c4: [135, 180], c5: [180, 225] },
    { minBore: 100, maxBore: 120, c2: [40, 75], cn: [75, 120], c3: [120, 160], c4: [160, 210], c5: [210, 260] },
    { minBore: 120, maxBore: 140, c2: [50, 95], cn: [95, 145], c3: [145, 190], c4: [190, 240], c5: [240, 300] },
    { minBore: 140, maxBore: 160, c2: [60, 110], cn: [110, 170], c3: [170, 220], c4: [220, 280], c5: [280, 350] },
    { minBore: 160, maxBore: 180, c2: [65, 120], cn: [120, 180], c3: [180, 240], c4: [240, 310], c5: [310, 390] },
    { minBore: 180, maxBore: 200, c2: [70, 130], cn: [130, 200], c3: [200, 260], c4: [260, 340], c5: [340, 430] },
    { minBore: 200, maxBore: 225, c2: [80, 140], cn: [140, 220], c3: [220, 290], c4: [290, 380], c5: [380, 470] },
    { minBore: 225, maxBore: 250, c2: [90, 150], cn: [150, 240], c3: [240, 320], c4: [320, 420], c5: [420, 520] },
    { minBore: 250, maxBore: 280, c2: [100, 170], cn: [170, 260], c3: [260, 350], c4: [350, 460], c5: [460, 570] },
    { minBore: 280, maxBore: 315, c2: [110, 190], cn: [190, 280], c3: [280, 370], c4: [370, 500], c5: [500, 630] },
    { minBore: 315, maxBore: 355, c2: [120, 200], cn: [200, 310], c3: [310, 410], c4: [410, 550], c5: [550, 690] },
    { minBore: 355, maxBore: 400, c2: [130, 220], cn: [220, 340], c3: [340, 450], c4: [450, 600], c5: [600, 750] },
    { minBore: 400, maxBore: 450, c2: [140, 240], cn: [240, 370], c3: [370, 500], c4: [500, 660], c5: [660, 820] },
    { minBore: 450, maxBore: 500, c2: [140, 260], cn: [260, 410], c3: [410, 550], c4: [550, 720], c5: [720, 900] },
  ],

  // Table 4: Spherical Roller Bearings (Tapered Bore 1:12 / 1:30 - e.g. K series)
  'spherical-roller-taper': [
    { minBore: 18, maxBore: 24, c2: [15, 25], cn: [25, 35], c3: [35, 45], c4: [45, 60], c5: [60, 75] },
    { minBore: 24, maxBore: 30, c2: [20, 30], cn: [30, 40], c3: [40, 55], c4: [55, 75], c5: [75, 95] },
    { minBore: 30, maxBore: 40, c2: [25, 35], cn: [35, 50], c3: [50, 65], c4: [65, 85], c5: [85, 105] },
    { minBore: 40, maxBore: 50, c2: [30, 45], cn: [45, 60], c3: [60, 80], c4: [80, 100], c5: [100, 130] },
    { minBore: 50, maxBore: 65, c2: [40, 55], cn: [55, 75], c3: [75, 95], c4: [95, 120], c5: [120, 160] },
    { minBore: 65, maxBore: 80, c2: [50, 70], cn: [70, 95], c3: [95, 120], c4: [120, 150], c5: [150, 200] },
    { minBore: 80, maxBore: 100, c2: [55, 80], cn: [80, 110], c3: [110, 140], c4: [140, 180], c5: [180, 230] },
    { minBore: 100, maxBore: 120, c2: [65, 100], cn: [100, 135], c3: [135, 170], c4: [170, 220], c5: [220, 280] },
    { minBore: 120, maxBore: 140, c2: [80, 120], cn: [120, 160], c3: [160, 200], c4: [200, 260], c5: [260, 330] },
    { minBore: 140, maxBore: 160, c2: [90, 130], cn: [130, 180], c3: [180, 230], c4: [230, 300], c5: [300, 380] },
    { minBore: 160, maxBore: 180, c2: [100, 140], cn: [140, 200], c3: [200, 260], c4: [260, 340], c5: [340, 430] },
    { minBore: 180, maxBore: 200, c2: [110, 160], cn: [160, 220], c3: [220, 290], c4: [290, 370], c5: [370, 470] },
    { minBore: 200, maxBore: 225, c2: [120, 180], cn: [180, 250], c3: [250, 320], c4: [320, 410], c5: [410, 520] },
    { minBore: 225, maxBore: 250, c2: [140, 200], cn: [200, 270], c3: [270, 350], c4: [350, 450], c5: [450, 570] },
    { minBore: 250, maxBore: 280, c2: [150, 220], cn: [220, 300], c3: [300, 390], c4: [390, 490], c5: [490, 620] },
    { minBore: 280, maxBore: 315, c2: [170, 240], cn: [240, 330], c3: [330, 430], c4: [430, 540], c5: [540, 680] },
    { minBore: 315, maxBore: 355, c2: [190, 270], cn: [270, 360], c3: [360, 470], c4: [470, 590], c5: [590, 740] },
    { minBore: 355, maxBore: 400, c2: [210, 300], cn: [300, 400], c3: [400, 520], c4: [520, 650], c5: [650, 820] },
    { minBore: 400, maxBore: 450, c2: [230, 330], cn: [330, 440], c3: [440, 570], c4: [570, 720], c5: [720, 910] },
    { minBore: 450, maxBore: 500, c2: [260, 370], cn: [370, 490], c3: [490, 630], c4: [630, 790], c5: [790, 1000] },
  ],

  // Table 5: Self-Aligning Ball Bearings (Cylindrical Bore)
  'self-aligning-ball': [
    { minBore: 6, maxBore: 10, c2: [1, 8], cn: [5, 15], c3: [10, 20], c4: [15, 25], c5: [21, 33] },
    { minBore: 10, maxBore: 14, c2: [2, 10], cn: [6, 17], c3: [12, 25], c4: [19, 33], c5: [27, 42] },
    { minBore: 14, maxBore: 18, c2: [3, 12], cn: [8, 21], c3: [15, 28], c4: [23, 37], c5: [33, 50] },
    { minBore: 18, maxBore: 24, c2: [4, 14], cn: [10, 23], c3: [17, 30], c4: [25, 39], c5: [34, 52] },
    { minBore: 24, maxBore: 30, c2: [5, 16], cn: [11, 24], c3: [19, 35], c4: [29, 46], c5: [40, 58] },
    { minBore: 30, maxBore: 40, c2: [6, 18], cn: [13, 29], c3: [23, 40], c4: [34, 53], c5: [46, 66] },
    { minBore: 40, maxBore: 50, c2: [6, 19], cn: [14, 31], c3: [25, 44], c4: [37, 57], c5: [50, 71] },
    { minBore: 50, maxBore: 65, c2: [7, 21], cn: [16, 36], c3: [30, 50], c4: [45, 69], c5: [62, 88] },
    { minBore: 65, maxBore: 80, c2: [8, 24], cn: [18, 40], c3: [35, 60], c4: [54, 83], c5: [76, 108] },
    { minBore: 80, maxBore: 100, c2: [9, 27], cn: [22, 48], c3: [42, 70], c4: [64, 96], c5: [89, 124] },
    { minBore: 100, maxBore: 120, c2: [10, 31], cn: [25, 56], c3: [50, 83], c4: [75, 114], c5: [105, 145] },
  ],

  // Double Row Angular Contact Ball Bearings
  'angular-contact-double': [
    { minBore: 10, maxBore: 18, c2: [1, 11], cn: [5, 15], c3: [10, 20], c4: [15, 25], c5: [22, 35] },
    { minBore: 18, maxBore: 24, c2: [1, 11], cn: [6, 19], c3: [13, 26], c4: [20, 34], c5: [28, 44] },
    { minBore: 24, maxBore: 30, c2: [1, 11], cn: [6, 19], c3: [13, 26], c4: [20, 34], c5: [28, 44] },
    { minBore: 30, maxBore: 40, c2: [2, 13], cn: [7, 21], c3: [15, 29], c4: [23, 38], c5: [32, 49] },
    { minBore: 40, maxBore: 50, c2: [2, 14], cn: [9, 24], c3: [18, 33], c4: [27, 43], c5: [37, 55] },
    { minBore: 50, maxBore: 65, c2: [3, 16], cn: [11, 27], c3: [21, 38], c4: [32, 50], c5: [43, 63] },
    { minBore: 65, maxBore: 80, c2: [4, 19], cn: [13, 32], c3: [25, 45], c4: [37, 59], c5: [51, 75] },
    { minBore: 80, maxBore: 100, c2: [5, 23], cn: [16, 38], c3: [30, 54], c4: [45, 71], c5: [62, 90] },
    { minBore: 100, maxBore: 120, c2: [6, 27], cn: [19, 45], c3: [36, 64], c4: [54, 84], c5: [74, 106] },
  ],
};

// Retrieve exact ISO 5753-1 RIC limits for any bearing family and bore diameter
export function getISO5753Clearance(
  family: BearingFamily,
  boreMm: number
): ClearanceRange | null {
  const table = ISO_5753_TABLES[family] || ISO_5753_TABLES['deep-groove-ball'];
  const match = table.find(
    (row) => boreMm > row.minBore && boreMm <= row.maxBore
  );

  if (match) return match;
  // If smaller than min in table, use first row
  if (boreMm <= table[0].minBore) return table[0];
  // If larger than max in table, use last row
  return table[table.length - 1];
}

// ISO Shaft Tolerance Classes (Deviations in μm from nominal diameter)
export interface ShaftTolerance {
  code: string;
  nameFa: string;
  nameEn: string;
  fitType: 'loose' | 'transition' | 'interference';
  upperDev: (d: number) => number; // in μm
  lowerDev: (d: number) => number; // in μm
  reductionFactor: number; // approximate inner ring expansion factor (0.65 - 0.80)
}

export const SHAFT_TOLERANCES: ShaftTolerance[] = [
  {
    code: 'h6',
    nameFa: 'انطباق لغزنده آزاد (h6 - شفت آسان‌حرکت)',
    nameEn: 'Sliding Clearance Fit (h6)',
    fitType: 'loose',
    upperDev: () => 0,
    lowerDev: (d) => (d <= 18 ? -11 : d <= 30 ? -13 : d <= 50 ? -16 : d <= 80 ? -19 : d <= 120 ? -22 : -25),
    reductionFactor: 0.1,
  },
  {
    code: 'js6',
    nameFa: 'انطباق انتقالی سبک (js6 - بدون لقی و بدون فشار زیاد)',
    nameEn: 'Light Transition Fit (js6)',
    fitType: 'transition',
    upperDev: (d) => (d <= 18 ? +5.5 : d <= 30 ? +6.5 : d <= 50 ? +8 : d <= 80 ? +9.5 : d <= 120 ? +11 : +12.5),
    lowerDev: (d) => (d <= 18 ? -5.5 : d <= 30 ? -6.5 : d <= 50 ? -8 : d <= 80 ? -9.5 : d <= 120 ? -11 : -12.5),
    reductionFactor: 0.55,
  },
  {
    code: 'k5',
    nameFa: 'انطباق انطباقی استاندارد (k5 - الکتروموتورهای عمومی)',
    nameEn: 'Standard Motor Shaft Fit (k5)',
    fitType: 'interference',
    upperDev: (d) => (d <= 18 ? +9 : d <= 30 ? +11 : d <= 50 ? +13 : d <= 80 ? +15 : d <= 120 ? +18 : +21),
    lowerDev: (d) => (d <= 18 ? +1 : d <= 30 ? +2 : d <= 50 ? +2 : d <= 80 ? +2 : d <= 120 ? +3 : +3),
    reductionFactor: 0.72,
  },
  {
    code: 'm5',
    nameFa: 'انطباق فشاری متوسط (m5 - بارهای سنگین و ضربه‌ای)',
    nameEn: 'Medium Interference Fit (m5)',
    fitType: 'interference',
    upperDev: (d) => (d <= 18 ? +15 : d <= 30 ? +17 : d <= 50 ? +20 : d <= 80 ? +24 : d <= 120 ? +28 : +33),
    lowerDev: (d) => (d <= 18 ? +7 : d <= 30 ? +8 : d <= 50 ? +9 : d <= 80 ? +11 : d <= 120 ? +13 : +15),
    reductionFactor: 0.75,
  },
  {
    code: 'n6',
    nameFa: 'انطباق پرسی محکم (n6 - گیربکس‌های سنگین و ارتعاشی)',
    nameEn: 'Heavy Press Fit (n6)',
    fitType: 'interference',
    upperDev: (d) => (d <= 18 ? +23 : d <= 30 ? +28 : d <= 50 ? +33 : d <= 80 ? +39 : d <= 120 ? +45 : +52),
    lowerDev: (d) => (d <= 18 ? +12 : d <= 30 ? +15 : d <= 50 ? +17 : d <= 80 ? +20 : d <= 120 ? +23 : +27),
    reductionFactor: 0.78,
  },
  {
    code: 'p6',
    nameFa: 'انطباق پرسی فوق‌سنگین (p6 - شرایط ماکزیمم گشتاور)',
    nameEn: 'Ultra Heavy Press Fit (p6)',
    fitType: 'interference',
    upperDev: (d) => (d <= 18 ? +29 : d <= 30 ? +35 : d <= 50 ? +42 : d <= 80 ? +51 : d <= 120 ? +59 : +68),
    lowerDev: (d) => (d <= 18 ? +18 : d <= 30 ? +22 : d <= 50 ? +26 : d <= 80 ? +32 : d <= 120 ? +37 : +43),
    reductionFactor: 0.80,
  },
];

// ISO Housing Tolerance Classes (Deviations in μm from nominal housing bore D)
export interface HousingTolerance {
  code: string;
  nameFa: string;
  nameEn: string;
  upperDev: (D: number) => number;
  lowerDev: (D: number) => number;
}

export const HOUSING_TOLERANCES: HousingTolerance[] = [
  {
    code: 'H7',
    nameFa: 'هوزینگ لغزنده نرمال (H7 - یاتاقان شناور آزاد)',
    nameEn: 'Normal Floating Housing Fit (H7)',
    upperDev: (D) => (D <= 30 ? +21 : D <= 50 ? +25 : D <= 80 ? +30 : D <= 120 ? +35 : D <= 180 ? +40 : +46),
    lowerDev: () => 0,
  },
  {
    code: 'J7',
    nameFa: 'هوزینگ انتقال سبک (J7 - انطباق پایدار بدون ارتعاش)',
    nameEn: 'Light Transition Housing (J7)',
    upperDev: (D) => (D <= 30 ? +14 : D <= 50 ? +18 : D <= 80 ? +22 : D <= 120 ? +26 : D <= 180 ? +30 : +35),
    lowerDev: (D) => (D <= 30 ? -7 : D <= 50 ? -7 : D <= 80 ? -8 : D <= 120 ? -9 : D <= 180 ? -10 : -11),
  },
  {
    code: 'K7',
    nameFa: 'هوزینگ فیت فشرده (K7 - بارهای چرخشی جهت ثابت)',
    nameEn: 'Firm Fixed Housing Fit (K7)',
    upperDev: (D) => (D <= 30 ? +9 : D <= 50 ? +11 : D <= 80 ? +13 : D <= 120 ? +15 : D <= 180 ? +18 : +21),
    lowerDev: (D) => (D <= 30 ? -12 : D <= 50 ? -14 : D <= 80 ? -17 : D <= 120 ? -20 : D <= 180 ? -22 : -25),
  },
  {
    code: 'M7',
    nameFa: 'هوزینگ پرسی سنگین (M7 - بارهای ضربه‌ای بالا)',
    nameEn: 'Heavy Tight Housing Fit (M7)',
    upperDev: (D) => (D <= 30 ? 0 : D <= 50 ? 0 : D <= 80 ? 0 : D <= 120 ? 0 : D <= 180 ? 0 : 0),
    lowerDev: (D) => (D <= 30 ? -21 : D <= 50 ? -25 : D <= 80 ? -30 : D <= 120 ? -35 : D <= 180 ? -40 : -46),
  },
];

// Calculate thermal clearance reduction: Δd_temp = α * d_m * (T_inner - T_outer)
// Steel coefficient of thermal expansion α ≈ 12 x 10^-6 1/°C
export function calculateThermalReduction(
  boreMm: number,
  deltaTempC: number
): number {
  // Approximate pitch diameter d_m ≈ 1.35 * boreMm
  const pitchDiameterMm = boreMm * 1.35;
  const alpha = 0.000012; // 1/°C
  const reductionMm = alpha * pitchDiameterMm * Math.max(0, deltaTempC);
  return Math.round(reductionMm * 1000 * 10) / 10; // in μm with 1 decimal
}

// Calculate interference fit clearance reduction: Δd_fit = factor * mean_interference
export function calculateFitReduction(
  boreMm: number,
  shaftToleranceCode: string
): number {
  const tol = SHAFT_TOLERANCES.find((s) => s.code === shaftToleranceCode) || SHAFT_TOLERANCES[2];
  const upper = tol.upperDev(boreMm);
  const lower = tol.lowerDev(boreMm);
  const meanInterference = (upper + lower) / 2;

  if (meanInterference <= 0) return 0;
  return Math.round(meanInterference * tol.reductionFactor * 10) / 10; // in μm
}
