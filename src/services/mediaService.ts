/**
 * POLAD CHARKHESH - MEDIA SERVICE
 * 
 * Boundary for media asset management and metadata retrieval.
 * Connects to /api/media endpoints (prepared for Phase 7.4).
 */

import { MediaMetadata, MediaUploadInput, MediaUpdateInput, ApiResponse } from '../types/admin';
import { apiClient } from './apiClient';

export interface MediaListResponse {
  media: MediaMetadata[];
  count: number;
}

export const mediaService = {
  /**
   * Fetch media assets metadata list.
   */
  async getMediaList(category?: string): Promise<ApiResponse<MediaListResponse>> {
    const url = category ? `/api/media?category=${encodeURIComponent(category)}` : '/api/media';
    return apiClient.get<MediaListResponse>(url);
  },

  /**
   * Fetch single media asset metadata by ID.
   */
  async getMediaById(id: string): Promise<ApiResponse<{ media: MediaMetadata }>> {
    return apiClient.get<{ media: MediaMetadata }>(`/api/media/${encodeURIComponent(id)}`);
  },

  async createMedia(input: MediaUploadInput): Promise<ApiResponse<{ success: boolean; media: MediaMetadata }>> {
    return apiClient.post<{ success: boolean; media: MediaMetadata }>('/api/media', input);
  },

  async updateMedia(id: string, input: MediaUpdateInput): Promise<ApiResponse<{ success: boolean; media: MediaMetadata }>> {
    return apiClient.put<{ success: boolean; media: MediaMetadata }>(`/api/media/${encodeURIComponent(id)}`, input);
  },

  async deleteMedia(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`/api/media/${encodeURIComponent(id)}`);
  },
};
