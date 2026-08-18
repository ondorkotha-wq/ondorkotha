// app/auth/google/cancelled/page.tsx
'use client';

import { useEffect } from 'react';

export default function GoogleCancelled() {
  useEffect(() => {
    if (window.opener) {
      // Tell parent popup was cancelled, then close
      window.opener.postMessage(
        { type: 'GOOGLE_AUTH', success: false, cancelled: true },
        window.location.origin
      );
      window.close();
    } else {
      // Fallback if not in popup
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-sm text-gray-400">Closing...</p>
    </div>
  );
}