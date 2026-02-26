'use client';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AdminLayout({ children }) {
  const { loading, user } = useAuth('admin');
  if (loading || !user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  return (
    <>
      <Navbar />
      <ErrorBoundary dashboardPath="/admin/dashboard">
        <main>{children}</main>
      </ErrorBoundary>
    </>
  );
}
