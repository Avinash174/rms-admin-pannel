"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { isAuthenticated } from '@/lib/api/auth';
import { hasRouteAccess } from '@/lib/route-permissions';
import { clearPersistedSession } from '@/lib/session';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, user, session } = useAuth();

  useEffect(() => {
    if (!isLoading && !user && isAuthenticated()) {
      clearPersistedSession();
      router.replace('/login');
      return;
    }

    if (!isLoading && !user && !isAuthenticated()) {
      router.replace('/login');
      return;
    }

    if (!isLoading && user && session && pathname !== '/forbidden') {
      if (!hasRouteAccess(pathname, user)) {
        router.replace('/forbidden');
      }
    }
  }, [isLoading, user, session, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user && isAuthenticated()) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!session?.company?.id || !session?.warehouse?.id) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-slate-900">Session incomplete</p>
          <p className="text-sm text-slate-500 mt-2">
            No active company or warehouse in your session. Contact your administrator or sign in again.
          </p>
        </div>
      </div>
    );
  }

  if (pathname !== '/forbidden' && !hasRouteAccess(pathname, user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
