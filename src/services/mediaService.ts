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

  /**
   * Upload physical image/PDF file to server storage.
   */
  async uploadMedia(file: File): Promise<ApiResponse<{ success: boolean; media: MediaMetadata }>> {
    const buffer = await file.arrayBuffer();
    return apiClient.post<{ success: boolean; media: MediaMetadata }>(
      '/api/media/upload',
      buffer,
      {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
      }
    );
  },

  /**
   * Check references for media asset across products and CMS.
   */
  async getReferences(id: string): Promise<ApiResponse<{ inUse: string[] }>> {
    return apiClient.get<{ inUse: string[] }>(`/api/media/references/${encodeURIComponent(id)}`);
  },

  /**
   * Get product media gallery.
   */
  async getProductMedia(productId: string): Promise<ApiResponse<{ success: boolean; productId: string; code: string; imageUrl: string; images: string[]; pdfUrl: string }>> {
    return apiClient.get(`/api/media/products/${encodeURIComponent(productId)}`);
  },

  /**
   * Update product media gallery (attach, detach, primary, move, setPdf, clearPdf).
   */
  async changeProductMedia(
    productId: string,
    action: 'attach' | 'detach' | 'primary' | 'move' | 'setPdf' | 'clearPdf',
    mediaUrl?: string,
    toIndex?: number
  ): Promise<ApiResponse<{ success: boolean; gallery: any }>> {
    return apiClient.patch(`/api/media/products/${encodeURIComponent(productId)}`, {
      action,
      mediaUrl,
      toIndex,
    });
  },

  async createMedia(input: MediaUploadInput): Promise<ApiResponse<{ success: boolean; media: MediaMetadata }>> {
    return apiClient.post<{ success: boolean; media: MediaMetadata }>('/api/media', input);
  },

  async updateMedia(id: string, input: MediaUpdateInput): Promise<ApiResponse<{ success: boolean; media: MediaMetadata }>> {
    return apiClient.put<{ success: boolean; media: MediaMetadata }>(`/api/media/${encodeURIComponent(id)}`, input);
  },

  async deleteMedia(id: string): Promise<ApiResponse<{ success: boolean; unlinked?: boolean }>> {
    return apiClient.delete<{ success: boolean; unlinked?: boolean }>(`/api/media/${encodeURIComponent(id)}`);
  },
};
