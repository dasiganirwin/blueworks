'use client';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function WorkerLayout({ children }) {
  const { loading, user } = useAuth('worker');
  if (loading || !user || user.role !== 'worker') {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  return (
    <>
      <Navbar />
      <ErrorBoundary dashboardPath="/worker/dashboard">
        <main>{children}</main>
      </ErrorBoundary>
    </>
  );
}
