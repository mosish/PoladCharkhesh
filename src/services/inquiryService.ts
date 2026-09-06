/**
 * POLAD CHARKHESH - INQUIRY SERVICE
 * 
 * Communicates with backend /api/inquiries endpoints.
 * Handles customer RFQ submissions and administrative status triage.
 */

import { InquiryLog, InquiryStatus, InquirySubmissionInput, ApiResponse } from '../types/admin';
import { apiClient } from './apiClient';

export const inquiryService = {
  /**
   * Fetch all inquiries (Protected - admin).
   */
  async getInquiries(): Promise<ApiResponse<{ inquiries: InquiryLog[] }>> {
    return apiClient.get<{ inquiries: InquiryLog[] }>('/api/inquiries');
  },

  /**
   * Submit a new customer quotation request (Public).
   */
  async submitInquiry(input: InquirySubmissionInput): Promise<ApiResponse<{ success: boolean; id: string; message: string }>> {
    return apiClient.post<{ success: boolean; id: string; message: string }>('/api/inquiries', input);
  },

  /**
   * Update inquiry triage status (Protected - admin).
   */
  async updateStatus(id: string, status: InquiryStatus): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.patch<{ success: boolean; message: string }>(`/api/inquiries/${encodeURIComponent(id)}/status`, { status });
  },
};
