'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mergeGuestUserWithRealUser } from '@/utils/merge';
import { pushGTMEvent } from '@/lib/gtm';
import { useQueryClient } from '@tanstack/react-query';

export default function GoogleSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser, setToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');

    if (!token || !userRaw) {
      // Something went wrong — go back to home with modal open
      router.replace('/?auth=signin&error=google_failed');
      return;
    }

    let user;
    try {
      user = JSON.parse(decodeURIComponent(userRaw));
    } catch {
      router.replace('/?auth=signin&error=google_failed');
      return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    pushGTMEvent({ event: "login", method: "google" });

    // Move this browser's guest orders/cart into the account before leaving
    // the "Signing you in…" screen, so the next page already shows them.
    // Never throws; on failure the visitorId is kept for the next sign-in.
    mergeGuestUserWithRealUser(token, queryClient).finally(() => {
      // Clean URL and redirect
      router.replace('/');
    });
  }, [searchParams, router, setToken, setUser, queryClient]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 tracking-wide">Signing you in…</p>
    </div>
  );
}