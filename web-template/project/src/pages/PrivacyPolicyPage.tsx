export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-gray-400 mb-12">Last updated: March 9, 2026</p>

      <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
          <p>
            Snooker Pool League ("we", "us", or "our") operates the Snooker Pool League mobile
            application (the "App"). This Privacy Policy explains what data we collect, how we use
            it, and your rights regarding your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
          <p>We collect only the data necessary to provide the App's functionality:</p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#34d9c3]/20">
                  <th className="py-3 pr-4 text-[#34d9c3] font-semibold">Data</th>
                  <th className="py-3 pr-4 text-[#34d9c3] font-semibold">Purpose</th>
                  <th className="py-3 text-[#34d9c3] font-semibold">Visibility</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Email address</td>
                  <td className="py-3 pr-4">Authentication only</td>
                  <td className="py-3">Never shown to other users</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Display name</td>
                  <td className="py-3 pr-4">In-app identity</td>
                  <td className="py-3">Visible to league members</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">User ID</td>
                  <td className="py-3 pr-4">Internal reference</td>
                  <td className="py-3">Not exposed to other users</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Match scores</td>
                  <td className="py-3 pr-4">Core functionality</td>
                  <td className="py-3">Visible to league members</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">League membership &amp; roles</td>
                  <td className="py-3 pr-4">Core functionality</td>
                  <td className="py-3">Visible to league members</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Win/loss/draw records</td>
                  <td className="py-3 pr-4">Leaderboard</td>
                  <td className="py-3">Visible to league members</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 pr-4">Push notification token</td>
                  <td className="py-3 pr-4">Sending notifications</td>
                  <td className="py-3">Not shared with anyone</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Data We Do NOT Collect</h2>
          <p>
            We do <strong className="text-white">not</strong> collect any of the following: analytics
            or tracking data, location data, contacts, photos or media, financial or payment
            information, browsing history, advertising identifiers, health or fitness data, or
            diagnostics/usage data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. How Your Data Is Stored</h2>
          <p>
            All data is stored on our self-hosted{' '}
            <strong className="text-white">Appwrite</strong> instance at{' '}
            <code className="text-[#34d9c3] bg-[#141922] px-2 py-1 rounded">appwrite.arsalan.io</code>.
            We do not use any third-party cloud databases or analytics services. Your data never
            leaves our infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Data Sharing</h2>
          <p>
            We do <strong className="text-white">not</strong> sell, rent, or share your personal data
            with any third parties. Your data is used solely to provide the App's functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. Account Deletion</h2>
          <p>
            You can delete your account at any time from the <strong className="text-white">Profile</strong> screen
            in the App. Deleting your account will permanently remove all your personal data,
            including your email, display name, match history, and league memberships. This action
            is irreversible.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">7. Children's Privacy</h2>
          <p>
            The App is not directed at children under 13 years of age. We do not knowingly collect
            personal data from children under 13. If you believe a child under 13 has provided us
            with personal data, please contact us so we can delete it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">8. Your Rights Under GDPR</h2>
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
            complaint with the UK Information Commissioner's Office (ICO) at{' '}
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
          <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be posted on this
            page with an updated "Last updated" date. Continued use of the App after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
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
