'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const CATEGORIES = ['plumber','electrician','carpenter','welder','painter','aircon-tech','mason','general'];

export default function NewJobPage() {
  const params = useSearchParams();
  const [form, setForm] = useState({
    category:    params.get('category') ?? 'plumber',
    description: '',
    address:     '',
    lat:         '',
    lng:         '',
    urgency:     'immediate',
    scheduled_at:'',
  });
  const [photos, setPhotos]   = useState([]);
  const [photoError, setPhotoError] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photoError) return;
    setError('');
    setLoading(true);
    try {
      const body = {
        category:    form.category,
        description: form.description,
        location: {
          address: form.address,
          lat:     parseFloat(form.lat) || 14.5995,
          lng:     parseFloat(form.lng) || 120.9842,
        },
        urgency:     form.urgency,
        ...(form.urgency === 'scheduled' && { scheduled_at: form.scheduled_at }),
      };
      const { data: job } = await jobsApi.create(body);

      // Upload photos if any
      if (photos.length) {
        const fd = new FormData();
        photos.forEach(f => fd.append('photos', f));
        await jobsApi.uploadPhotos(job.id, fd);
      }

      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Post a Job</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-gray-200 p-5">
        <Select
          label="Service Category"
          value={form.category}
          onChange={set('category')}
          options={CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
          required
        />
        <Textarea
          label="Describe the job"
          value={form.description}
          onChange={set('description')}
          placeholder="e.g. Leaking pipe under the kitchen sink…"
          required
        />
        <Input
          label="Your address"
          value={form.address}
          onChange={set('address')}
          placeholder="123 Rizal St, Makati City"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Latitude"
            type="number"
            step="any"
            value={form.lat}
            onChange={set('lat')}
            placeholder="e.g. 14.5995"
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            value={form.lng}
            onChange={set('lng')}
            placeholder="e.g. 120.9842"
          />
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          Open Google Maps, right-click your address, and copy the coordinates. Leave blank to use Manila city center.
        </p>
        <Select
          label="Urgency"
          value={form.urgency}
          onChange={set('urgency')}
          options={[
            { value: 'immediate', label: 'Immediate — as soon as possible' },
            { value: 'scheduled', label: 'Scheduled — choose a date & time' },
          ]}
        />
        {form.urgency === 'scheduled' && (
          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            value={form.scheduled_at}
            onChange={set('scheduled_at')}
            required
          />
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Photos (optional, max 5 · 5MB each)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const MAX_SIZE = 5 * 1024 * 1024;
              const selected = Array.from(e.target.files).slice(0, 5);
              const oversized = selected.filter(f => f.size > MAX_SIZE);
              if (oversized.length) {
                setPhotoError(`${oversized.map(f => f.name).join(', ')} exceed${oversized.length === 1 ? 's' : ''} the 5MB limit.`);
                setPhotos([]);
                e.target.value = '';
              } else {
                setPhotoError('');
                setPhotos(selected);
              }
            }}
            className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}
          {photos.length > 0 && <p className="text-xs text-gray-400 mt-1">{photos.length} photo(s) selected</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
        )}

        <Button type="submit" className="w-full" loading={loading}>Post Job</Button>
      </form>
    </div>
  );
}
