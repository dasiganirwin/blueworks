'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { workersApi, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

const ALL_SKILLS = [
  { value: 'plumber',      label: 'Plumber' },
  { value: 'electrician',  label: 'Electrician' },
  { value: 'carpenter',    label: 'Carpenter' },
  { value: 'welder',       label: 'Welder' },
  { value: 'painter',      label: 'Painter' },
  { value: 'aircon-tech',  label: 'Aircon Technician' },
  { value: 'mason',        label: 'Mason' },
  { value: 'general',      label: 'General Labor' },
];

export default function WorkerProfileEditPage() {
  const { showToast } = useToast();
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [name, setName]           = useState('');
  const [skills, setSkills]       = useState([]);

  useEffect(() => {
    workersApi.getMe()
      .then(({ data }) => {
        setName(data.name ?? '');
        setSkills(data.skills ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleSkill = (value) => {
    setSkills(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast('Name is required.', 'error'); return; }
    if (skills.length === 0) { showToast('Select at least one skill.', 'error'); return; }
    setSaving(true);
    try {
      await workersApi.updateMe({ name: name.trim(), skills });
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error?.message ?? 'Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page-container space-y-3">
      <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );

  return (
    <div className="page-container space-y-4">
      <Link href="/worker/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-3">
        ← Back to Dashboard
      </Link>
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link href="/worker/dashboard" className="hover:text-brand-600">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Edit Profile</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>

      {/* Name */}
      <Card>
        <label className="text-xs text-gray-500 block mb-1" htmlFor="worker-name">Display Name</label>
        <input
          id="worker-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your full name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </Card>

      {/* Skills */}
      <Card>
        <p className="text-xs text-gray-500 mb-3">Skills & Services <span className="text-danger-600">*</span></p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_SKILLS.map(({ value, label }) => (
            <label
              key={value}
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                skills.includes(value)
                  ? 'bg-brand-50 border-brand-400 text-brand-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300'
              }`}
            >
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={skills.includes(value)}
                onChange={() => toggleSkill(value)}
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
        {skills.length === 0 && (
          <p className="text-xs text-danger-600 mt-2">Select at least one skill.</p>
        )}
      </Card>

      <Button className="w-full" loading={saving} disabled={skills.length === 0} onClick={handleSave}>
        Save Profile
      </Button>
    </div>
  );
}
