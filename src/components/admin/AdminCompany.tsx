import React from 'react';
import { Language } from '../../types';
import { AdminSettings } from './AdminSettings';

interface AdminCompanyProps {
  language: Language;
}

export const AdminCompany: React.FC<AdminCompanyProps> = ({ language }) => {
  return <AdminSettings language={language} initialSubTab="company" />;
};

