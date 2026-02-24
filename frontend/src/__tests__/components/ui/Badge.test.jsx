import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  const STATUSES = [
    ['pending',          'Pending',          'bg-yellow-100'],
    ['accepted',         'Accepted',         'bg-blue-100'],
    ['en_route',         'En Route',         'bg-indigo-100'],
    ['in_progress',      'In Progress',      'bg-purple-100'],
    ['completed',        'Completed',        'bg-green-100'],
    ['cancelled',        'Cancelled',        'bg-gray-100'],
    ['disputed',         'Disputed',         'bg-red-100'],
    ['online',           'Online',           'bg-green-100'],
    ['offline',          'Offline',          'bg-gray-100'],
    ['busy',             'Busy',             'bg-orange-100'],
    ['active',           'Active',           'bg-green-100'],
    ['suspended',        'Suspended',        'bg-red-100'],
    ['pending_approval', 'Pending Approval', 'bg-yellow-100'],
  ];

  test.each(STATUSES)('status "%s" renders label "%s" with class %s', (status, expectedLabel, cssClass) => {
    render(<Badge status={status} />);
    const badge = screen.getByText(expectedLabel);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(new RegExp(cssClass));
  });

  it('uses custom label over default', () => {
    render(<Badge status="pending" label="Awaiting" />);
    expect(screen.getByText('Awaiting')).toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });

  it('falls back to status string for unknown status', () => {
    render(<Badge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  it('applies default gray style for unknown status', () => {
    render(<Badge status="whatever" />);
    expect(screen.getByText('whatever').className).toMatch(/bg-gray-100/);
  });

  it('merges custom className', () => {
    render(<Badge status="completed" className="ml-2" />);
    expect(screen.getByText('Completed').className).toMatch(/ml-2/);
  });
});
