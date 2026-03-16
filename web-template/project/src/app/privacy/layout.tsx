import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Snooker Pool League',
  description:
    'Privacy Policy for the Snooker Pool League app. Learn what data we collect, how it is stored on our self-hosted infrastructure, your rights under UK GDPR, and how to delete your account.',
  openGraph: {
    title: 'Privacy Policy - Snooker Pool League',
    description:
      'Learn what data the Snooker Pool League app collects, how it is stored, and your rights under UK GDPR.',
    url: 'https://snookerpoolleague.co.uk/privacy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy - Snooker Pool League',
    description:
      'Learn what data the Snooker Pool League app collects, how it is stored, and your rights under UK GDPR.',
  },
  alternates: {
    canonical: 'https://snookerpoolleague.co.uk/privacy',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
