import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/formatDate';

export function JobCard({ job, onClick }) {
  const date = formatDateTime(job.created_at);

  return (
    <Card onClick={onClick} className="hover:border-brand-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">{job.category}</span>
            {job.urgency === 'immediate' && (
              <span className="text-xs text-orange-600 font-medium">• Urgent</span>
            )}
          </div>
          <p className="text-sm text-gray-800 line-clamp-2">{job.description}</p>
          <p className="text-xs text-gray-400 mt-2 truncate">{job.location_address}</p>
          <p className="text-xs text-gray-400">{date}</p>
        </div>
        <Badge status={job.status} />
      </div>
    </Card>
  );
}
