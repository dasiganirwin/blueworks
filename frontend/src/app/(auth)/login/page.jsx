'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const ROLE_REDIRECT = { customer: '/dashboard', worker: '/worker/dashboard', admin: '/admin/dashboard' };

const DEV_ACCOUNTS = [
  { label: 'Customer', identifier: 'customer@bluework.app', password: 'password123', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { label: 'Worker',   identifier: '+639881234567',         password: 'password123', color: 'bg-green-50 border-green-200 text-green-700' },
  { label: 'Admin',    identifier: 'admin@bluework.app',    password: 'admin123',    color: 'bg-purple-50 border-purple-200 text-purple-700' },
];

export default function LoginPage() {
  const [form, setForm]     = useState({ identifier: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, login } = useAuthContext();
  const router    = useRouter();

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(ROLE_REDIRECT[user.role] ?? '/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.identifier, form.password);
      router.replace(ROLE_REDIRECT[user.role] ?? '/');
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600">BlueWork</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Phone"
              type="text"
              placeholder="email@example.com or +639..."
              value={form.identifier}
              onChange={(e) => setForm(f => ({ ...f, identifier: e.target.value }))}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline block">
              Forgot password?
            </Link>
            <p className="text-sm text-gray-500">
              No account?{' '}
              <Link href="/register" className="text-brand-600 hover:underline font-medium">Sign up</Link>
            </p>
          </div>
        </div>

        {/* Dev credentials panel */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dev Accounts — click to fill</p>
          <div className="space-y-2">
            {DEV_ACCOUNTS.map(({ label, identifier, password, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => setForm({ identifier, password })}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs ${color} hover:opacity-80 transition-opacity`}
              >
                <span className="font-semibold">{label}</span>
                <span className="ml-2 opacity-70">{identifier}</span>
                <span className="ml-2 opacity-50">/ {password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
