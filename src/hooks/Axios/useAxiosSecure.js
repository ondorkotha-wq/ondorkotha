"use client";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const axiosSecure = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const useAxiosSecure = () => {
  const { token, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Request interceptor - add token to headers
    const requestInterceptor = axiosSecure.interceptors.request.use(
      (config) => {
        // Get fresh token from localStorage in case context hasn't updated yet
        const currentToken = token || localStorage.getItem("token");

        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - handle auth errors
    const responseInterceptor = axiosSecure.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only handle 401 errors that haven't been retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // IMPORTANT: Only clear auth if the token is actually invalid
          // Check if this is an auth endpoint or token refresh endpoint
          const isAuthEndpoint = originalRequest.url?.includes("/auth/");

          // If it's NOT an auth endpoint (like /auth/login), then the token is invalid
          if (!isAuthEndpoint) {
            console.warn("Unauthorized request - clearing session");

            // Use the logout function from context to properly clear everything
            logout();

            // Optionally redirect to login
            // router.push('/login');
          }
        }

        return Promise.reject(error);
      },
    );

    // Cleanup interceptors on unmount
    return () => {
      axiosSecure.interceptors.request.eject(requestInterceptor);
      axiosSecure.interceptors.response.eject(responseInterceptor);
    };
  }, [token, logout, router, loading]);

  return axiosSecure;
};

export default useAxiosSecure;
