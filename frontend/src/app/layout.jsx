import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'BlueWork',
  description: 'On-demand skilled workers, fast.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BlueWork',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1d4ed8',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-brand-600 focus:px-3 focus:py-2 focus:rounded-lg focus:shadow-lg focus:font-medium focus:text-sm"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <ToastProvider>
            <div id="main-content">
              {children}
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
