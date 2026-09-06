/**
 * POLAD CHARKHESH - COMPANY SERVICE
 * 
 * Communicates with backend /api/company endpoints.
 * Provides retrieval and modification of dynamic organizational details.
 */

import { CompanyInfo, CompanyUpdateInput, ApiResponse } from '../types/admin';
import { apiClient } from './apiClient';

export const companyService = {
  /**
   * Fetch company contact, registration, and organizational information.
   */
  async getCompanyInfo(): Promise<ApiResponse<{ company: CompanyInfo }>> {
    return apiClient.get<{ company: CompanyInfo }>('/api/company');
  },

  /**
   * Update company details (Protected - editor / superadmin).
   */
  async updateCompanyInfo(updates: CompanyUpdateInput): Promise<ApiResponse<{ success: boolean; company: CompanyInfo }>> {
    return apiClient.put<{ success: boolean; company: CompanyInfo }>('/api/company', updates);
  },
};
