'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { notificationsApi } from '@/lib/api';
import api from '@/lib/api';

// Convert VAPID public key (base64url) to Uint8Array for pushManager.subscribe()
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

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
    { href: '/worker/profile',      label: 'Profile' },
  ],
  admin: [
    { href: '/admin/dashboard',  label: 'Overview' },
    { href: '/admin/workers',    label: 'Workers' },
    { href: '/admin/disputes',   label: 'Disputes' },
    { href: '/admin/payments',   label: 'Transactions' },
    { href: '/admin/analytics',  label: 'Analytics' },
  ],
};

export function Navbar() {
  const { user, logout } = useAuthContext();
  const router   = useRouter();
  const pathname = usePathname();
  const links    = NAV_LINKS[user?.role] ?? [];

  const navLinkClass = (href) =>
    pathname === href
      ? 'text-sm font-semibold text-brand-600 border-b-2 border-brand-600 transition-colors'
      : 'text-sm text-gray-600 hover:text-brand-600 transition-colors';

  const mobileNavLinkClass = (href) =>
    pathname === href
      ? 'block py-2 text-sm font-semibold text-brand-600 border-b-2 border-brand-600 transition-colors'
      : 'block py-2 text-sm text-gray-700 hover:text-brand-600 transition-colors';

  const [mobileOpen, setMobileOpen]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const drawerRef = useRef(null);

  // S5-07: Fetch unread count on mount + on page visibility regain (no more 30s polling)
  useEffect(() => {
    if (user?.role !== 'customer') return;

    const fetchUnread = async () => {
      try {
        const { data } = await notificationsApi.list({ read: false });
        setUnreadCount(data?.data?.length ?? 0);
      } catch { /* silent */ }
    };

    fetchUnread();

    // Re-fetch when user returns to the tab (replaces polling)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchUnread(); };
    document.addEventListener('visibilitychange', onVisible);

    // Listen for PUSH_RECEIVED messages from the service worker
    const onSwMessage = (e) => { if (e.data?.type === 'PUSH_RECEIVED') fetchUnread(); };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    };
  }, [user?.role]);

  // S5-07: Subscribe to Web Push on mount (fire-and-forget, graceful failure)
  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const subscribePush = async () => {
      try {
        const { data } = await api.get('/push/vapid-public-key');
        if (!data?.key) return;

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) return; // already subscribed

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.key),
        });

        await api.post('/push/subscribe', sub.toJSON());
      } catch { /* ignore — push is optional */ }
    };

    subscribePush();
  }, [user?.id]);

  // Clear badge when user visits /notifications
  useEffect(() => {
    if (pathname === '/notifications') setUnreadCount(0);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeMobile();
    };

    const onClickOutside = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        closeMobile();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [mobileOpen]);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-brand-600 text-lg tracking-tight">BlueWork</Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={navLinkClass(href)}>
              {href === '/notifications' && unreadCount > 0 ? (
                <span className="relative">
                  {label}
                  <span className="absolute -top-2 -right-5 bg-danger-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              ) : label}
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

          {/* Hamburger button — mobile only */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 text-gray-600 hover:text-brand-600 transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          ref={drawerRef}
          className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-1"
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMobile}
              className={mobileNavLinkClass(href)}
            >
              {href === '/notifications' && unreadCount > 0 ? (
                <span className="flex items-center gap-2">
                  {label}
                  <span className="bg-danger-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              ) : label}
            </Link>
          ))}
          {user?.name && (
            <p className="pt-2 pb-1 text-xs text-gray-400 border-t border-gray-100 mt-1">{user.name}</p>
          )}
        </div>
      )}
    </nav>
  );
}
