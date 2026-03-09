'use client';

import Link from 'next/link';
import {
  Shield, Trophy, Target, Bell, UserCheck,
  ChevronRight, Download, CheckCircle, XCircle, ArrowUpDown,
} from 'lucide-react';
import { FadeInSection } from '@/src/components/AnimatedSection';

const permissions = [
  { action: 'View League', player: true, mod: true, admin: true, owner: true },
  { action: 'Edit Own Match', player: true, mod: true, admin: true, owner: true },
  { action: 'Create Match', player: false, mod: true, admin: true, owner: true },
  { action: 'Edit Any Match', player: false, mod: true, admin: true, owner: true },
  { action: 'Approve Members', player: false, mod: false, admin: true, owner: true },
  { action: 'Promote to Mod', player: false, mod: false, admin: true, owner: true },
  { action: 'Promote to Admin', player: false, mod: false, admin: false, owner: true },
  { action: 'Edit League Settings', player: false, mod: false, admin: true, owner: true },
  { action: 'Delete League', player: false, mod: false, admin: false, owner: true },
];

const notificationTypes = [
  { type: 'Challenge Received', description: 'When another player challenges you to a match' },
  { type: 'Match Updated', description: 'When a match you\'re involved in is updated' },
  { type: 'Match Completed', description: 'When a match result is finalised' },
  { type: 'Join Request', description: 'When a player requests to join your league (admin/owner)' },
  { type: 'Request Approved', description: 'When your join request is approved' },
  { type: 'Position Overtaken', description: 'When another player overtakes you on the leaderboard' },
  { type: 'Admin Broadcast', description: 'When a league admin sends a broadcast message' },
];

