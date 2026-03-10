import { Client, Databases, Query } from 'node-appwrite';
import { NextResponse } from 'next/server';

const DATABASE_ID = 'pool-league';
const COLLECTIONS = {
  PROFILES: 'profiles',
  MATCHES: 'matches',
  LEAGUES: 'leagues',
  LEAGUE_MEMBERS: 'league_members',
} as const;

function getClient() {
  const client = new Client()
    .setEndpoint('https://appwrite.arsalan.io/v1')
    .setProject('696436a5002d6f83aed7');

  const apiKey = process.env.APPWRITE_API_KEY;
  if (apiKey) {
    client.setKey(apiKey);
  }

  return client;
}

export async function GET() {
  try {
    const client = getClient();
    const databases = new Databases(client);

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

    return NextResponse.json({
      players: profiles.total,
      matches: matches.total,
      leagues: leagues.total,
      members: members.total,
    });
  } catch {
    return NextResponse.json(
      { players: 0, matches: 0, leagues: 0, members: 0 },
      { status: 200 }
    );
  }
}
