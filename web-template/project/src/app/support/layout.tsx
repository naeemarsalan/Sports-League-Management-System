import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support - Snooker Pool League',
  description:
    'Get help with the Snooker Pool League app. Contact our support team for assistance with leagues, matches, and account issues.',
  openGraph: {
    title: 'Support - Snooker Pool League',
    description:
      'Get help with the Snooker Pool League app. Contact our support team.',
    url: 'https://snookerpoolleague.co.uk/support',
    type: 'website',
  },
  alternates: {
    canonical: 'https://snookerpoolleague.co.uk/support',
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