function PermCheck({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <CheckCircle className="w-5 h-5 text-[#34d9c3]" />
  ) : (
    <XCircle className="w-5 h-5 text-gray-600" />
  );
}

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Header */}
      <FadeInSection>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Knowledge Base</h1>
        <p className="text-gray-400 mb-4 text-lg">
          Everything you need to know about using the Snooker Pool League app.
        </p>
        <p className="text-gray-500 mb-12">
          This guide covers all features of the mobile app — from creating your first league to
          understanding the leaderboard system and push notifications.
        </p>
      </FadeInSection>

      <div className="space-y-12">
        {/* Getting Started */}
        <FadeInSection>
          <div className="bg-[#141922] border border-[#34d9c3]/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-10 h-10 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-[#0a0e14]" />
              </div>
              <h2 className="text-2xl font-bold">Getting Started</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="flex gap-3">
                <span className="text-[#34d9c3] font-bold text-lg mt-0.5">1.</span>
                <div>
                  <h3 className="font-semibold text-white">Download the App</h3>
                  <p className="text-gray-400">Available on iOS (App Store) and Android (Google Play). Search for &ldquo;Snooker Pool League&rdquo;.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-[#34d9c3] font-bold text-lg mt-0.5">2.</span>
                <div>
                  <h3 className="font-semibold text-white">Create an Account</h3>
                  <p className="text-gray-400">Sign up with your email address and choose a display name. This name will be visible to other league members.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-[#34d9c3] font-bold text-lg mt-0.5">3.</span>
                <div>
                  <h3 className="font-semibold text-white">Create or Join a League</h3>
                  <p className="text-gray-400">
                    <strong className="text-white">Create a league:</strong> Tap &ldquo;Create League&rdquo; from the dashboard, enter a name and description, and share the generated 6-character invite code.
                  </p>
                  <p className="text-gray-400 mt-1">
                    <strong className="text-white">Join a league:</strong> Tap &ldquo;Join League&rdquo;, enter the invite code, and wait for an admin to approve your request.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Leagues */}
        <FadeInSection>
          <div className="bg-[#141922] border border-[#34d9c3]/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-10 h-10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#0a0e14]" />
              </div>
              <h2 className="text-2xl font-bold">Leagues</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white mb-1">Creating a League</h3>
                <p className="text-gray-400">
                  Any registered user can create a league. You&apos;ll become the <strong className="text-white">Owner</strong> with
                  full control over league settings, members, and matches. Each league gets a unique
                  6-character invite code that you share with players.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Invite Codes</h3>
                <p className="text-gray-400">
                  Invite codes are 6-character alphanumeric codes (e.g., <code className="text-[#34d9c3] bg-[#0a0e14] px-2 py-0.5 rounded">ABC123</code>).
                  Share this code with players who want to join. The code is shown in your league settings.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">League Settings</h3>
                <p className="text-gray-400">
                  Owners and admins can edit league settings including the league name, description, and active status.
                  Setting a league to inactive hides it from active views but preserves all data.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Multiple Leagues</h3>
                <p className="text-gray-400">
                  You can be a member of multiple leagues simultaneously. Each league has its own
                  leaderboard, match history, and member list.
                </p>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Roles & Permissions */}
        <FadeInSection>
          <div className="bg-[#141922] border border-[#34d9c3]/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-10 h-10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#0a0e14]" />
              </div>
              <h2 className="text-2xl font-bold">Roles & Permissions</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Each league has a hierarchy of four roles. Higher roles inherit all permissions of lower roles.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { role: 'Player', desc: 'Base role — can view league and edit own matches' },
                { role: 'Mod', desc: 'Can create and edit any match' },
                { role: 'Admin', desc: 'Can approve members, promote to mod, edit settings' },
                { role: 'Owner', desc: 'Full control — can promote to admin, delete league' },
              ].map((r) => (
                <div key={r.role} className="bg-[#0a0e14] border border-[#34d9c3]/10 rounded-xl px-4 py-3 flex-1 min-w-[200px]">
                  <span className="text-[#34d9c3] font-semibold">{r.role}</span>
                  <p className="text-gray-500 text-sm mt-1">{r.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-white mb-3">Permission Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#34d9c3]/20">
                    <th className="py-3 pr-4 text-[#34d9c3] font-semibold">Action</th>
                    <th className="py-3 px-3 text-center text-[#34d9c3] font-semibold">Player</th>
                    <th className="py-3 px-3 text-center text-[#34d9c3] font-semibold">Mod</th>
                    <th className="py-3 px-3 text-center text-[#34d9c3] font-semibold">Admin</th>
                    <th className="py-3 px-3 text-center text-[#34d9c3] font-semibold">Owner</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {permissions.map((perm) => (
                    <tr key={perm.action} className="border-b border-gray-800/50">
                      <td className="py-2.5 pr-4 text-gray-300">{perm.action}</td>
                      <td className="py-2.5 px-3 text-center"><PermCheck allowed={perm.player} /></td>
                      <td className="py-2.5 px-3 text-center"><PermCheck allowed={perm.mod} /></td>
                      <td className="py-2.5 px-3 text-center"><PermCheck allowed={perm.admin} /></td>
                      <td className="py-2.5 px-3 text-center"><PermCheck allowed={perm.owner} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeInSection>

        {/* Matches */}
        <FadeInSection>
          <div className="bg-[#141922] border border-[#34d9c3]/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-10 h-10 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-[#0a0e14]" />
              </div>
              <h2 className="text-2xl font-bold">Matches</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white mb-1">Creating Matches</h3>
                <p className="text-gray-400">
                  Matches can be created by users with <strong className="text-white">Mod</strong> role or higher.
                  Select two players from the league and set up the match. The opponent (Player 2) receives
                  a push notification when a match is created.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Scoring</h3>
                <p className="text-gray-400">
                  Each match has scores for Player 1 and Player 2. Scores are recorded as frames won
                  (e.g., 3-2). Either player involved in the match can update their own match score,
                  while mods, admins, and owners can edit any match.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Completing a Match</h3>
                <p className="text-gray-400">
                  When a match is marked as completed, the scores become final and are used for
                  leaderboard calculations. The winner gets 3 points, a draw gives both players 1 point,
                  and the loser gets 0 points. Both players are notified when a match is completed.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Match Views</h3>
                <p className="text-gray-400">
                  Matches can be filtered by status (upcoming/completed), by player, or by week.
                  This makes it easy to track your recent results or see upcoming fixtures.
                </p>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Leaderboard */}
        <FadeInSection>
          <div className="bg-[#141922] border border-[#34d9c3]/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-10 h-10 rounded-lg flex items-center justify-center">
                <ArrowUpDown className="w-5 h-5 text-[#0a0e14]" />
              </div>
              <h2 className="text-2xl font-bold">Leaderboard</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white mb-1">Points System</h3>
                <div className="grid grid-cols-3 gap-3 mt-2 mb-3">
                  <div className="bg-[#0a0e14] rounded-xl p-4 text-center border border-[#34d9c3]/10">
                    <span className="text-3xl font-bold text-[#34d9c3]">3</span>
                    <p className="text-gray-400 text-sm mt-1">points per win</p>
                  </div>
                  <div className="bg-[#0a0e14] rounded-xl p-4 text-center border border-[#34d9c3]/10">
                    <span className="text-3xl font-bold text-[#34d9c3]">1</span>
                    <p className="text-gray-400 text-sm mt-1">point per draw</p>
                  </div>
                  <div className="bg-[#0a0e14] rounded-xl p-4 text-center border border-[#34d9c3]/10">
                    <span className="text-3xl font-bold text-[#34d9c3]">0</span>
                    <p className="text-gray-400 text-sm mt-1">points per loss</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Sorting & Tiebreakers</h3>
                <p className="text-gray-400">Players are ranked using the following priority:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-400">
                  <li><strong className="text-white">Total points</strong> (descending)</li>
                  <li><strong className="text-white">Number of wins</strong> (descending)</li>
                  <li><strong className="text-white">Player name</strong> (alphabetical)</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Standings Display</h3>
                <p className="text-gray-400">
                  The leaderboard shows each player&apos;s position, games played, wins, draws, losses, and
                  total points. The top 3 players receive gold, silver, and bronze position badges.
                  Only approved league members appear on the leaderboard.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Position Notifications</h3>
                <p className="text-gray-400">
                  When a match result causes a player to move up in the standings, any players who were
                  overtaken receive a push notification letting them know their position has changed.
                </p>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Membership */}
        <FadeInSection>
          <div className="bg-[#141922] border border-[#34d9c3]/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-10 h-10 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-[#0a0e14]" />
              </div>
              <h2 className="text-2xl font-bold">Membership</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white mb-1">Joining a League</h3>
                <p className="text-gray-400">
                  To join a league, enter the 6-character invite code. Your request goes to a
                  &ldquo;pending&rdquo; state. Admins and owners will see your request and can approve or reject it.
                  You&apos;ll receive a notification when your request is approved.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Approval Flow</h3>
                <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
                  <span className="bg-[#0a0e14] text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700">Player requests</span>
                  <ChevronRight className="w-4 h-4 text-[#34d9c3]" />
                  <span className="bg-[#0a0e14] text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700">Status: Pending</span>
                  <ChevronRight className="w-4 h-4 text-[#34d9c3]" />
                  <span className="bg-[#0a0e14] text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700">Admin reviews</span>
                  <ChevronRight className="w-4 h-4 text-[#34d9c3]" />
                  <span className="bg-[#0a0e14] text-[#34d9c3] px-3 py-1.5 rounded-lg border border-[#34d9c3]/30">Approved / Rejected</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Member Management</h3>
                <p className="text-gray-400">
                  Admins and owners can remove members from the league, promote players to Mod,
                  and manage roles. Owners can additionally promote members to Admin and transfer
                  ownership. Members can also leave a league voluntarily at any time.
                </p>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Push Notifications */}
        <FadeInSection>
          <div className="bg-[#141922] border border-[#34d9c3]/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-10 h-10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#0a0e14]" />
              </div>
              <h2 className="text-2xl font-bold">Push Notifications</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p className="text-gray-400">
                The app sends push notifications to keep you informed about league activity.
                Notifications require an iOS or Android device with notification permissions enabled.
              </p>

              <h3 className="font-semibold text-white mb-2">Notification Types</h3>
              <div className="space-y-2">
                {notificationTypes.map((notif) => (
                  <div key={notif.type} className="flex items-start gap-3 bg-[#0a0e14] rounded-xl px-4 py-3 border border-[#34d9c3]/5">
                    <Bell className="w-4 h-4 text-[#34d9c3] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-white font-medium">{notif.type}</span>
                      <p className="text-gray-500 text-sm">{notif.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-white mb-1">Rate Limits</h3>
                <p className="text-gray-400">
                  Notifications are sent via Expo Push Notification Service with rate limiting to
                  prevent spam. Each notification type is sent once per relevant event.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">Device Requirements</h3>
                <p className="text-gray-400">
                  Push notifications require a physical iOS or Android device (not available on
                  simulators/emulators). You&apos;ll be prompted to allow notifications when you first
                  open the app. You can manage notification permissions in your device settings.
                </p>
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Back to home */}
      <FadeInSection>
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">Still have questions?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
              className="text-[#34d9c3] hover:underline font-semibold"
            >
              Visit Support &rarr;
            </Link>
            <a
              href="mailto:support@snookerpoolleague.co.uk"
              className="text-[#34d9c3] hover:underline font-semibold"
            >
              Email Us &rarr;
            </a>
          </div>
        </div>
      </FadeInSection>
    </div>
  );
}
