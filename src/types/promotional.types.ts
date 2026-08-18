export type CouponDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';

export interface CouponCategory {
  categoryId: number;
  category?: { id: number; name: string | null };
}

export interface Coupon {
  id: number;
  code: string;
  discountType: CouponDiscountType;
  discountValue?: number | null;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  expiryDate: string;
  startDate: string;
  isActive: boolean;
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number | null;
  categories?: CouponCategory[];
  createdAt?: string;
  updatedAt?: string;
}