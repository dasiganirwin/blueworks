'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const CATEGORIES = ['plumber','electrician','carpenter','welder','painter','aircon-tech','mason','general'];

export default function RegisterPage() {
  const [form, setForm]         = useState({ role: 'customer', name: '', email: '', phone: '', password: '' });
  const [skills, setSkills]     = useState([]);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const toggleSkill = (skill) => setSkills(prev =>
    prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register({ ...form, skills: form.role === 'worker' ? skills : undefined });
      router.push(`/verify-otp?phone=${encodeURIComponent(form.phone)}`);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600">BlueWork</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="I am a"
              value={form.role}
              onChange={set('role')}
              options={[
                { value: 'customer', label: 'Customer — I need help' },
                { value: 'worker',   label: 'Worker — I offer services' },
              ]}
            />
            <Input label="Full Name" value={form.name}     onChange={set('name')}     required placeholder="Juan dela Cruz" />
            <Input label="Phone"     value={form.phone}    onChange={set('phone')}    required placeholder="+639171234567" type="tel" />
            <Input label="Email"     value={form.email}    onChange={set('email')}    placeholder="optional" type="email" />
            <Input label="Password"  value={form.password} onChange={set('password')} required placeholder="Min. 8 characters" type="password" />

            {form.role === 'worker' && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Skills (select all that apply)</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        skills.includes(skill)
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'text-gray-600 border-gray-300 hover:border-brand-400'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
