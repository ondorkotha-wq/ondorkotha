'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mergeGuestUserWithRealUser } from '@/utils/merge';
import { pushGTMEvent } from '@/lib/gtm';

export default function GoogleSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser, setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');

    if (!token || !userRaw) {
      // Something went wrong — go back to home with modal open
      router.replace('/?auth=signin&error=google_failed');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);

      mergeGuestUserWithRealUser(token).catch(console.error);

      pushGTMEvent({ event: "login", method: "google" });

      // Clean URL and redirect
      router.replace('/');
    } catch {
      router.replace('/?auth=signin&error=google_failed');
    }
  }, [searchParams, router, setToken, setUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 tracking-wide">Signing you in…</p>
    </div>
  );
}