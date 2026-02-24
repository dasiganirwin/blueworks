'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';

const NAV_LINKS = {
  customer: [
    { href: '/dashboard',       label: 'Home' },
    { href: '/jobs',            label: 'My Jobs' },
    { href: '/notifications',   label: 'Notifications' },
  ],
  worker: [
    { href: '/worker/dashboard',    label: 'Home' },
    { href: '/worker/jobs/nearby',  label: 'Find Jobs' },
    { href: '/worker/earnings',     label: 'Earnings' },
  ],
  admin: [
    { href: '/admin/dashboard',  label: 'Overview' },
    { href: '/admin/workers',    label: 'Workers' },
    { href: '/admin/disputes',   label: 'Disputes' },
    { href: '/admin/analytics',  label: 'Analytics' },
  ],
};

export function Navbar() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const links  = NAV_LINKS[user?.role] ?? [];

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-brand-600 text-lg tracking-tight">BlueWork</Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
