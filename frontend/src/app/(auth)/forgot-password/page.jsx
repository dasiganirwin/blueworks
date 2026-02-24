'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
    } finally {
      // Always show success — backend silently ignores unknown emails
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email and we'll send a reset link.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {submitted ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-700">
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
              </p>
              <p className="text-xs text-gray-400">Check your spam folder if you don't see it.</p>
              <Link href="/login" className="text-sm text-brand-600 hover:underline block mt-4">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Send Reset Link
              </Button>
              <p className="text-sm text-center text-gray-500">
                <Link href="/login" className="text-brand-600 hover:underline">Back to Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
