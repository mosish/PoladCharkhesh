/**
 * POLAD CHARKHESH - PRODUCT SERVICE
 * 
 * Communicates with backend /api/products/* endpoints.
 * Handles product listing, detail fetching, creation, modification,
 * archiving, and deletion via standardized ApiResponse contracts.
 */

import { 
  AdminProductItem, 
  ProductCreateInput, 
  ProductUpdateInput, 
  ApiResponse 
} from '../types/admin';
import { apiClient } from './apiClient';

export interface ProductListResponse {
  count: number;
  products: AdminProductItem[];
}

export const productService = {
  /**
   * Fetch all products. If includeArchived is true, requires authenticated admin session.
   */
  async getProducts(includeArchived = false): Promise<ApiResponse<ProductListResponse>> {
    const url = includeArchived ? '/api/products?includeArchived=true' : '/api/products';
    return apiClient.get<ProductListResponse>(url);
  },

  /**
   * Fetch a single product by ID, slug, or technical code.
   */
  async getProductByIdOrSlug(idOrSlug: string): Promise<ApiResponse<{ product: AdminProductItem }>> {
    return apiClient.get<{ product: AdminProductItem }>(`/api/products/${encodeURIComponent(idOrSlug)}`);
  },

  /**
   * Create a new engineering bearing product.
   */
  async createProduct(input: ProductCreateInput): Promise<ApiResponse<{ success: boolean; product: AdminProductItem }>> {
    return apiClient.post<{ success: boolean; product: AdminProductItem }>('/api/products', input);
  },

  /**
   * Update an existing product's specifications or metadata.
   */
  async updateProduct(id: string, updates: ProductUpdateInput): Promise<ApiResponse<{ success: boolean; product: AdminProductItem }>> {
    return apiClient.put<{ success: boolean; product: AdminProductItem }>(`/api/products/${encodeURIComponent(id)}`, updates);
  },

  /**
   * Toggle product archive status (active vs archived).
   */
  async setArchiveStatus(id: string, isArchived: boolean): Promise<ApiResponse<{ success: boolean; isArchived: boolean }>> {
    return apiClient.patch<{ success: boolean; isArchived: boolean }>(`/api/products/${encodeURIComponent(id)}/archive`, { isArchived });
  },

  /**
   * Permanently delete product from database (Superadmin only).
   */
  async deleteProduct(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/products/${encodeURIComponent(id)}`);
  },
};
