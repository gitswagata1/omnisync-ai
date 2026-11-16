'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

/**
 * Renders the dashboard only once the API confirms the session cookie. The
 * proxy already redirects requests without a cookie; this covers expired or
 * revoked sessions.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const [verified, setVerified] = useState(isLogin);

  useEffect(() => {
    if (isLogin) return;

    let cancelled = false;
    api
      .me()
      .then(() => {
        if (!cancelled) setVerified(true);
      })
      .catch(() => {
        if (!cancelled) router.replace('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [isLogin, router]);

  if (!verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
      </div>
    );
  }

  return <>{children}</>;
}
