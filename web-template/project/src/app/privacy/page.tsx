'use client';

import { FadeInSection } from '@/src/components/AnimatedSection';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy',
  description:
    'Privacy Policy for the Snooker Pool League app. Learn what data we collect, how it is stored, and your rights.',
  url: 'https://snookerpoolleague.co.uk/privacy',
  inLanguage: 'en-GB',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Snooker Pool League',
    url: 'https://snookerpoolleague.co.uk',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Snooker Pool League',
    url: 'https://snookerpoolleague.co.uk',
    email: 'support@snookerpoolleague.co.uk',
  },
  dateModified: '2026-03-10',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FadeInSection>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: March 10, 2026</p>
      </FadeInSection>

      <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
          <p>
            Snooker Pool League (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the Snooker Pool League mobile
            application (the &ldquo;App&rdquo;). This Privacy Policy explains what data we collect, how we use
            it, and your rights regarding your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
          <p>We collect only the data necessary to provide the App&apos;s functionality:</p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#34d9c3]/20">
                  <th className="py-3 pr-4 text-[#34d9c3] font-semibold">Data</th>
                  <th className="py-3 pr-4 text-[#34d9c3] font-semibold">Purpose</th>
                  <th className="py-3 pr-4 text-[#34d9c3] font-semibold">Visibility</th>
                  <th className="py-3 pr-4 text-[#34d9c3] font-semibold">Apple Category</th>
                  <th className="py-3 pr-4 text-[#34d9c3] font-semibold">Linked to Identity</th>
                  <th className="py-3 text-[#34d9c3] font-semibold">Used for Tracking</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Email address</td>
                  <td className="py-3 pr-4">Authentication only</td>
                  <td className="py-3 pr-4">Never shown to other users</td>
                  <td className="py-3 pr-4">Contact Info — Email Address</td>
                  <td className="py-3 pr-4">Yes</td>
                  <td className="py-3">No</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Display name</td>
                  <td className="py-3 pr-4">In-app identity</td>
                  <td className="py-3 pr-4">Visible to league members</td>
                  <td className="py-3 pr-4">Contact Info — Name</td>
                  <td className="py-3 pr-4">Yes</td>
                  <td className="py-3">No</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">User ID</td>
                  <td className="py-3 pr-4">Internal reference</td>
                  <td className="py-3 pr-4">Not exposed to other users</td>
                  <td className="py-3 pr-4">Identifiers — User ID</td>
                  <td className="py-3 pr-4">Yes</td>
                  <td className="py-3">No</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Match scores</td>
                  <td className="py-3 pr-4">Core functionality</td>
                  <td className="py-3 pr-4">Visible to league members</td>
                  <td className="py-3 pr-4">User Content — Gameplay Content</td>
                  <td className="py-3 pr-4">Yes</td>
                  <td className="py-3">No</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">League membership &amp; roles</td>
                  <td className="py-3 pr-4">Core functionality</td>
                  <td className="py-3 pr-4">Visible to league members</td>
                  <td className="py-3 pr-4">User Content — Other User Content</td>
                  <td className="py-3 pr-4">Yes</td>
                  <td className="py-3">No</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Win/loss/draw records</td>
                  <td className="py-3 pr-4">Leaderboard</td>
                  <td className="py-3 pr-4">Visible to league members</td>
                  <td className="py-3 pr-4">User Content — Gameplay Content</td>
                  <td className="py-3 pr-4">Yes</td>
                  <td className="py-3">No</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Push notification token</td>
                  <td className="py-3 pr-4">Sending notifications</td>
                  <td className="py-3 pr-4">Not shared with anyone</td>
                  <td className="py-3 pr-4">Identifiers — Device ID</td>
                  <td className="py-3 pr-4">Yes</td>
                  <td className="py-3">No</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            None of this data is used for tracking as defined by Apple&apos;s App Tracking Transparency framework.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Data We Do NOT Collect</h2>
          <p>
            We do <strong className="text-white">not</strong> collect any of the following:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
            <li>Analytics or usage data</li>
            <li>Tracking or advertising identifiers</li>
            <li>Location data (precise or coarse)</li>
            <li>Contacts or address book data</li>
            <li>Photos, videos, or media</li>
            <li>Financial or payment information</li>
            <li>Browsing or search history</li>
            <li>Health or fitness data</li>
            <li>Diagnostics, crash logs, or performance data</li>
            <li>Device information beyond push notification tokens</li>
            <li>Audio, phone, or call data</li>
            <li>Sensitive information (religious, political, sexual orientation, etc.)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. How Your Data Is Stored</h2>
          <p>
            All data is stored on our self-hosted infrastructure at{' '}
            <strong className="text-white">snookerpoolleague.co.uk</strong>, powered by{' '}
            <strong className="text-white">Appwrite</strong> (an open-source backend platform).
            We do not use any third-party cloud databases or analytics services. Your data never
            leaves our infrastructure except as described in Section 5.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>
          <p>
            The only third-party service we use is{' '}
            <strong className="text-white">Apple Push Notification service (APNs)</strong> to deliver
            push notifications to your device. When you enable push notifications, your device&apos;s
            push token is sent to Apple so that we can deliver notifications to you.
          </p>
          <p className="mt-2">
            Apple&apos;s privacy policy is available at{' '}
            <a
              href="https://www.apple.com/legal/privacy/"
              className="text-[#34d9c3] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              apple.com/legal/privacy
            </a>.
          </p>
          <p className="mt-2">
            We do <strong className="text-white">not</strong> use any other third-party SDKs,
            analytics services, advertising networks, or tracking tools.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. Data Sharing</h2>
          <p>
            We do <strong className="text-white">not</strong> sell, rent, or share your personal data
            with any third parties for marketing or advertising purposes. The only data shared
            externally is your device&apos;s push notification token, which is sent to Apple&apos;s Push
            Notification service (APNs) solely for the purpose of delivering notifications.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
          <p>
            Your data is retained for as long as your account is active. When you delete your account,
            all associated data is permanently deleted immediately. We do not maintain backup copies
            of deleted account data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">8. Account &amp; Data Deletion</h2>
          <p>You can delete your account and all associated data in two ways:</p>
          <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
            <li>
              <strong className="text-white">In the App</strong> — go to the{' '}
              <strong className="text-white">Profile</strong> screen and select &ldquo;Delete Account&rdquo;
            </li>
            <li>
              <strong className="text-white">By email</strong> — send a request to{' '}
              <a href="mailto:support@snookerpoolleague.co.uk" className="text-[#34d9c3] hover:underline">
                support@snookerpoolleague.co.uk
              </a>{' '}
              and we will process it within 30 days
            </li>
          </ul>
          <p className="mt-4">
            When your account is deleted, the following data is permanently removed:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
            <li>Email address</li>
            <li>Display name</li>
            <li>User ID and authentication credentials</li>
            <li>Match scores and win/loss/draw records</li>
            <li>League memberships and roles</li>
            <li>Push notification token</li>
          </ul>
          <p className="mt-2">This action is irreversible.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">9. Children&apos;s Privacy</h2>
          <p>
            The App is not directed at children under 13 years of age. In accordance with the
            Children&apos;s Online Privacy Protection Act (COPPA), we do not knowingly collect personal
            data from children under 13. If you believe a child under 13 has provided us with
            personal data, please contact us so we can delete it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">10. Your Rights Under UK GDPR</h2>
          <p>
            Under the UK General Data Protection Regulation (UK GDPR), we process your personal data
            on the lawful bases of contract performance (providing the App and its features) and
            consent (given at registration).
          </p>
          <p className="mt-2">You have the following rights regarding your personal data:</p>
          <ul className="list-disc list-inside mt-2 space-y-2 text-gray-400">
            <li><strong className="text-white">Right of access</strong> — request a copy of the data we hold about you</li>
            <li><strong className="text-white">Right to rectification</strong> — correct inaccurate data (edit your display name in-app)</li>
            <li><strong className="text-white">Right to erasure</strong> — delete your account and all data from the Profile screen</li>
            <li><strong className="text-white">Right to restriction of processing</strong> — request that we limit how we use your data</li>
            <li><strong className="text-white">Right to data portability</strong> — request your data in a portable format</li>
            <li><strong className="text-white">Right to object</strong> — object to the processing of your personal data</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:support@snookerpoolleague.co.uk" className="text-[#34d9c3] hover:underline">
              support@snookerpoolleague.co.uk
            </a>{' '}
            or use the in-app features (edit display name, delete account).
          </p>
          <p className="mt-2">
            If you are not satisfied with how we handle your data, you have the right to lodge a
            complaint with the UK Information Commissioner&apos;s Office (ICO) at{' '}
            <a href="https://ico.org.uk" className="text-[#34d9c3] hover:underline" target="_blank" rel="noopener noreferrer">
              ico.org.uk
            </a>.
          </p>
          <p className="mt-2">
            The data controller is Snooker Pool League. Contact:{' '}
            <a href="mailto:support@snookerpoolleague.co.uk" className="text-[#34d9c3] hover:underline">
              support@snookerpoolleague.co.uk
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">11. Security</h2>
          <p>
            We take appropriate measures to protect your data. All communication between the App and
            our servers is encrypted using <strong className="text-white">HTTPS/TLS</strong>. Database
            access is restricted and protected by authentication controls. Only authorised personnel
            have access to the server infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be posted on this
            page with an updated &ldquo;Last updated&rdquo; date. Continued use of the App after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or your data, please contact
            us at{' '}
            <a
              href="mailto:support@snookerpoolleague.co.uk"
              className="text-[#34d9c3] hover:underline"
            >
              support@snookerpoolleague.co.uk
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
