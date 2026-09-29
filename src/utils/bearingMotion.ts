import { BearingProduct } from '../types';

export function bearingGeometry(p: BearingProduct) {
  const supported = !['housing', 'seal', 'lubricant', 'thrust'].includes(p.category) && p.D > p.d && p.d > 0;
  const outer = 145;
  const bore = supported ? (outer * p.d) / p.D : 65;
  const gap = outer - bore;
  const pitch = (outer + bore) / 2;
  const roller = ['roller', 'spherical', 'cylindrical'].includes(p.category) || p.schematicType === 'spherical-thrust';
  const rows = ['self-aligning-ball', 'spherical'].includes(p.schematicType || '') || /double[\s-]+row/i.test(p.code + ' ' + p.nameEn) ? 2 : 1;
  const actualWidth = supported ? (2 * outer * p.B) / p.D : 40;
  const elementDiameter = Math.min(gap * (p.schematicType === 'needle' ? 0.32 : 0.58), actualWidth / (rows === 2 ? 2.5 : 1.25));
  const angle = Number.parseFloat(String(p.contactAngle || '0')) || 0;
  const contactAngle = Math.min(90, Math.max(0, angle));

  // Internal dimensions are visual estimates; d, D and B come from the canonical catalog.
  const factor = (elementDiameter / (2 * pitch)) * Math.cos((contactAngle * Math.PI) / 180);
  return {
    supported,
    outer,
    bore,
    gap,
    pitch,
    elementDiameter,
    roller,
    rows,
    depth: supported ? ((2 * outer * p.B) / p.D) * 0.42 : 40,
    count: Math.max(7, Math.min(28, Math.floor((2 * Math.PI * pitch) / (elementDiameter * 1.25)))),
    cageRatio: 0.5 * (1 - factor),
    spinRatio: (pitch / elementDiameter) * (1 - factor * factor),
  };
}

export function advanceRotation(angle: number, rpm: number, seconds: number, playback = 1): number {
  if (![angle, rpm, seconds, playback].every(Number.isFinite)) return angle;
  return (angle + Math.max(0, rpm) * 6 * Math.max(0, seconds) * Math.max(0, playback)) % 360;
}
