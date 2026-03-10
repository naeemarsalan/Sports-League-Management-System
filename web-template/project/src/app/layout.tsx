import type { Metadata } from 'next';
import './globals.css';
import Layout from '@/src/components/Layout';

export const metadata: Metadata = {
  title: 'Snooker Pool League - Manage Your League Like a Pro',
  description:
    'Create leagues, schedule matches, track standings, and challenge players. The ultimate mobile app for managing competitive snooker and pool leagues.',
  openGraph: {
    title: 'Snooker Pool League - Professional League Management',
    description:
      'Create leagues, schedule matches, track standings, and challenge players. The ultimate mobile app for managing competitive snooker and pool leagues.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snooker Pool League - Professional League Management',
    description:
      'Create leagues, schedule matches, track standings, and challenge players.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
