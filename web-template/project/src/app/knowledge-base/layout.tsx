import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Base - Snooker Pool League',
  description:
    'Learn how to use the Snooker Pool League app. Guides for creating leagues, managing matches, tracking standings, and more.',
  openGraph: {
    title: 'Knowledge Base - Snooker Pool League',
    description:
      'Learn how to use the Snooker Pool League app. Guides and tutorials.',
    url: 'https://snookerpoolleague.co.uk/knowledge-base',
    type: 'website',
  },
  alternates: {
    canonical: 'https://snookerpoolleague.co.uk/knowledge-base',
  },
};

export default function KnowledgeBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
