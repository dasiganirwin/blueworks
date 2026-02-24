import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'BlueWork',
  description: 'On-demand skilled workers, fast.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
