/**
 * POLAD CHARKHESH - COMPANY DATABASE ACCESS SERVICE
 */

import { getDatabase } from '../db';
import {
  COMPANY_INFO as canonicalCompanyInfo,
  CompanyContactInfo,
  generateWorkingHoursStrings,
  toPersianDigits,
} from '../../src/data/company';

function formatPhoneDisplay(raw: string, isLandline = false): { displayFa: string; displayEn: string; tel: string } {
  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return { displayFa: raw, displayEn: raw, tel: raw ? `tel:${raw}` : '' };
  }

  // Mobile format: 0912-7195313
  if (digits.startsWith('09') && digits.length === 11) {
    const en = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    const fa = toPersianDigits(en);
    const tel = `tel:+98${digits.slice(1)}`;
    return { displayFa: fa, displayEn: en, tel };
  }

  // Tehran Landline format: 021-77209117
  if (digits.startsWith('021') && digits.length === 11) {
    const en = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    const fa = toPersianDigits(en);
    const tel = `tel:+98${digits.slice(1)}`;
    return { displayFa: fa, displayEn: en, tel };
  }

  // Generic
  const en = raw;
  const fa = toPersianDigits(raw);
  const cleanIntl = digits.startsWith('98') ? `+${digits}` : (digits.startsWith('0') ? `+98${digits.slice(1)}` : `+${digits}`);
  return { displayFa: fa, displayEn: en, tel: `tel:${cleanIntl}` };
}

function formatWhatsAppUrl(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 'https://wa.me/989127195313';
  if (digits.startsWith('09')) {
    return `https://wa.me/98${digits.slice(1)}`;
  }
  if (digits.startsWith('98')) {
    return `https://wa.me/${digits}`;
  }
  return `https://wa.me/${digits}`;
}

