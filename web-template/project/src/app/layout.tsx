import type { Metadata } from 'next';
import './globals.css';
import Layout from '@/src/components/Layout';

export const metadata: Metadata = {
  metadataBase: new URL('https://snookerpoolleague.co.uk'),
  title: {
    default: 'Snooker Pool League - Manage Your League Like a Pro',
    template: '%s | Snooker Pool League',
  },
  description:
    'Create leagues, schedule matches, track standings, and challenge players. The ultimate mobile app for managing competitive snooker and pool leagues.',
  keywords: [
    'snooker league',
    'pool league',
    'league management',
    'snooker app',
    'pool app',
    'match tracker',
    'league standings',
    'billiards league',
  ],
  authors: [{ name: 'Snooker Pool League' }],
  openGraph: {
    title: 'Snooker Pool League - Professional League Management',
    description:
      'Create leagues, schedule matches, track standings, and challenge players. The ultimate mobile app for managing competitive snooker and pool leagues.',
    url: 'https://snookerpoolleague.co.uk',
    siteName: 'Snooker Pool League',
    type: 'website',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snooker Pool League - Professional League Management',
    description:
      'Create leagues, schedule matches, track standings, and challenge players.',
  },
  alternates: {
    canonical: 'https://snookerpoolleague.co.uk',
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
