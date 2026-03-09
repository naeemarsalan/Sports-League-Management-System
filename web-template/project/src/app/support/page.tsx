'use client';

import { Mail, MessageCircle, Shield } from 'lucide-react';
import { FadeInSection } from '@/src/components/AnimatedSection';

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <FadeInSection>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Support</h1>
        <p className="text-gray-400 mb-12">
          Need help with the Snooker Pool League app? We&apos;re here to assist.
        </p>
      </FadeInSection>

      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <div className="bg-[#141922] border border-[#34d9c3]/20 rounded-2xl p-8">
          <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
            <Mail className="w-7 h-7 text-[#0a0e14]" />
          </div>
          <h2 className="text-xl font-bold mb-3">Email Support</h2>
          <p className="text-gray-400 mb-4">
            For general questions, bug reports, or account issues, send us an email.
          </p>
          <a
            href="mailto:support@snookerpoolleague.co.uk"
            className="text-[#34d9c3] hover:underline font-semibold"
          >
            support@snookerpoolleague.co.uk
          </a>
        </div>

        <div className="bg-[#141922] border border-[#34d9c3]/20 rounded-2xl p-8">
          <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
            <Shield className="w-7 h-7 text-[#0a0e14]" />
          </div>
          <h2 className="text-xl font-bold mb-3">Report a Concern</h2>
          <p className="text-gray-400 mb-4">
            To report inappropriate content, abusive behaviour, or a safety concern, email us with
            details and we will investigate.
          </p>
          <a
            href="mailto:support@snookerpoolleague.co.uk?subject=Report%20a%20Concern"
            className="text-[#34d9c3] hover:underline font-semibold"
          >
            Report via email
          </a>
        </div>
      </div>

      <div className="bg-[#141922] border border-[#34d9c3]/20 rounded-2xl p-8">
        <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
          <MessageCircle className="w-7 h-7 text-[#0a0e14]" />
        </div>
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: 'How do I create a league?',
              a: 'After signing in, tap "Create League" from the dashboard. Choose a name and description, then share the generated 6-character invite code with your players.',
            },
            {
              q: 'How do I join a league?',
              a: 'Tap "Join League" and enter the 6-character invite code provided by the league owner or admin. Your request will be reviewed by the league administrators.',
            },
            {
              q: 'How do I delete my account?',
              a: 'Go to Profile and tap "Delete Account". This will permanently remove all your data, including match history and league memberships. This action cannot be undone.',
            },
            {
              q: 'How are leaderboard points calculated?',
              a: 'Wins earn 3 points, draws earn 1 point, and losses earn 0 points. Players are ranked by total points within each league.',
            },
            {
              q: 'Can I be in multiple leagues?',
              a: 'Yes, you can join and participate in multiple leagues simultaneously. Each league has its own separate leaderboard and match history.',
            },
          ].map((faq, index) => (
            <div key={index} className="border-b border-gray-800 last:border-0 pb-4 last:pb-0">
              <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
              <p className="text-gray-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
