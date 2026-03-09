import { Client, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://appwrite.arsalan.io/v1')
  .setProject('696436a5002d6f83aed7');

export const databases = new Databases(client);

export const DATABASE_ID = 'pool-league';
export const COLLECTIONS = {
  PROFILES: 'profiles',
  MATCHES: 'matches',
  LEAGUES: 'leagues',
  LEAGUE_MEMBERS: 'league_members',
} as const;
