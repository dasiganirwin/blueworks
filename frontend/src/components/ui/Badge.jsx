import clsx from 'clsx';

const STATUS_STYLES = {
  pending:     'bg-warning-100 text-warning-700',
  accepted:    'bg-blue-100 text-blue-800',
  en_route:    'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed:   'bg-success-100 text-success-700',
  cancelled:   'bg-gray-100 text-gray-600',
  disputed:    'bg-danger-100 text-danger-700',
  online:      'bg-success-100 text-success-700',
  offline:     'bg-gray-100 text-gray-500',
  busy:        'bg-orange-100 text-orange-700',
  active:      'bg-success-100 text-success-700',
  suspended:   'bg-danger-100 text-danger-700',
  pending_approval: 'bg-warning-100 text-warning-700',
};

const STATUS_LABELS = {
  pending:     'Pending',
  accepted:    'Accepted',
  en_route:    'En Route',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  disputed:    'Disputed',
  online:      'Online',
  offline:     'Offline',
  busy:        'Busy',
  active:      'Active',
  suspended:   'Suspended',
  pending_approval: 'Pending Approval',
};

export function Badge({ status, label, className }) {
  const displayLabel = label ?? STATUS_LABELS[status] ?? status;
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700';

  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', style, className)}>
      {displayLabel}
    </span>
  );
}
