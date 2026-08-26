import { jsPDF } from 'jspdf';
import { BearingProduct, Language } from '../types';

export async function exportProductSpecPdf(product: BearingProduct, language: Language = 'en'): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Primary Engineering Brand Palette
  const navyColor = [26, 34, 107]; // #1a226b
  const blueAccent = [35, 44, 134]; // #232c86
  const goldColor = [217, 119, 6]; // Amber-600 #d97706
  const emeraldColor = [5, 150, 105]; // Emerald-600
  const slateDark = [15, 23, 42]; // Slate-900
  const slateMuted = [100, 116, 139]; // Slate-500
  const bgLight = [248, 250, 252]; // Slate-50
  const borderLight = [226, 232, 240]; // Slate-200

  // --- 1. HEADER BANNER & LETTERHEAD ---
  doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Gold precision sub-bar
  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Company Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text('POLAD CHARKHESH INDUSTRIAL TRADING', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Specialized Supplier & Distributor of Heavy Oil, Mining & Steel Bearings', margin, 17);
  doc.text('ISO 9001:2015 Quality & DIN / ABMA International Technical Standards', margin, 22);

  // Top Right Reference & Timestamp
  const dateStr = new Date().toISOString().split('T')[0];
  const refCode = `PC-${product.code.replace(/[^A-Z0-9]/gi, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`DOC REF: ${refCode}`, pageWidth - margin, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`ISSUED: ${dateStr}`, pageWidth - margin, 15, { align: 'right' });
  doc.text('STATUS: VERIFIED STOCK', pageWidth - margin, 20, { align: 'right' });

  let y = 34;

  // --- 2. PRODUCT IDENTIFIER CARD WITH CERTIFIED BADGE ---
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, 'S');

  // Main Part Number Title
  doc.setTextColor(blueAccent[0], blueAccent[1], blueAccent[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(product.code, margin + 5, y + 9);

  // Subtitle / Names
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${product.nameEn}  |  ${product.nameFa}`, margin + 5, y + 16.5);

  // 100% Genuine Certified Stamp (Right Badge)
  doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.roundedRect(pageWidth - margin - 56, y + 4.5, 51, 13, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('100% GENUINE GUARANTEED', pageWidth - margin - 30.5, y + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Laser Code & Origin Verified', pageWidth - margin - 30.5, y + 14.5, { align: 'center' });

  y += 28;

  // --- 3. 2D CAD SCHEMATIC DIAGRAM & BOUNDARY DIMENSIONS ---
  // Section Header
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. BOUNDARY DIMENSIONS & CAD GEOMETRIC PROFILE (ISO 15 / DIN 625)', margin, y);
  y += 4;

  const schematicWidth = 60;
  const tableX = margin + schematicWidth + 6;
  const tableW = contentWidth - schematicWidth - 6;

  // Draw 2D Vector CAD Cross-Section Schematic Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, schematicWidth, 38, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, schematicWidth, 38, 2, 2, 'S');

  // Vector Bearing Diagram (Clean technical cross-section representation)
  const cx = margin + schematicWidth / 2;
  const cy = y + 19;
  
  // Outer Ring Cross-section
  doc.setDrawColor(35, 44, 134);
  doc.setFillColor(241, 245, 249);
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, 14, 'FD'); // Outer ring OD
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, 11, 'FD'); // Outer raceway
  
  // Rolling Balls / Rollers
  doc.setFillColor(203, 213, 225);
  doc.setDrawColor(71, 85, 105);
  for (let i = 0; i < 6; i++) {
    const ang = (i * 60 * Math.PI) / 180;
    const bx = cx + 8.5 * Math.cos(ang);
    const by = cy + 8.5 * Math.sin(ang);
    doc.circle(bx, by, 2.2, 'FD');
  }

  // Inner Ring
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(35, 44, 134);
  doc.circle(cx, cy, 6, 'FD');
  // Bore Hole
  doc.setFillColor(15, 23, 42);
  doc.circle(cx, cy, 3.5, 'FD');

  // Dimension Extension Lines on Diagram
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  // D dimension top/bottom lines
  doc.line(cx - 15, cy - 14, cx - 18, cy - 14);
  doc.line(cx - 15, cy + 14, cx - 18, cy + 14);
  doc.line(cx - 17, cy - 14, cx - 17, cy + 14);

  // d dimension inner lines
  doc.line(cx + 4, cy - 3.5, cx + 18, cy - 3.5);
  doc.line(cx + 4, cy + 3.5, cx + 18, cy + 3.5);
  doc.line(cx + 17, cy - 3.5, cx + 17, cy + 3.5);

  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(`D = ${product.D}mm`, cx - 24, cy + 1, { align: 'center' });
  doc.text(`d = ${product.d}mm`, cx + 24, cy + 1, { align: 'center' });
  doc.text(`Width B = ${product.B}mm`, cx, y + 35, { align: 'center' });

  // Boundary Dimensions Table beside CAD Schematic
  const colW = tableW / 3;
  
  // Table Header
  doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.rect(tableX, y, tableW, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Bore Diameter (d)', tableX + 4, y + 4.5);
  doc.text('Outer Diameter (D)', tableX + colW + 4, y + 4.5);
  doc.text('Width / Height (B)', tableX + colW * 2 + 4, y + 4.5);

  // Table Row 1 (Values)
  doc.setFillColor(255, 255, 255);
  doc.rect(tableX, y + 6.5, tableW, 11, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(tableX, y + 6.5, tableW, 11, 'S');

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(product.d > 0 ? `${product.d} mm` : 'N/A', tableX + 4, y + 14);
  doc.text(product.D > 0 ? `${product.D} mm` : 'N/A', tableX + colW + 4, y + 14);
  doc.text(product.B > 0 ? `${product.B} mm` : 'N/A', tableX + colW * 2 + 4, y + 14);

  // Additional Fit & Tolerance Row
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.rect(tableX, y + 17.5, tableW, 20.5, 'F');
  doc.rect(tableX, y + 17.5, tableW, 20.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('ISO Tolerance Class:', tableX + 4, y + 23);
  doc.setFont('helvetica', 'normal');
  doc.text('Normal (P0) / P6 / P5 Precision', tableX + 36, y + 23);

  doc.setFont('helvetica', 'bold');
  doc.text('Shaft Fit Recommendation:', tableX + 4, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(product.d <= 50 ? 'k5 / m5 (Standard)' : 'm6 / n6 (Heavy Duty)', tableX + 44, y + 29);

  doc.setFont('helvetica', 'bold');
  doc.text('Housing Bore Fit:', tableX + 4, y + 35);
  doc.setFont('helvetica', 'normal');
  doc.text('H7 / J7 (Rotating Inner Ring)', tableX + 36, y + 35);

  y += 44;

  // --- 4. LOAD CAPACITIES & ROTATIONAL RATINGS ---
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. LOAD CAPACITIES & ROTATIONAL RATINGS (ISO 281)', margin, y);
  y += 4;

  const col4W = contentWidth / 4;
  doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.rect(margin, y, contentWidth, 6.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Dynamic Load (Cr)', margin + 4, y + 4.5);
  doc.text('Static Load (Cor)', margin + col4W + 4, y + 4.5);
  doc.text('Limiting Speed (Grease)', margin + col4W * 2 + 4, y + 4.5);
  doc.text('Unit Weight (kg)', margin + col4W * 3 + 4, y + 4.5);

  y += 6.5;

  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 11, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(margin, y, contentWidth, 11, 'S');

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(product.crKn > 0 ? `${product.crKn} kN` : '—', margin + 4, y + 7.5);
  doc.text(product.corKn > 0 ? `${product.corKn} kN` : '—', margin + col4W + 4, y + 7.5);
  doc.text(product.speedGreaseRpm > 0 ? `${product.speedGreaseRpm.toLocaleString()} RPM` : '—', margin + col4W * 2 + 4, y + 7.5);
  doc.text(product.weightKg > 0 ? `${product.weightKg} kg` : '—', margin + col4W * 3 + 4, y + 7.5);

  y += 17;

  // --- 5. MATERIAL, CLEARANCE & SEALING SPECIFICATIONS ---
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. MATERIAL SPECIFICATIONS, CLEARANCE & STOCK BRANDS', margin, y);
  y += 4;

  const halfW = (contentWidth - 4) / 2;

  // Left Card: Cage & Sealing
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, y, halfW, 26, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, y, halfW, 26, 2, 2, 'S');

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Cage Material:', margin + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(product.cageMaterialEn, margin + 30, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Sealing Type:', margin + 4, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(product.sealingEn, margin + 30, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Available RIC:', margin + 4, y + 19.5);
  doc.setFont('helvetica', 'normal');
  doc.text(product.clearanceOptions.join(' , '), margin + 30, y + 19.5);

  // Right Card: Stock Brands & Standards
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin + halfW + 4, y, halfW, 26, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin + halfW + 4, y, halfW, 26, 2, 2, 'S');

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Verified Brands:', margin + halfW + 7, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(product.brands.join(', '), margin + halfW + 36, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Steel Metallurgy:', margin + halfW + 7, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text('100Cr6 / AISI 52100 (Vacuum Degassed)', margin + halfW + 36, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Inspection Report:', margin + halfW + 7, y + 19.5);
  doc.setFont('helvetica', 'normal');
  doc.text('100% Quality & Vibration Tested', margin + halfW + 36, y + 19.5);

  y += 31;

  // --- 6. RECOMMENDED INDUSTRIAL APPLICATIONS & LUBRICATION ---
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('4. INDUSTRIAL APPLICATIONS & LUBRICATION GUIDELINES', margin, y);
  y += 4;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'S');

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Target Heavy Industries:', margin + 5, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(product.applicationsEn.join('  •  '), margin + 44, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Lubricant Recommendation:', margin + 5, y + 13.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Lithium Complex Soap Grease (ISO VG 150/220, NLGI 2) / Operating Temp: -30°C to +140°C', margin + 48, y + 13.5);

  y += 26;

  // --- 7. OFFICIAL ENGINEERING FOOTER & PROCUREMENT CONTACT ---
  doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.roundedRect(margin, y, contentWidth, 32, 2.5, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('POLAD CHARKHESH - CENTRAL SALES & ENGINEERING DESK', margin + 6, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.text('Direct Engineering Phone: +98 21 77209117  |  Mobile & WhatsApp: +98 912 7195313', margin + 6, y + 15);
  doc.text('Central Warehouse: Tehran, Narmak, Dardasht Street, No. 433 (Immediate Nationwide Dispatch)', margin + 6, y + 21);
  doc.text('Online Engineering Portal & Stock Verification: https://poladcharkhesh.ir', margin + 6, y + 27);

  // Security & Copyright bottom line
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.setFontSize(7);
  doc.text('© Polad Charkhesh Industrial Bearing & Seal Trading. All rights reserved. Generated automatically via Engineering Catalog.', pageWidth / 2, pageHeight - 6, { align: 'center' });

  // Trigger browser download with clean filename
  const safeFilename = `PoladCharkhesh-Spec-${product.code.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
}
