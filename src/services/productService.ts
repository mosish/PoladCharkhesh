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
   * Duplicate an existing product with a unique technical code and slug.
   */
  async duplicateProduct(id: string): Promise<ApiResponse<{ success: boolean; product: AdminProductItem }>> {
    return apiClient.post<{ success: boolean; product: AdminProductItem }>(`/api/products/${encodeURIComponent(id)}/duplicate`);
  },

  /**
   * Toggle or set featured status for catalog highlight.
   */
  async setFeaturedStatus(id: string, featured?: boolean): Promise<ApiResponse<{ success: boolean; featured: boolean }>> {
    return apiClient.patch<{ success: boolean; featured: boolean }>(`/api/products/${encodeURIComponent(id)}/featured`, { featured });
  },

  /**
   * Toggle or set stock/inquiry status.
   */
  async setStockStatus(id: string, inStock?: boolean): Promise<ApiResponse<{ success: boolean; inStock: boolean }>> {
    return apiClient.patch<{ success: boolean; inStock: boolean }>(`/api/products/${encodeURIComponent(id)}/stock`, { inStock });
  },

  /**
   * Permanently delete product from database (Superadmin only).
   */
  async deleteProduct(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/products/${encodeURIComponent(id)}`);
  },
};
