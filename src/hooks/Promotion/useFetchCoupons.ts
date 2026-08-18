import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from '@/hooks/Axios/useAxiosSecure';
import { CouponDiscountType } from '@/types/promotional.types';

interface FetchCouponsParams {
  isActive?: boolean | null;
  discountType?: CouponDiscountType | null;
  includeExpired?: boolean;
  search?: string;
}

const useFetchCoupons = (params: FetchCouponsParams = {}) => {
  const axiosSecure = useAxiosSecure();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['coupons', params],
    queryFn: async () => {
      const queryParams: Record<string, string> = {};

      if (params.isActive !== null && params.isActive !== undefined) {
        queryParams.isActive = String(params.isActive);
      }
      if (params.discountType) {
        queryParams.discountType = params.discountType;
      }
      if (params.includeExpired !== undefined) {
        queryParams.includeExpired = String(params.includeExpired);
      }
      if (params.search) {
        queryParams.search = params.search;
      }

      const { data } = await axiosSecure.get('/coupons', {
        params: queryParams,
      });

      return data;
    },
  });

  return {
    coupons: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
};

export default useFetchCoupons;