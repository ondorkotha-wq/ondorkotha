import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "../Axios/useAxiosPublic";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { isAuthenticated } from "@/utils/auth";
import { OrderStatus, PaymentStatus } from "../Order/useOrders";
// types/orderTracking.types.ts

export interface TrackingEvent {
  status: string;
  date: string;
  completed: boolean;
  current?: boolean;
}

export interface TrackedItem {
  id: number;
  name: string;
  image: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  sku?: string;
  productSizeId?: number | null;
  isOutOfStock?: boolean;
}

export interface ShippingAddress {
  name: string;
  address: string;
  district: string;
  phone: string;
}

export interface PaymentInfo {
  id?: number;
  method: string;
  status: string;
  transactionId?: string;
  amount?: number;
  phase?: "FULL" | "ADVANCE" | "REMAINDER";
}

export interface TrackedOrder {
  id?: number;
  orderNumber: string;
  trackingToken?: string;
  orderDate: string;
  estimatedDelivery: string;
  status: OrderStatus;
  hasOutOfStockItem?: boolean;
  awbNumber?: string;
  deliveryMethod?: string;
  deliveryCharge?: number;
  discount?: number;
  subtotal?: number;
  total: number;
  invoiceId?: string | null;
  paymentStatus: PaymentStatus;
  payments: PaymentInfo[];
  advanceRequired?: boolean;
  advancePercentage?: number;
  advanceAmount?: number;
  remainingAmount?: number;

  items: TrackedItem[];
  trackingEvents: TrackingEvent[];
  shippingAddress: ShippingAddress;
}

const useTrackOrder = ({
  trackingId,
  details = false,
}: {
  trackingId: string;
  details?: boolean;
}) => {
  const axiosPublic = useAxiosPublic();
  const axiosSecure = useAxiosSecure();

  const fetchOrder = async (): Promise<TrackedOrder> => {
    const axios = isAuthenticated() ? axiosSecure : axiosPublic;
    const { data } = await axios.get<TrackedOrder>(
      `/orders/track/${trackingId}?details=${details}`,
    );

    console.log(data, "order-data");
    return data;
  };

  const query = useQuery<TrackedOrder, Error>({
    queryKey: ["track-order", trackingId],
    queryFn: fetchOrder,
    enabled: !!trackingId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useTrackOrder;
