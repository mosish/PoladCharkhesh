/**
 * POLAD CHARKHESH - CMS CONTENT SERVICE
 * 
 * Communicates with backend /api/content endpoints.
 * Provides retrieval and modification of editable site content (hero, about, footer).
 */

import { CmsContent, CmsUpdateInput, ApiResponse } from '../types/admin';
import { apiClient } from './apiClient';

export const contentService = {
  /**
   * Fetch current CMS page content.
   */
  async getContent(): Promise<ApiResponse<{ content: CmsContent }>> {
    return apiClient.get<{ content: CmsContent }>('/api/content');
  },

  /**
   * Update CMS page content (Protected - editor / superadmin).
   */
  async updateContent(updates: CmsUpdateInput): Promise<ApiResponse<{ success: boolean; content: CmsContent }>> {
    return apiClient.put<{ success: boolean; content: CmsContent }>('/api/content', updates);
  },
};
