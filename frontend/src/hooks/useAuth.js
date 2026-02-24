'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';

export function useAuth(requiredRole) {
  const ctx    = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (ctx.loading) return;
    if (!ctx.user) { router.replace('/login'); return; }
    if (requiredRole && ctx.user.role !== requiredRole) {
      router.replace('/');
    }
  }, [ctx.user, ctx.loading, requiredRole, router]);

  return ctx;
}
