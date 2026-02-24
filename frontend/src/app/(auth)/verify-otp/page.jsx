'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

const ROLE_REDIRECT = { customer: '/dashboard', worker: '/worker/dashboard' };

export default function VerifyOTPPage() {
  const [otp, setOtp]           = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const params  = useSearchParams();
  const phone   = params.get('phone') ?? '';
  const { updateUser } = useAuthContext();
  const router  = useRouter();

  useEffect(() => {
    if (!phone) router.replace('/register');
  }, [phone, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.verifyOTP(phone, otp);
      localStorage.setItem('access_token',  data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      updateUser(data.user);
      router.replace(ROLE_REDIRECT[data.user?.role] ?? '/');
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.sendOTP(phone);
      setCountdown(60);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Verify your phone</h1>
          <p className="text-gray-500 text-sm mt-1">We sent a 6-digit code to <strong>{phone}</strong></p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-3xl tracking-[0.5em] font-mono border border-gray-300 rounded-xl py-4 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg text-center">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading} disabled={otp.length < 6}>
              Verify
            </Button>
          </form>

          <div className="mt-4 text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-400">Resend in {countdown}s</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-brand-600 hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
