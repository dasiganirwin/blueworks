import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function WorkerCard({ worker, onSelect }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{worker.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{worker.distance_km} km away</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-sm text-gray-700">{worker.rating?.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({worker.completed_jobs} jobs)</span>
          </div>
        </div>
        <Badge status={worker.availability_status} />
      </div>

      {onSelect && (
        <Button className="w-full mt-3" size="sm" onClick={() => onSelect(worker)}>
          Request this Worker
        </Button>
      )}
    </Card>
  );
}
