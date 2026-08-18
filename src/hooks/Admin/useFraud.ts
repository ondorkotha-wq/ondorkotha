"use client";

import { useState } from "react";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { FraudStatus } from "../Order/useOrders";

export interface FraudCheckResult {
  fraudStatus: FraudStatus;
  riskScore: number;
  riskLevel: string;
  fraudReports: number;
  totalOrders: number;
  returned: number;
  successRatio: number;
  userAutoUpdated: boolean;
}

export interface FraudHistoryRecord {
  id: number;
  phone: string;
  totalOrders: number;
  delivered: number;
  returned: number;
  successRatio: number;
  fraudReportCount: number;
  riskLevel: string;
  riskScore: number;
  computedStatus: FraudStatus;
  checkedAt: string;
  userId: number | null;
}

export function useCheckFraud() {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);

  const check = async (phone: string): Promise<FraudCheckResult> => {
    setLoading(true);
    try {
      const res = await axiosSecure.post("/fraud/check-phone", { phone });
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  return { check, loading };
}

export function useUpdateFraudStatus() {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);

  const update = async (userId: number, status: FraudStatus) => {
    setLoading(true);
    try {
      const res = await axiosSecure.patch(
        `/users/${userId}/fraud-status`,
        { status },
      );
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading };
}

export function useFraudHistory() {
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<FraudHistoryRecord[]>([]);

  const load = async (phone: string) => {
    setLoading(true);
    try {
      const res = await axiosSecure.get(
        `/fraud/history/${encodeURIComponent(phone)}`,
      );
      const data = res.data as FraudHistoryRecord[];
      setHistory(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { load, loading, history };
}
