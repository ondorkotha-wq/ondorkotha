import { PromoBanner } from "@/types/promo-banner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const promoBannerApi = {
  // Public endpoints
  getActiveBanners: async (): Promise<PromoBanner[]> => {
    const res = await fetch(`${API_BASE_URL}/promo-banners`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch banners');
    return res.json();
  },

  // Admin endpoints
  getAllBanners: async (token: string): Promise<PromoBanner[]> => {
    const res = await fetch(`${API_BASE_URL}/promo-banners/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch all banners');
    return res.json();
  },

  createBanner: async (data: Omit<PromoBanner, 'id' | 'createdAt' | 'updatedAt'>, token: string): Promise<PromoBanner> => {
    const res = await fetch(`${API_BASE_URL}/promo-banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create banner');
    return res.json();
  },

  updateBanner: async (id: string, data: Partial<PromoBanner>, token: string): Promise<PromoBanner> => {
    const res = await fetch(`${API_BASE_URL}/promo-banners/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update banner');
    return res.json();
  },

  deleteBanner: async (id: string, token: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/promo-banners/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete banner');
  },

  reorderBanners: async (orders: { id: string; order: number }[], token: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/promo-banners/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orders),
    });
    if (!res.ok) throw new Error('Failed to reorder banners');
  },
};

