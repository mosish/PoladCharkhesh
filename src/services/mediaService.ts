import { useEffect, useState } from 'react';
import type { MediaMetadata } from '../types/admin';
import { apiClient, apiRequest } from './apiClient';
export interface MediaListResponse { media: MediaMetadata[]; count: number }
export interface ProductGallery { images: string[]; imageUrl: string; pdfUrl: string; version: string }
let cached: MediaMetadata[] = [];
let requested = false;
const listeners = new Set<() => void>();
function notify() { listeners.forEach(listener => listener()); }
export const mediaService = {
  getMediaList(category?: string) { return apiClient.get<MediaListResponse>('/api/media' + (category ? '?category=' + encodeURIComponent(category) : '')); },
  getLibrary() { return apiClient.get<MediaListResponse>('/api/media/library'); },
  getMediaById(id: string) { return apiClient.get<{ media: MediaMetadata }>('/api/media/' + encodeURIComponent(id)); },
  register(input: unknown) { return apiClient.post<{ media: MediaMetadata }>('/api/media', input); },
  update(id: string, input: unknown) { return apiClient.put<{ media: MediaMetadata }>('/api/media/' + encodeURIComponent(id), input); },
  archive(id: string, archived: boolean) { return apiClient.patch<{ media: MediaMetadata }>('/api/media/' + encodeURIComponent(id) + '/archive', { archived }); },
  upload(file: File) { return apiRequest<{ media: MediaMetadata }>('/api/media/upload', { method: 'POST', headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }, body: file }); },
  gallery(productId: string) { return apiClient.get<{ gallery: ProductGallery }>('/api/media/products/' + encodeURIComponent(productId)); },
  changeGallery(productId: string, input: unknown) { return apiClient.patch<{ gallery: ProductGallery }>('/api/media/products/' + encodeURIComponent(productId), input); },
  async refresh() {
    const result = await this.getMediaList();
    if (result.success) { cached = result.data.media; notify(); } else requested = false;
  },
};
export function useMediaMetadata(): MediaMetadata[] {
  const [items, setItems] = useState(cached);
  useEffect(() => {
    const listener = () => setItems(cached); listeners.add(listener);
    if (!requested) { requested = true; void mediaService.refresh(); }
    return () => { listeners.delete(listener); };
  }, []);
  return items;
}
