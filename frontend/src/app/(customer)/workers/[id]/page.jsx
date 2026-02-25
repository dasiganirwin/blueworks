'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { workersApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const CATEGORY_LABELS = {
  plumber:      'Plumber',
  electrician:  'Electrician',
  carpenter:    'Carpenter',
  welder:       'Welder',
  painter:      'Painter',
  'aircon-tech':'Aircon Technician',
  mason:        'Mason',
  general:      'General Labor',
};

export default function WorkerProfilePage() {
  const { id } = useParams();
  const [worker, setWorker]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workersApi.getById(id)
      .then(({ data }) => setWorker(data))
      .catch(() => setWorker(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page-container space-y-3">
      <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );

  if (!worker) return (
    <div className="page-container">
      <p className="text-gray-500 text-sm">Worker not found.</p>
    </div>
  );

  return (
    <div className="page-container space-y-4">
      <Link href="/jobs" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-3">
        ← Back to My Jobs
      </Link>
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link href="/dashboard" className="hover:text-brand-600">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Worker Profile</span>
      </nav>

      {/* Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{worker.name}</h1>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm font-medium text-gray-700">
                {worker.rating ? worker.rating.toFixed(1) : 'No ratings yet'}
              </span>
            </div>
          </div>
          <Badge status={worker.availability_status} />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-gray-500">Jobs Completed</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{worker.completed_jobs ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Rating</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">
            {worker.rating ? `${worker.rating.toFixed(1)} ★` : '—'}
          </p>
        </Card>
      </div>

      {/* Skills */}
      {worker.skills?.length > 0 && (
        <Card>
          <p className="text-xs text-gray-500 mb-2">Skills & Services</p>
          <div className="flex flex-wrap gap-2">
            {worker.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded-full"
              >
                {CATEGORY_LABELS[skill] ?? skill}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