export const companyDb = {
  getCompanyInfo(): CompanyContactInfo {
    const db = getDatabase();
    const row = db.prepare('SELECT data FROM company_info WHERE id = ?;').get('main') as any;
    let data: Partial<CompanyContactInfo> = {};

    if (row && row.data) {
      try {
        data = JSON.parse(row.data);
      } catch {
        data = {};
      }
    }

    // Merge canonical defaults with database record
    const merged: CompanyContactInfo = {
      ...canonicalCompanyInfo,
      ...data,
    };

    // Ensure aliases
    merged.companyNameFa = merged.companyNameFa || merged.nameFa;
    merged.nameFa = merged.nameFa || merged.companyNameFa;
    merged.companyNameEn = merged.companyNameEn || merged.nameEn;
    merged.nameEn = merged.nameEn || merged.companyNameEn;

    merged.taglineFa = merged.taglineFa || merged.sloganFa;
    merged.sloganFa = merged.sloganFa || merged.taglineFa;
    merged.taglineEn = merged.taglineEn || merged.sloganEn;
    merged.sloganEn = merged.sloganEn || merged.taglineEn;

    merged.officeAddressFa = merged.officeAddressFa || merged.addressFa;
    merged.addressFa = merged.addressFa || merged.officeAddressFa;
    merged.officeAddressEn = merged.officeAddressEn || merged.addressEn;
    merged.addressEn = merged.addressEn || merged.officeAddressEn;

    merged.primaryMobile = merged.primaryMobile || merged.primaryPhone;
    merged.primaryPhone = merged.primaryPhone || merged.primaryMobile;

    merged.inquiryEmail = merged.inquiryEmail || merged.email;
    merged.email = merged.email || merged.inquiryEmail;
    merged.technicalEmail = merged.technicalEmail || merged.email;

    if (!Array.isArray(merged.landlinePhones) || merged.landlinePhones.length === 0) {
      merged.landlinePhones = [merged.landlinePhone || '02177209117'];
    }

    merged.whatsappEnabled = merged.whatsappEnabled !== undefined ? merged.whatsappEnabled : true;
    merged.phoneEnabled = merged.phoneEnabled !== undefined ? merged.phoneEnabled : true;
    merged.contactCtaEnabled = merged.contactCtaEnabled !== undefined ? merged.contactCtaEnabled : true;
    merged.showFloatingActions = merged.showFloatingActions !== undefined ? merged.showFloatingActions : true;
    merged.showTopAnnouncement = merged.showTopAnnouncement !== undefined ? merged.showTopAnnouncement : true;
    merged.defaultLanguage = merged.defaultLanguage || 'domain_based';

    return merged;
  },

  updateCompanyInfo(sanitizedUpdates: Partial<CompanyContactInfo>, username: string): CompanyContactInfo {
    const current = this.getCompanyInfo();
    const merged: CompanyContactInfo = { ...current, ...sanitizedUpdates };

    // Synchronize aliases
    if (sanitizedUpdates.companyNameFa) merged.nameFa = sanitizedUpdates.companyNameFa;
    if (sanitizedUpdates.nameFa) merged.companyNameFa = sanitizedUpdates.nameFa;

    if (sanitizedUpdates.companyNameEn) merged.nameEn = sanitizedUpdates.companyNameEn;
    if (sanitizedUpdates.nameEn) merged.companyNameEn = sanitizedUpdates.nameEn;

    if (sanitizedUpdates.taglineFa) merged.sloganFa = sanitizedUpdates.taglineFa;
    if (sanitizedUpdates.sloganFa) merged.taglineFa = sanitizedUpdates.sloganFa;

    if (sanitizedUpdates.taglineEn) merged.sloganEn = sanitizedUpdates.taglineEn;
    if (sanitizedUpdates.sloganEn) merged.taglineEn = sanitizedUpdates.sloganEn;

    if (sanitizedUpdates.officeAddressFa) merged.addressFa = sanitizedUpdates.officeAddressFa;
    if (sanitizedUpdates.addressFa) merged.officeAddressFa = sanitizedUpdates.addressFa;

    if (sanitizedUpdates.officeAddressEn) merged.addressEn = sanitizedUpdates.officeAddressEn;
    if (sanitizedUpdates.addressEn) merged.officeAddressEn = sanitizedUpdates.addressEn;

    if (sanitizedUpdates.primaryMobile) merged.primaryPhone = sanitizedUpdates.primaryMobile;
    if (sanitizedUpdates.primaryPhone) merged.primaryMobile = sanitizedUpdates.primaryPhone;

    if (sanitizedUpdates.inquiryEmail) merged.email = sanitizedUpdates.inquiryEmail;
    if (sanitizedUpdates.email) merged.inquiryEmail = sanitizedUpdates.email;

    // Reformat phone displays & URLs if phones changed
    if (merged.primaryPhone) {
      const p = formatPhoneDisplay(merged.primaryPhone, false);
      merged.primaryPhoneDisplayFa = p.displayFa;
      merged.primaryPhoneDisplayEn = p.displayEn;
      merged.primaryPhoneTel = p.tel;
    }

    if (merged.landlinePhone) {
      const l = formatPhoneDisplay(merged.landlinePhone, true);
      merged.landlinePhoneDisplayFa = l.displayFa;
      merged.landlinePhoneDisplayEn = l.displayEn;
      merged.landlinePhoneTel = l.tel;
    }

    if (merged.whatsappNumber) {
      merged.whatsappUrl = formatWhatsAppUrl(merged.whatsappNumber);
    }

    // Structured Working Hours auto-generation
    if (merged.workingHoursConfig) {
      const generated = generateWorkingHoursStrings(merged.workingHoursConfig);
      merged.workingHoursFa = generated.workingHoursFa;
      merged.workingHoursEn = generated.workingHoursEn;
      merged.workingHoursShortFa = generated.workingHoursShortFa;
      merged.workingHoursShortEn = generated.workingHoursShortEn;
    }

    const db = getDatabase();
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO company_info (id, data, updated_at, updated_by)
      VALUES ('main', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;
    `).run(JSON.stringify(merged), nowIso, username);

    return merged;
  },
};

