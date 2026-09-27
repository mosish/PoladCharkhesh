/**
 * POLAD CHARKHESH - MEDIA SERVICE
 * Complete metadata library boundary for media assets.
 */

import { MediaMetadata, MediaUpdateInput, MediaUploadInput, ApiResponse } from '../types/admin';
import { apiClient } from './apiClient';

export interface MediaListResponse {
  media: MediaMetadata[];
  count: number;
}

export const mediaService = {
  async getMediaList(category?: string): Promise<ApiResponse<MediaListResponse>> {
    const url = category ? `/api/media?category=${encodeURIComponent(category)}` : '/api/media';
    return apiClient.get<MediaListResponse>(url);
  },

  async getMediaById(id: string): Promise<ApiResponse<{ media: MediaMetadata }>> {
    return apiClient.get<{ media: MediaMetadata }>(`/api/media/${encodeURIComponent(id)}`);
  },

  async uploadFile(
    file: File,
    metadata: Omit<MediaUploadInput, 'originalName' | 'mimeType' | 'sizeBytes' | 'url'>
  ): Promise<ApiResponse<{ success: boolean; media: MediaMetadata }>> {
    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.readAsDataURL(file);
    });

    return apiClient.post<{ success: boolean; media: MediaMetadata }>('/api/media/upload', {
      originalName: file.name,
      mimeType: file.type,
      dataBase64,
      altTextFa: metadata.altTextFa,
      altTextEn: metadata.altTextEn,
      category: metadata.category,
      associatedProductCodes: metadata.associatedProductCodes,
    });
  },

  async createMedia(input: MediaUploadInput): Promise<ApiResponse<{ success: boolean; media: MediaMetadata }>> {
    return apiClient.post<{ success: boolean; media: MediaMetadata }>('/api/media', input);
  },

  async updateMedia(id: string, updates: MediaUpdateInput): Promise<ApiResponse<{ success: boolean; media: MediaMetadata }>> {
    return apiClient.put<{ success: boolean; media: MediaMetadata }>(`/api/media/${encodeURIComponent(id)}`, updates);
  },

  async deleteMedia(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`/api/media/${encodeURIComponent(id)}`);
  },
};
