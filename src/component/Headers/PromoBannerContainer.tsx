'use client';

import useFetchPromoBanners from '@/hooks/Homepage/Banner/useFetchPromoBanners';
import PromoBannerCarousel from './PromoBannerCarousel';

export default function PromoBannerContainer() {
  const { banners, isLoading: loading } = useFetchPromoBanners(true);

  if (loading || banners.length === 0) return null;

  return <PromoBannerCarousel banners={banners} />;
}
