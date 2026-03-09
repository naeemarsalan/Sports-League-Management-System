'use client';

import { useEffect, useState } from 'react';
import { Users, Target, Trophy, UserCheck } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/src/lib/appwrite';
import { Query } from 'appwrite';
import StatsCounter from './StatsCounter';
import { FadeInSection, StaggerContainer, StaggerItem } from './AnimatedSection';

interface Stats {
  players: number;
  matches: number;
  leagues: number;
  members: number;
}

export default function StatsSection() {
  const [stats, setStats] = useState<Stats>({
    players: 0,
    matches: 0,
    leagues: 0,
    members: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [profiles, matches, leagues, members] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [Query.limit(1)]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.MATCHES, [
            Query.equal('isCompleted', true),
            Query.limit(1),
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.LEAGUES, [
            Query.equal('isActive', true),
            Query.limit(1),
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.LEAGUE_MEMBERS, [
            Query.equal('status', 'approved'),
            Query.limit(1),
          ]),
        ]);

        setStats({
          players: profiles.total,
          matches: matches.total,
          leagues: leagues.total,
          members: members.total,
        });
      } catch {
        // Falls back to 0 on error
      }
    }

    fetchStats();
  }, []);

  const statItems = [
    { value: stats.players, label: 'Registered Players', icon: <Users className="w-8 h-8" /> },
    { value: stats.matches, label: 'Matches Completed', icon: <Target className="w-8 h-8" /> },
    { value: stats.leagues, label: 'Active Leagues', icon: <Trophy className="w-8 h-8" /> },
    { value: stats.members, label: 'League Memberships', icon: <UserCheck className="w-8 h-8" /> },
  ];

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#141922]/30 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <FadeInSection className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Growing{' '}
            <span className="bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent">
              Community
            </span>
          </h2>
          <p className="text-gray-400">Real numbers from our platform</p>
        </FadeInSection>
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statItems.map((stat, index) => (
            <StaggerItem key={index}>
              <StatsCounter value={stat.value} label={stat.label} icon={stat.icon} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
