import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Snooker Pool League',
  description:
    'Terms of Service for the Snooker Pool League app. Read our terms and conditions for using the league management platform.',
  openGraph: {
    title: 'Terms of Service - Snooker Pool League',
    description:
      'Terms of Service for the Snooker Pool League app.',
    url: 'https://snookerpoolleague.co.uk/terms',
    type: 'website',
  },
  alternates: {
    canonical: 'https://snookerpoolleague.co.uk/terms',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
