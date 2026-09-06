/**
 * POLAD CHARKHESH - SEO SERVICE
 * 
 * Communicates with backend /api/seo endpoints.
 * Provides retrieval and modification of global SEO, meta tags, and OpenGraph configuration.
 */

import { SeoConfig, SeoUpdateInput, ApiResponse } from '../types/admin';
import { apiClient } from './apiClient';

export const seoService = {
  /**
   * Fetch site SEO configuration.
   */
  async getSeo(): Promise<ApiResponse<{ seo: SeoConfig }>> {
    return apiClient.get<{ seo: SeoConfig }>('/api/seo');
  },

  /**
   * Update SEO metadata (Protected - editor / superadmin).
   */
  async updateSeo(updates: SeoUpdateInput): Promise<ApiResponse<{ success: boolean; seo: SeoConfig }>> {
    return apiClient.put<{ success: boolean; seo: SeoConfig }>('/api/seo', updates);
  },
};
